import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import Icon from '../atoms/Icon';
import { VISION_STATEMENT, SECTION_HEADINGS } from '../../constants/teamContent';

export default function VisionStatement() {
  return (
    <section className="py-5">
      <h2 className="text-center mb-2 section-heading">
        {SECTION_HEADINGS.vision.title}
      </h2>
      <p className="text-center mb-5 section-subtext">
        {SECTION_HEADINGS.vision.subtitle}
      </p>
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6} className="text-center">
          <div className="vision-container p-4 p-md-5 rounded-3">
            <Icon name="quote" className="vision-quote-icon mb-3" />
            <blockquote className="mb-4">
              <p className="vision-quote mb-0">
                {VISION_STATEMENT.quote}
              </p>
            </blockquote>
            <footer className="vision-attribution">
              &mdash; {VISION_STATEMENT.attribution}
            </footer>
          </div>
        </Col>
      </Row>
    </section>
  );
}
