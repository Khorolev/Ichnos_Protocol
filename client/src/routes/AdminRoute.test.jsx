import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

import authReducer from '../features/auth/authSlice';
import AdminRoute from './AdminRoute';

function renderWithAuth(isAuthenticated, isAdmin, loading = false) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: isAuthenticated ? { uid: '1' } : null,
        isAuthenticated,
        isAdmin,
        loading,
        error: null,
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<p>Home</p>} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <p>Admin Panel</p>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('AdminRoute', () => {
  it('renders children when authenticated and admin', () => {
    renderWithAuth(true, true);

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('redirects when authenticated but not admin', () => {
    renderWithAuth(true, false);

    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('redirects when not authenticated', () => {
    renderWithAuth(false, false);

    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders nothing while auth is loading', () => {
    renderWithAuth(false, false, true);

    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });
});
