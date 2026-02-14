import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function NavDropdown({ label, items, onItemClick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === '/';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (sectionId) => {
    setOpen(false);
    navigate('/', { state: { scrollTo: sectionId } });
    if (onItemClick) onItemClick(sectionId);
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
        {items.map(({ label: itemLabel, sectionId }) => (
          <li key={sectionId}>
            <button
              className="dropdown-item nav-dropdown-item"
              onClick={() => handleItemClick(sectionId)}
            >
              {itemLabel}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
