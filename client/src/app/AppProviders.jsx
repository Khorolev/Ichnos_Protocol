import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import { store } from './store';
import { useAuthInit } from '../hooks/useAuthInit';

function AuthInitializer({ children }) {
  useAuthInit();
  return children;
}

export const AppProviders = ({ children }) => (
  <Provider store={store}>
    <HelmetProvider>
      <BrowserRouter>
        <AuthInitializer>{children}</AuthInitializer>
      </BrowserRouter>
    </HelmetProvider>
  </Provider>
);
