import { useSelector, useDispatch } from 'react-redux';

import { NAV_LINKS, LANDING_SECTIONS } from '../../constants/navigation';
import { openAuthModal } from '../../features/auth/authSlice';
import Logo from '../atoms/Logo';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import NavItem from '../molecules/NavItem';
import NavDropdown from '../molecules/NavDropdown';
import UserMenu from './UserMenu';

export default function Navbar({ onMenuToggle }) {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <nav className="navbar-main d-flex justify-content-between align-items-center px-3 px-md-4 py-2" data-testid="navbar">
      <a href="/" className="text-decoration-none">
        <Logo className="logo-img" />
      </a>

      {/* Desktop nav */}
      <div className="d-none d-md-flex align-items-center gap-1">
        {NAV_LINKS.map(({ label, path }) =>
          label === 'Home' ? (
            <NavDropdown
              key={path}
              label={label}
              items={LANDING_SECTIONS}
            />
          ) : (
            <NavItem key={path} label={label} path={path} />
          ),
        )}

        {isAuthenticated ? (
          <UserMenu />
        ) : (
          <Button
            variant="outline-primary"
            className="ms-2"
            onClick={() => dispatch(openAuthModal('login'))}
          >
            Login
          </Button>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        className="btn btn-link d-md-none p-0 navbar-menu-btn"
        onClick={onMenuToggle}
        aria-label="Open menu"
      >
        <Icon name="list" className="fs-2" />
      </button>
    </nav>
  );
}
