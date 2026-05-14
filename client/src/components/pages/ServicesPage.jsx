import Container from "react-bootstrap/Container";

import { SERVICES_META } from "../../constants/seoMeta";
import { PAGE_STRUCTURED_DATA } from "../../constants/structuredData";
import {
  SERVICES_PAGE_CONTENT,
  SERVICE_PILLARS,
  getServicesByPillar,
} from "../../constants/services";
import { useScrollToSection } from "../../hooks/useScrollToSection";
import PageTransition from "../templates/PageTransition";
import NavbarSkeleton from "../molecules/NavbarSkeleton";
import ContentCardSkeleton from "../molecules/ContentCardSkeleton";
import SeoHead from "../molecules/SeoHead";
import AdvisoryPageHero from "../organisms/AdvisoryPageHero";
import ServicesGroup from "../organisms/ServicesGroup";
import ContactSection from "../organisms/ContactSection";

const servicesSkeleton = (
  <>
    <NavbarSkeleton />
    <Container className="py-5">
      <ContentCardSkeleton count={3} />
    </Container>
  </>
);

const LOCKED_PILLAR_ORDER = ["engineering", "compliance", "circularity"];

function getPillarById(pillarId) {
  return SERVICE_PILLARS.find((pillar) => pillar.id === pillarId);
}

export default function ServicesPage() {
  useScrollToSection();

  const orderedPillars = LOCKED_PILLAR_ORDER.map(getPillarById).filter(Boolean);

  return (
    <div>
      <SeoHead meta={SERVICES_META} schemas={PAGE_STRUCTURED_DATA.services} />

      <PageTransition skeleton={servicesSkeleton}>
        <AdvisoryPageHero
          title={SERVICES_PAGE_CONTENT.title}
          subtitle={SERVICES_PAGE_CONTENT.subtitle}
        />

        <Container>
          {orderedPillars.map((pillar) => (
            <ServicesGroup
              key={pillar.id}
              id={pillar.anchor}
              label={pillar.label}
              services={getServicesByPillar(pillar.id)}
            />
          ))}
          <ContactSection />
        </Container>
      </PageTransition>
    </div>
  );
}
