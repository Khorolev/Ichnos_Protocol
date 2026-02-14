import { Helmet } from 'react-helmet-async';

import { LANDING_META } from '../../constants/seoMeta';
import { useScrollToSection } from '../../hooks/useScrollToSection';
import Hero from '../organisms/Hero';
import ProblemStatement from '../organisms/ProblemStatement';
import SolutionOverview from '../organisms/SolutionOverview';
import WhyIchnos from '../organisms/WhyIchnos';
import ServicesSnapshot from '../organisms/ServicesSnapshot';

const LandingPage = () => {
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
      <Hero />
      <ProblemStatement />
      <SolutionOverview />
      <WhyIchnos />
      <ServicesSnapshot />
    </>
  );
};

export default LandingPage;
