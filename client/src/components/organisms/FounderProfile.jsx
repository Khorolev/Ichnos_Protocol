import { useState } from 'react';

import Icon from '../atoms/Icon';
import {
  FOUNDER_PROFILE,
  CORE_COMPETENCIES,
  SECTION_HEADINGS,
} from '../../constants/teamContent';

const CompetencyCard = ({ title, icon, description }) => (
  <div className="col-12 col-md-6 col-lg-3 mb-4">
    <div className="competency-card h-100 p-4 rounded-3 text-center">
      <Icon name={icon} className="fs-1 mb-3 text-accent" />
      <h3 className="h6 fw-semibold mb-2">{title}</h3>
      <p className="small mb-0 section-subtext">{description}</p>
    </div>
  </div>
);

const FounderPhoto = () => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="col-12 col-md-4 text-center mb-4 mb-md-0">
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
    </div>
  );
};

const FounderBio = () => (
  <div className="col-12 col-md-8">
    <h2 className="h3 fw-bold mb-1">{FOUNDER_PROFILE.name}</h2>
    <p className="mb-3 text-accent fw-medium">{FOUNDER_PROFILE.title}</p>
    {FOUNDER_PROFILE.bio.map((paragraph, index) => (
      <p key={index} className="mb-3 founder-bio">
        {paragraph}
      </p>
    ))}
  </div>
);

export default function FounderProfile() {
  return (
    <section className="py-5">
    <div className="row align-items-center mb-5">
      <FounderPhoto />
      <FounderBio />
    </div>

    <h2 className="text-center mb-2 section-heading">
      {SECTION_HEADINGS.coreCompetencies.title}
    </h2>
    <p className="text-center mb-4 section-subtext">
      {SECTION_HEADINGS.coreCompetencies.subtitle}
    </p>
    <div className="row">
      {CORE_COMPETENCIES.map(({ id, title, icon, description }) => (
        <CompetencyCard
          key={id}
          title={title}
          icon={icon}
          description={description}
        />
      ))}
    </div>
  </section>
  );
}
