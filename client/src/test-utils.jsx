import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';
import { configureStore } from '@reduxjs/toolkit';

import authReducer from './features/auth/authSlice';

function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      auth: authReducer,
      _placeholder: (state = null) => state,
    },
    preloadedState,
  });
}

export function renderWithProviders(
  ui,
  { route = '/', state, preloadedState, store, ...options } = {},
) {
  const testStore = store || createTestStore(preloadedState);
  const initialEntries = state ? [{ pathname: route, state }] : [route];

  function Wrapper({ children }) {
    return (
      <Provider store={testStore}>
        <HelmetProvider>
          <MemoryRouter initialEntries={initialEntries}>
            {children}
          </MemoryRouter>
        </HelmetProvider>
      </Provider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...options }), store: testStore };
}

export { screen, fireEvent, waitFor, within, act, cleanup } from '@testing-library/react';
