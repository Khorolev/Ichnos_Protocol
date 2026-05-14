import { LANDING_META } from "../../constants/seoMeta";
import { PAGE_STRUCTURED_DATA } from "../../constants/structuredData";
import { useScrollToSection } from "../../hooks/useScrollToSection";
import PageTransition from "../templates/PageTransition";
import NavbarSkeleton from "../molecules/NavbarSkeleton";
import HeroSkeleton from "../molecules/HeroSkeleton";
import ContentCardSkeleton from "../molecules/ContentCardSkeleton";
import SeoHead from "../molecules/SeoHead";
import Hero from "../organisms/Hero";
import ServicesSnapshot from "../organisms/ServicesSnapshot";
import CompanySnapshot from "../organisms/CompanySnapshot";
import PassportTeaser from "../organisms/PassportTeaser";
import ContactSection from "../organisms/ContactSection";

const landingSkeleton = (
  <>
    <NavbarSkeleton />
    <HeroSkeleton />
    <ContentCardSkeleton count={3} />
  </>
);

export default function LandingPage() {
  useScrollToSection();

  return (
    <>
      <SeoHead meta={LANDING_META} schemas={PAGE_STRUCTURED_DATA.landing} />
      <PageTransition skeleton={landingSkeleton}>
        <Hero />
        <ServicesSnapshot />
        <CompanySnapshot />
        <PassportTeaser />
        <ContactSection showFullContactLink={true} />
      </PageTransition>
    </>
  );
}
