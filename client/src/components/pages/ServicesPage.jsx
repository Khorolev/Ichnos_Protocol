import { Helmet } from "react-helmet-async";
import Container from "react-bootstrap/Container";

import { SERVICES_META } from "../../constants/seoMeta";
import { SERVICES_PAGE_CONTENT } from "../../constants/services";
import PageTransition from "../templates/PageTransition";
import NavbarSkeleton from "../molecules/NavbarSkeleton";
import ContentCardSkeleton from "../molecules/ContentCardSkeleton";
import AdvisoryPageHero from "../organisms/AdvisoryPageHero";
import ServicesList from "../organisms/ServicesList";
import ContactSection from "../organisms/ContactSection";

const servicesSkeleton = (
  <>
    <NavbarSkeleton />
    <Container className="py-5">
      <ContentCardSkeleton count={3} />
    </Container>
  </>
);

export default function ServicesPage() {
  return (
    <div>
      <Helmet>
        <title>{SERVICES_META.title}</title>
        <meta name="description" content={SERVICES_META.description} />
        <meta name="keywords" content={SERVICES_META.keywords} />
      </Helmet>

      <PageTransition skeleton={servicesSkeleton}>
        <AdvisoryPageHero
          title={SERVICES_PAGE_CONTENT.title}
          subtitle={SERVICES_PAGE_CONTENT.subtitle}
        />

        <Container>
          <ServicesList />
          <ContactSection />
        </Container>
      </PageTransition>
    </div>
  );
}
