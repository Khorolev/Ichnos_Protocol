import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// `isActive` may be passed in by the caller (e.g., Navbar with scrollspy state).
// When omitted, falls back to matching a child's route against the current pathname.
export default function NavDropdown({ label, items, onItemClick, isActive: isActiveProp }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const hasRouteItems = items.some((item) => item.path);
  const fallbackActive = hasRouteItems
    ? items.some((item) => item.path === location.pathname)
    : location.pathname === '/';
  const isActive = isActiveProp ?? fallbackActive;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = ({ path, sectionId }) => {
    setOpen(false);
    if (path) navigate(path);
    else navigate('/', { state: { scrollTo: sectionId } });
    if (onItemClick) onItemClick(path ?? sectionId);
  };

  const toggleClass = isActive ? 'nav-link-active' : 'nav-link-default';

  return (
    <div className="nav-item dropdown" ref={ref}>
      <button
        className={`nav-link dropdown-toggle btn btn-link px-3 py-2 nav-dropdown-toggle ${toggleClass} ${isActive ? 'active' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        {label}
      </button>
      <ul className={`dropdown-menu nav-dropdown-menu ${open ? 'show' : ''}`}>
        {items.map(({ label: itemLabel, sectionId, path }) => (
          <li key={path ?? sectionId}>
            <button
              className="dropdown-item nav-dropdown-item"
              onClick={() => handleItemClick({ path, sectionId })}
            >
              {itemLabel}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
