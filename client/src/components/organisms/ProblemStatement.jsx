import { Element } from 'react-scroll';

import { PROBLEM_CARDS } from '../../constants/landingContent';

export default function ProblemStatement() {
  return (
    <Element name="problem">
    <section className="py-5">
      <div className="container">
        <h2 className="text-center fw-bold mb-5">
          The Battery Regulation Challenge
        </h2>
        <div className="row g-4">
          {PROBLEM_CARDS.map(({ title, description, icon }) => (
            <div key={title} className="col-md-4">
              <div className="problem-card h-100 rounded-3 p-4 text-center">
                <i className={`bi ${icon} fs-1 mb-3 d-block`} aria-hidden="true" />
                <h3 className="h5 fw-semibold mb-3">{title}</h3>
                <p className="mb-0">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </Element>
  );
}
