import { Helmet } from "react-helmet-async";
import Container from "react-bootstrap/Container";

import { PASSPORT_META } from "../../constants/seoMeta";
import PassportHero from "../organisms/PassportHero";
import FeatureMaturityMatrix from "../organisms/FeatureMaturityMatrix";
import TechnologyRoadmap from "../organisms/TechnologyRoadmap";
import ContactSection from "../organisms/ContactSection";

export default function PassportPage() {
  return (
    <>
      <Helmet>
        <title>{PASSPORT_META.title}</title>
        <meta name="description" content={PASSPORT_META.description} />
        <meta name="keywords" content={PASSPORT_META.keywords} />
        <meta property="og:title" content={PASSPORT_META.og.title} />
        <meta property="og:description" content={PASSPORT_META.og.description} />
        <meta property="og:type" content={PASSPORT_META.og.type} />
        <meta property="og:url" content={PASSPORT_META.og.url} />
      </Helmet>
      <PassportHero />
      <Container>
        <FeatureMaturityMatrix />
        <TechnologyRoadmap />
        <ContactSection />
      </Container>
    </>
  );
}
