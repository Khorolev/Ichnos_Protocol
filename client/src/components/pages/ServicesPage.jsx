import { Helmet } from "react-helmet-async";
import Container from "react-bootstrap/Container";

import { SEO_META } from "../../constants/seo";
import { SERVICES_PAGE_CONTENT } from "../../constants/services";
import PageTransition from "../templates/PageTransition";
import NavbarSkeleton from "../molecules/NavbarSkeleton";
import ContentCardSkeleton from "../molecules/ContentCardSkeleton";
import ServicesList from "../organisms/ServicesList";
import FeatureMaturityMatrix from "../organisms/FeatureMaturityMatrix";
import TechnologyRoadmap from "../organisms/TechnologyRoadmap";
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
        <title>{SEO_META.services.title}</title>
        <meta name="description" content={SEO_META.services.description} />
        <meta name="keywords" content={SEO_META.services.keywords} />
      </Helmet>

      <PageTransition skeleton={servicesSkeleton}>
        <header className="text-center py-5">
          <h1 className="mb-3 page-title">{SERVICES_PAGE_CONTENT.title}</h1>
          <p className="lead section-subtext">{SERVICES_PAGE_CONTENT.subtitle}</p>
        </header>

        <Container>
          <ServicesList />
          <FeatureMaturityMatrix />
          <TechnologyRoadmap />
          <ContactSection />
        </Container>
      </PageTransition>
    </div>
  );
}
