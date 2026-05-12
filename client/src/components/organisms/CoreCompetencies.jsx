import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import Icon from '../atoms/Icon';
import { CORE_COMPETENCIES, SECTION_HEADINGS } from '../../constants/teamContent';

const CompetencyCard = ({ title, icon, description }) => (
  <Col xs={12} md={6} lg={3} className="mb-4">
    <div className="competency-card h-100 p-4 rounded-3 text-center">
      <Icon name={icon} className="fs-1 mb-3 text-accent" />
      <h3 className="h6 fw-semibold mb-2">{title}</h3>
      <p className="small mb-0 section-subtext">{description}</p>
    </div>
  </Col>
);

export default function CoreCompetencies() {
  return (
    <section className="py-5">
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
