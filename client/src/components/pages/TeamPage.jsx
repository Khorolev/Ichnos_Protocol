import { TEAM_META } from "../../constants/seoMeta";
import { PAGE_STRUCTURED_DATA } from "../../constants/structuredData";
import {
  TEAM_MEMBERS,
  TEAM_PAGE_HEADER,
} from "../../constants/teamContent";
import PageTransition from "../templates/PageTransition";
import NavbarSkeleton from "../molecules/NavbarSkeleton";
import ContentCardSkeleton from "../molecules/ContentCardSkeleton";
import SeoHead from "../molecules/SeoHead";
import AdvisoryPageHero from "../organisms/AdvisoryPageHero";
import FounderProfile from "../organisms/FounderProfile";
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
      <SeoHead meta={TEAM_META} schemas={PAGE_STRUCTURED_DATA.team} />

      <PageTransition skeleton={teamSkeleton}>
        <AdvisoryPageHero
          title={TEAM_PAGE_HEADER.title}
          subtitle={TEAM_PAGE_HEADER.subtitle}
        />

        <div className="container">
          {TEAM_MEMBERS.map((member) => (
            <FounderProfile key={member.id} member={member} />
          ))}
          <VisionStatement />
        </div>
      </PageTransition>
    </div>
  );
}
