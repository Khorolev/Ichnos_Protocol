import { NavLink } from 'react-router-dom';

const NavItem = ({ label, path, onClick }) => (
  <NavLink
    to={path}
    onClick={onClick}
    className={({ isActive }) =>
      `nav-link px-3 py-2 ${isActive ? 'active nav-link-active' : 'nav-link-default'}`
    }
  >
    {label}
  </NavLink>
);

export default NavItem;
