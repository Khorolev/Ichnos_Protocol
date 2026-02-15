import Placeholder from 'react-bootstrap/Placeholder';

export default function NavbarSkeleton() {
  return (
    <div
      className="navbar-main d-flex justify-content-between align-items-center px-3 px-md-4 py-2"
      aria-hidden="true"
    >
      <Placeholder animation="glow">
        <Placeholder xs={1} bg="secondary" className="navbar-skeleton-logo" />
      </Placeholder>

      <div className="d-none d-md-flex align-items-center gap-3">
        <Placeholder animation="glow">
          <Placeholder xs={1} bg="secondary" className="navbar-skeleton-link" />
        </Placeholder>
        <Placeholder animation="glow">
          <Placeholder xs={1} bg="secondary" className="navbar-skeleton-link" />
        </Placeholder>
        <Placeholder animation="glow">
          <Placeholder xs={1} bg="secondary" className="navbar-skeleton-link" />
        </Placeholder>
      </div>

      <div className="d-md-none">
        <Placeholder animation="glow">
          <Placeholder xs={1} bg="secondary" className="navbar-skeleton-hamburger" />
        </Placeholder>
      </div>
    </div>
  );
}
