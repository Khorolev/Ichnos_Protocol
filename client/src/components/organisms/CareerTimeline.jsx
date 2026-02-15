import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';

import { CAREER_TIMELINE, SECTION_HEADINGS } from '../../constants/teamContent';

const TimelineItem = ({ year, title, organization, description, isLast }) => (
  <div className="timeline-item d-flex mb-0">
    <div className="timeline-marker-col d-flex flex-column align-items-center">
      <div className="timeline-marker" />
      {!isLast && <div className="timeline-connector flex-grow-1" />}
    </div>
    <div className="timeline-content pb-4 ps-3 flex-grow-1">
      <Badge bg="" className="timeline-year mb-2">{year}</Badge>
      <h3 className="h6 fw-semibold mb-1">{title}</h3>
      <p className="small mb-1 text-accent">{organization}</p>
      <p className="small mb-0 section-subtext">{description}</p>
    </div>
  </div>
);

export default function CareerTimeline() {
  return (
    <section className="py-5">
      <h2 className="text-center mb-2 section-heading">
        {SECTION_HEADINGS.careerHighlights.title}
      </h2>
      <p className="text-center mb-5 section-subtext">
        {SECTION_HEADINGS.careerHighlights.subtitle}
      </p>
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6}>
          <div className="timeline-container">
            {CAREER_TIMELINE.map(
              ({ id, year, title, organization, description }, index) => (
                <TimelineItem
                  key={id}
                  year={year}
                  title={title}
                  organization={organization}
                  description={description}
                  isLast={index === CAREER_TIMELINE.length - 1}
                />
              ),
            )}
          </div>
        </Col>
      </Row>
    </section>
  );
}
