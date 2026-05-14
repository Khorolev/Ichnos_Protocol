import { Outlet } from "react-router-dom";

export default function AdvisoryThemeLayout() {
  return (
    <div className="theme-advisory">
      <Outlet />
    </div>
  );
}
