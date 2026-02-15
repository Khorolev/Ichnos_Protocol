import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';
import { configureStore } from '@reduxjs/toolkit';

function createTestStore() {
  return configureStore({
    reducer: { _placeholder: (state = null) => state },
  });
}

export function renderWithProviders(ui, { route = '/', state, ...options } = {}) {
  const store = createTestStore();
  const initialEntries = state ? [{ pathname: route, state }] : [route];

  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <HelmetProvider>
          <MemoryRouter initialEntries={initialEntries}>
            {children}
          </MemoryRouter>
        </HelmetProvider>
      </Provider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

export { screen, fireEvent, waitFor, within, act, cleanup } from '@testing-library/react';
