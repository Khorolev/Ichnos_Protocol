import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import { PASSPORT_META } from "../../constants/seoMeta";
import { PAGE_STRUCTURED_DATA } from "../../constants/structuredData";
import {
  PASSPORT_NARRATIVE_CONTENT,
  PASSPORT_VALUE_PROPS,
} from "../../constants/passportContent";
import SeoHead from "../molecules/SeoHead";
import PassportHero from "../organisms/PassportHero";
import FeatureMaturityMatrix from "../organisms/FeatureMaturityMatrix";
import TechnologyRoadmap from "../organisms/TechnologyRoadmap";
import PassportContactCta from "../organisms/PassportContactCta";

function ValueCard({ audience }) {
  return (
    <Col md={6} className="mb-4">
      <div
        data-testid={`passport-value-${audience.id}`}
        className="h-100 p-4 border rounded"
      >
        <p className="small text-uppercase fw-bold mb-2">{audience.audience}</p>
        <h3 className="h5 mb-3">{audience.headline}</h3>
        <ul className="mb-0">
          {audience.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>
    </Col>
  );
}

export default function PassportPage() {
  return (
    <>
      <SeoHead meta={PASSPORT_META} schemas={PAGE_STRUCTURED_DATA.passport} />
      <PassportHero />
      <Container>
        <section data-testid="passport-narrative" className="py-5">
          <h2 className="section-heading mb-3">
            {PASSPORT_NARRATIVE_CONTENT.heading}
          </h2>
          <p className="lead">{PASSPORT_NARRATIVE_CONTENT.body}</p>
        </section>
        <section data-testid="passport-value-props" className="py-5">
          <h2 className="section-heading text-center mb-2">
            {PASSPORT_VALUE_PROPS.heading}
          </h2>
          <p className="text-center text-secondary mb-4">
            {PASSPORT_VALUE_PROPS.subtext}
          </p>
          <Row>
            {PASSPORT_VALUE_PROPS.audiences.map((audience) => (
              <ValueCard key={audience.id} audience={audience} />
            ))}
          </Row>
        </section>
        <FeatureMaturityMatrix />
        <TechnologyRoadmap />
        <PassportContactCta />
      </Container>
    </>
  );
}
