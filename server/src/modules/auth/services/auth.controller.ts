import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Req,
	UnauthorizedException,
	UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuth, JwtRefreshTokenGuard } from '../guards';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { UserService } from '@modules/user/user.service';
import { UserFromRequest } from 'src/common/types';
import {
	ChangePasswordDto,
	LoginUserDto,
	RegisterUserDto,
	RequestForgotPasswordInput,
} from '../dto';
import { SESSION_AUTH_KEY } from 'src/common/config/session.config';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
	constructor(private authService: AuthService, private userService: UserService) {}

	@JwtAuth()
	@Get()
	public async me(@Req() req: Request) {
		const userFromRequest: UserFromRequest = req.user;

		const user = await this.userService.findOne({ email: userFromRequest.email });
		if (!user) {
			throw new UnauthorizedException();
		}
		return user;
	}

	@Post('login')
	public async login(@Body() input: LoginUserDto, @Req() req: Request) {
		const user = await this.authService.validateUser(input);
		if (!user) throw new BadRequestException('Invalid credentials');

		const { authToken } = await this.authService.generateAuthToken({ user });
		await this.authService.resetCurrentHashedRefreshToken(
			user.id,
			authToken.refreshToken,
		);
		req.user = user;
		req.session.authToken = authToken;
		return { authToken };
	}

	@Post('register')
	public async register(@Body() input: RegisterUserDto) {
		return await this.authService.register(input);
	}

	@Get('activate/:token')
	public async activeAccount(@Param('token') token: string, @Req() req: Request) {
		const user = await this.authService.activateAccount(token);
		if (!user) {
			throw new BadRequestException('Token invalid or missing');
		}
		const { authToken } = await this.authService.generateAuthToken({ user });
		await this.authService.resetCurrentHashedRefreshToken(
			user.id,
			authToken.refreshToken,
		);
		req.user = user;
		req.session.authToken = authToken;
		return { authToken };
	}

	@JwtAuth()
	@Delete('logout')
	public async logout(@Req() req: Request) {
		try {
			req.session?.destroy();
			req.res?.clearCookie(SESSION_AUTH_KEY);
			return { logout: true, error: null };
		} catch (error) {
			return { logout: false, error: error.message };
		}
	}

	@UseGuards(JwtRefreshTokenGuard)
	@Post('refresh')
	public async refreshToken(@Req() req: Request) {
		const user = req.user as UserFromRequest;
		if (!user) throw new UnauthorizedException();
		const newAccessToken = await this.authService.resetAccessToken({ user });
		const { authToken } = req.session;
		authToken.accessToken = newAccessToken;
		req.session.authToken = authToken;
		return { authToken };
	}

	@Post('forgot-password')
	public async forgotPassword(@Body() input: RequestForgotPasswordInput) {
		try {
			return await this.authService.forgotPassword(input.email);
		} catch (error) {
			throw error;
		}
	}

	@Get('reset-password/:token')
	public async resetPassword(
		@Param('token') token: string,
		@Body() inputWithoutToken: ChangePasswordDto,
		@Req() req: Request,
	) {
		inputWithoutToken.token = token;
		try {
			const user = await this.authService.resetPassword(inputWithoutToken);
			await this.logout(req);
			return user;
		} catch (error) {
			throw error;
		}
	}
}
