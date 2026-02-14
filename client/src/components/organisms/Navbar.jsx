import { NAV_LINKS, LANDING_SECTIONS } from '../../constants/navigation';
import Logo from '../atoms/Logo';
import Icon from '../atoms/Icon';
import NavItem from '../molecules/NavItem';
import NavDropdown from '../molecules/NavDropdown';

const Navbar = ({ onMenuToggle }) => (
  <nav className="navbar-main d-flex justify-content-between align-items-center px-3 px-md-4 py-2">
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

export default Navbar;
