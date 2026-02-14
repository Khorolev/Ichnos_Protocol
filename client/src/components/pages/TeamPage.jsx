import { Helmet } from 'react-helmet-async';

import { TEAM_META } from '../../constants/seoMeta';
import { TEAM_PAGE_HEADER } from '../../constants/teamContent';
import FounderProfile from '../organisms/FounderProfile';
import CareerTimeline from '../organisms/CareerTimeline';
import VisionStatement from '../organisms/VisionStatement';

const TeamPage = () => (
  <div>
    <Helmet>
      <title>{TEAM_META.title}</title>
      <meta name="description" content={TEAM_META.description} />
      <meta name="keywords" content={TEAM_META.keywords} />
      <meta property="og:title" content={TEAM_META.og.title} />
      <meta property="og:description" content={TEAM_META.og.description} />
      <meta property="og:type" content={TEAM_META.og.type} />
      <meta property="og:url" content={TEAM_META.og.url} />
    </Helmet>

    <header className="text-center py-5">
      <h1 className="mb-3 page-title">{TEAM_PAGE_HEADER.title}</h1>
      <p className="lead section-subtext">
        {TEAM_PAGE_HEADER.subtitle}
      </p>
    </header>

    <div className="container">
      <FounderProfile />
      <CareerTimeline />
      <VisionStatement />
    </div>
  </div>
);

export default TeamPage;
