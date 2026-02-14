import { useState } from "react";

import Navbar from "../organisms/Navbar";
import MobileNavOverlay from "../organisms/MobileNavOverlay";
import Footer from "../organisms/Footer";

export default function PublicLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar onMenuToggle={() => setMobileMenuOpen(true)} />
      <MobileNavOverlay
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <main className="flex-grow-1">
        <div className="container py-4">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
