import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { NAV_ITEMS, LANDING_SECTION_IDS } from '../../constants/navigation';
import { openAuthModal } from '../../features/auth/authSlice';
import { useActiveSection } from '../../hooks/useActiveSection';
import Logo from '../atoms/Logo';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import NavDropdown from '../molecules/NavDropdown';
import UserMenu from './UserMenu';

function isDropdownActive(item, { isHome, activeSection, pathname }) {
  if (isHome && item.activeSectionId && activeSection === item.activeSectionId) {
    return true;
  }
  return item.children.some(
    (child) =>
      child.path &&
      (pathname === child.path || pathname.startsWith(`${child.path}/`)),
  );
}

function renderTopItem(item, ctx) {
  if (item.children) {
    return (
      <NavDropdown
        key={item.label}
        label={item.label}
        items={item.children}
        isActive={isDropdownActive(item, ctx)}
      />
    );
  }

  const { isHome, activeSection, pathname, onSelect } = ctx;
  const isActive = isHome
    ? Boolean(item.activeSectionId && activeSection === item.activeSectionId)
    : pathname === item.path || pathname.startsWith(`${item.path}/`);
  const className = `nav-link px-3 py-2 ${isActive ? 'active nav-link-active' : 'nav-link-default'}`;

  return (
    <a
      key={item.path}
      href={item.path}
      className={className}
      onClick={(event) => onSelect(event, item)}
    >
      {item.label}
    </a>
  );
}

export default function Navbar({ onMenuToggle }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const isHome = pathname === '/';
  const activeSection = useActiveSection(LANDING_SECTION_IDS, { enabled: isHome });

  const handleSelect = (event, item) => {
    event.preventDefault();
    if (isHome && item.sectionId) {
      navigate('/', { state: { scrollTo: item.sectionId } });
      return;
    }
    navigate(item.path);
  };

  return (
    <nav className="navbar-main d-flex justify-content-between align-items-center px-3 px-md-4 py-2" data-testid="navbar">
      <a href="/" className="text-decoration-none">
        <Logo
          className="logo-img"
          theme={pathname === '/passport' ? 'passport' : 'light'}
        />
      </a>

      {/* Desktop nav */}
      <div className="d-none d-md-flex align-items-center gap-1">
        {NAV_ITEMS.map((item) =>
          renderTopItem(item, { isHome, activeSection, pathname, onSelect: handleSelect }),
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
