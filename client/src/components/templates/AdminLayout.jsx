import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import { signOut } from 'firebase/auth';

import { auth } from '../../config/firebase';

export default function AdminLayout({ children }) {
  function handleLogout() {
    signOut(auth);
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <header className="bg-dark text-white px-4 py-2 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <h1 className="h5 mb-0">Ichnos Admin</h1>
          <Badge bg="warning" text="dark">Admin</Badge>
        </div>
        <Button variant="outline-light" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </header>
      <main className="flex-grow-1 p-4">{children}</main>
    </div>
  );
}
