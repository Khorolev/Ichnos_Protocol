import { NavLink } from 'react-router-dom';

export default function NavItem({ label, path, onClick }) {
  return (
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
}
