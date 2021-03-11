import * as React from 'react';
import { Helmet } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { Switch, Route, BrowserRouter } from 'react-router-dom';
import { PATH } from './constants/paths.constant';
import { AccountPage } from './pages/AccountPage/Loadable';
import { BookDetailPage } from './pages/BookDetailPage/Loadable';
import { BooksGenrePage } from './pages/BooksGenrePage/Loadable';
import { BooksSearchPage } from './pages/BooksSearchPage/Loadable';
import { CheckoutPage } from './pages/CheckoutPage/Loadable';
import { HomePage } from './pages/HomePage/Loadable';

import { NotFoundPage } from './pages/NotFoundPage/Loadable';
import { PaymentPage } from './pages/PaymentPage/Loadable';

export function App() {
  return (
    <BrowserRouter>
      <Helmet titleTemplate="%s - Bookstore" defaultTitle="Bookstore">
        <meta name="description" content="Bookstore application" />
      </Helmet>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          style: { fontSize: '1.6rem' },
        }}
      />

      <Switch>
        <Route path="/books/genre/:genre" component={BooksGenrePage} />
        <Route path="/books/search" component={BooksSearchPage} />
        <Route path="/account" component={AccountPage} />
        <Route path="/book/:id" component={BookDetailPage} />
        <Route path="/checkout/payment" component={PaymentPage} />
        <Route path="/checkout" component={CheckoutPage} exact />
        <Route exact path={PATH.HOME} component={HomePage} />
        <Route component={NotFoundPage} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
