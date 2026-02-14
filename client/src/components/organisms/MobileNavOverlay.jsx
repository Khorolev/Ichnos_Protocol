import { useNavigate } from 'react-router-dom';
import { NAV_LINKS, LANDING_SECTIONS } from '../../constants/navigation';
import Icon from '../atoms/Icon';
import NavItem from '../molecules/NavItem';

export default function MobileNavOverlay({ isOpen, onClose }) {
  const navigate = useNavigate();

  const handleSectionClick = (sectionId) => {
    navigate('/', { state: { scrollTo: sectionId } });
    onClose();
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
        {NAV_LINKS.map(({ label, path }) => (
          <div key={path} className="mobile-nav-link-item">
            <NavItem label={label} path={path} onClick={onClose} />
          </div>
        ))}
      </div>

      <hr className="mobile-nav-divider" />

      <p className="small mb-2 mobile-nav-section-label">
        Landing Sections
      </p>

      <div className="d-flex flex-column gap-2">
        {LANDING_SECTIONS.map(({ label, sectionId }) => (
          <button
            key={sectionId}
            className="btn btn-link text-start text-decoration-none px-3 mobile-nav-section-btn"
            onClick={() => handleSectionClick(sectionId)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
