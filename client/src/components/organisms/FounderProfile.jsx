import { useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';

import Icon from '../atoms/Icon';
import CareerTimeline from './CareerTimeline';
import RecognitionBlock from './RecognitionBlock';

const FounderPhoto = ({ photo, name }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <Col xs={12} md={4} className="text-center mb-4 mb-md-0">
      {!imgError ? (
        <img
          src={photo}
          alt={name}
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

const FounderSkills = ({ chips }) => {
  if (!chips || chips.length === 0) {
    return null;
  }
  return (
    <div className="mt-3 mb-2 founder-skills">
      <h3 className="h6 fw-semibold mb-2">Skills</h3>
      {chips.map((chip) => (
        <Badge
          key={chip}
          bg="light"
          text="dark"
          className="me-2 mb-2 fw-normal"
        >
          {chip}
        </Badge>
      ))}
    </div>
  );
};

const FounderBio = ({ name, title, bio, chips }) => (
  <Col xs={12} md={8}>
    <h2 className="h3 fw-bold mb-1">{name}</h2>
    <p className="mb-3 text-accent fw-medium">{title}</p>
    {bio.map((paragraph, index) => (
      <p key={index} className="mb-3 founder-bio">
        {paragraph}
      </p>
    ))}
    <FounderSkills chips={chips} />
  </Col>
);

export default function FounderProfile({ member }) {
  return (
    <section className="py-5">
      <Row className="align-items-center mb-5">
        <FounderPhoto photo={member.photo} name={member.name} />
        <FounderBio
          name={member.name}
          title={member.title}
          bio={member.bio}
          chips={member.skillsChips}
        />
      </Row>
      {member.showTimeline === true && (
        <CareerTimeline timeline={member.timeline} />
      )}
      <RecognitionBlock memberId={member.id} />
    </section>
  );
}
