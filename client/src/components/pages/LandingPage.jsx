import { Helmet } from "react-helmet-async";

import { LANDING_META } from "../../constants/seoMeta";
import { useScrollToSection } from "../../hooks/useScrollToSection";
import PageTransition from "../templates/PageTransition";
import NavbarSkeleton from "../molecules/NavbarSkeleton";
import HeroSkeleton from "../molecules/HeroSkeleton";
import ContentCardSkeleton from "../molecules/ContentCardSkeleton";
import Hero from "../organisms/Hero";
import ProblemStatement from "../organisms/ProblemStatement";
import SolutionOverview from "../organisms/SolutionOverview";
import WhyIchnos from "../organisms/WhyIchnos";
import ServicesSnapshot from "../organisms/ServicesSnapshot";

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
      <Helmet>
        <title>{LANDING_META.title}</title>
        <meta name="description" content={LANDING_META.description} />
        <meta name="keywords" content={LANDING_META.keywords} />
        <meta property="og:title" content={LANDING_META.og.title} />
        <meta property="og:description" content={LANDING_META.og.description} />
        <meta property="og:type" content={LANDING_META.og.type} />
        <meta property="og:url" content={LANDING_META.og.url} />
      </Helmet>
      <PageTransition skeleton={landingSkeleton}>
        <Hero />
        <ProblemStatement />
        <SolutionOverview />
        <WhyIchnos />
        <ServicesSnapshot />
      </PageTransition>
    </>
  );
}
