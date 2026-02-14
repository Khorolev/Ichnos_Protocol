import { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import Icon from '../atoms/Icon';
import {
  FOUNDER_PROFILE,
  CORE_COMPETENCIES,
  SECTION_HEADINGS,
} from '../../constants/teamContent';

const CompetencyCard = ({ title, icon, description }) => (
  <Col xs={12} md={6} lg={3} className="mb-4">
    <div className="competency-card h-100 p-4 rounded-3 text-center">
      <Icon name={icon} className="fs-1 mb-3 text-accent" />
      <h3 className="h6 fw-semibold mb-2">{title}</h3>
      <p className="small mb-0 section-subtext">{description}</p>
    </div>
  </Col>
);

const FounderPhoto = () => {
  const [imgError, setImgError] = useState(false);

  return (
    <Col xs={12} md={4} className="text-center mb-4 mb-md-0">
      {!imgError ? (
        <img
          src={FOUNDER_PROFILE.photo}
          alt={FOUNDER_PROFILE.name}
          className="founder-photo rounded-circle"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="founder-photo-fallback rounded-circle mx-auto d-flex align-items-center justify-content-center">
          <Icon name="person-circle" className="fs-1" />
        </div>
      )}
    </Col>
  );
};

const FounderBio = () => (
  <Col xs={12} md={8}>
    <h2 className="h3 fw-bold mb-1">{FOUNDER_PROFILE.name}</h2>
    <p className="mb-3 text-accent fw-medium">{FOUNDER_PROFILE.title}</p>
    {FOUNDER_PROFILE.bio.map((paragraph, index) => (
      <p key={index} className="mb-3 founder-bio">
        {paragraph}
      </p>
    ))}
  </Col>
);

export default function FounderProfile() {
  return (
    <section className="py-5">
      <Row className="align-items-center mb-5">
        <FounderPhoto />
        <FounderBio />
      </Row>

      <h2 className="text-center mb-2 section-heading">
        {SECTION_HEADINGS.coreCompetencies.title}
      </h2>
      <p className="text-center mb-4 section-subtext">
        {SECTION_HEADINGS.coreCompetencies.subtitle}
      </p>
      <Row>
        {CORE_COMPETENCIES.map(({ id, title, icon, description }) => (
          <CompetencyCard
            key={id}
            title={title}
            icon={icon}
            description={description}
          />
        ))}
      </Row>
    </section>
  );
}
