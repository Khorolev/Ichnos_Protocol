import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import { signOut } from 'firebase/auth';

import { auth } from '../../config/firebase';
import { logout } from '../../features/auth/authSlice';
import { getUserInitial, getUserDisplayName } from '../../helpers/userInitial';
import Icon from '../atoms/Icon';

export default function UserMenu() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAdmin } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    await signOut(auth);
    dispatch(logout());
    navigate('/');
  };

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        variant="link"
        className="d-flex align-items-center gap-2 text-decoration-none user-menu-toggle"
        data-testid="user-menu-toggle"
      >
        <span className="user-avatar">{getUserInitial(user)}</span>
        <span className="d-none d-lg-inline user-menu-name">
          {getUserDisplayName(user)}
        </span>
      </Dropdown.Toggle>

      <Dropdown.Menu className="user-menu-dropdown">
        <Dropdown.Item onClick={() => navigate('/contact')}>
          <Icon name="envelope" className="me-2" />
          My Inquiry Status
        </Dropdown.Item>
        <Dropdown.Item onClick={() => navigate('/privacy')}>
          <Icon name="shield-lock" className="me-2" />
          My Data
        </Dropdown.Item>
        {isAdmin && (
          <Dropdown.Item onClick={() => navigate('/admin')}>
            <Icon name="gear" className="me-2" />
            Admin Panel
          </Dropdown.Item>
        )}
        <Dropdown.Divider />
        <Dropdown.Item onClick={handleLogout}>
          <Icon name="box-arrow-right" className="me-2" />
          Logout
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
