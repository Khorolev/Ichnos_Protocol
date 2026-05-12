import { Helmet } from "react-helmet-async";

import { TEAM_META } from "../../constants/seoMeta";
import {
  TEAM_MEMBERS,
  TEAM_PAGE_HEADER,
} from "../../constants/teamContent";
import PageTransition from "../templates/PageTransition";
import NavbarSkeleton from "../molecules/NavbarSkeleton";
import ContentCardSkeleton from "../molecules/ContentCardSkeleton";
import AdvisoryPageHero from "../organisms/AdvisoryPageHero";
import FounderProfile from "../organisms/FounderProfile";
import CoreCompetencies from "../organisms/CoreCompetencies";
import VisionStatement from "../organisms/VisionStatement";

const teamSkeleton = (
  <>
    <NavbarSkeleton />
    <div className="container py-5">
      <ContentCardSkeleton count={2} />
    </div>
  </>
);

export default function TeamPage() {
  return (
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

      <PageTransition skeleton={teamSkeleton}>
        <AdvisoryPageHero
          title={TEAM_PAGE_HEADER.title}
          subtitle={TEAM_PAGE_HEADER.subtitle}
        />

        <div className="container">
          {TEAM_MEMBERS.map((member) => (
            <FounderProfile key={member.id} member={member} />
          ))}
          <CoreCompetencies />
          <VisionStatement />
        </div>
      </PageTransition>
    </div>
  );
}
