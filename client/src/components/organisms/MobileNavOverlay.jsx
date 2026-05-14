import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { NAV_ITEMS } from '../../constants/navigation';
import { openAuthModal } from '../../features/auth/authSlice';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import UserMenu from './UserMenu';

export default function MobileNavOverlay({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const isHome = pathname === '/';

  const handleLoginClick = () => {
    onClose();
    dispatch(openAuthModal('login'));
  };

  const handleSelect = (event, item) => {
    event.preventDefault();
    onClose();
    if (isHome && item.sectionId) {
      navigate('/', { state: { scrollTo: item.sectionId } });
      return;
    }
    navigate(item.path);
  };

  const overlayState = isOpen
    ? 'mobile-nav-overlay--open'
    : 'mobile-nav-overlay--closed';

  return (
    <div className={`mobile-nav-overlay d-flex flex-column p-4 ${overlayState}`}>
      <button
        className="btn btn-link align-self-end p-0 mb-4 mobile-nav-close-btn"
        onClick={onClose}
        aria-label="Close menu"
      >
        <Icon name="x-lg" className="fs-2" />
      </button>

      <div className="d-flex flex-column gap-2">
        {NAV_ITEMS.map((item) => {
          // Dropdown items: render the parent label as a non-interactive section
          // heading, then each child as its own flat link beneath it.
          if (item.children) {
            return (
              <div key={item.label} className="d-flex flex-column">
                <span className="px-3 mobile-nav-section-label small text-uppercase">
                  {item.label}
                </span>
                {item.children.map((child) => {
                  const isChildActive =
                    child.path && pathname === child.path;
                  const childClass = isChildActive
                    ? 'active nav-link-active'
                    : 'nav-link-default';
                  return (
                    <a
                      key={child.label}
                      href={child.path ?? '/'}
                      onClick={(event) => handleSelect(event, child)}
                      className={`nav-link mobile-nav-link-item px-4 py-2 ${childClass}`}
                    >
                      {child.label}
                    </a>
                  );
                })}
              </div>
            );
          }

          const isActive =
            pathname === item.path || pathname.startsWith(`${item.path}/`);
          const stateClass = isActive
            ? 'active nav-link-active'
            : 'nav-link-default';
          return (
            <a
              key={item.path}
              href={item.path}
              onClick={(event) => handleSelect(event, item)}
              className={`nav-link mobile-nav-link-item px-3 py-2 ${stateClass}`}
            >
              {item.label}
            </a>
          );
        })}
      </div>

      <hr className="mobile-nav-divider" />

      <div className="mt-2">
        {isAuthenticated ? (
          <UserMenu />
        ) : (
          <Button
            variant="outline-primary"
            className="w-100"
            onClick={handleLoginClick}
          >
            Login
          </Button>
        )}
      </div>
    </div>
  );
}
