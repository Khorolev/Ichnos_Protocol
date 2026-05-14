import { useState } from "react";
import Container from "react-bootstrap/Container";

import Navbar from "../organisms/Navbar";
import MobileNavOverlay from "../organisms/MobileNavOverlay";
import Footer from "../organisms/Footer";
import CookieConsentBanner from "../organisms/CookieConsentBanner";
import ChatModal from "../organisms/ChatModal";
import AuthModal from "../organisms/AuthModal";

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
        <Container className="py-4">{children}</Container>
      </main>
      <Footer />
      <CookieConsentBanner />
      <ChatModal />
      <AuthModal />
    </div>
  );
}
