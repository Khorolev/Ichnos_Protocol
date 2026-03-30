import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../features/auth/authSlice';
import ProtectedRoute from './ProtectedRoute';

function renderWithAuth(isAuthenticated) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: isAuthenticated ? { uid: '1' } : null,
        isAuthenticated,
        isAdmin: false,
        loading: false,
        error: null,
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/" element={<p>Home</p>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <p>Secret</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    renderWithAuth(true);

    expect(screen.getByText('Secret')).toBeInTheDocument();
  });

  it('redirects to home when not authenticated', () => {
    renderWithAuth(false);

    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});
