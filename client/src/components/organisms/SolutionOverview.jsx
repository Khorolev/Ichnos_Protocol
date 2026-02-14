import { Element } from 'react-scroll';

import { SOLUTION_CONTENT } from '../../constants/landingContent';

export default function SolutionOverview() {
  return (
    <Element name="solution">
    <section className="solution-section py-5">
      <div className="container">
        <h2 className="text-center fw-bold mb-5">
          {SOLUTION_CONTENT.heading}
        </h2>
        <div className="row align-items-center g-4">
          <div className="col-md-6">
            <p className="fs-5 mb-0">{SOLUTION_CONTENT.description}</p>
          </div>
          <div className="col-md-6">
            <ul className="list-unstyled mb-0">
              {SOLUTION_CONTENT.features.map((feature) => (
                <li key={feature} className="d-flex align-items-start mb-3">
                  <i
                    className="bi bi-check-circle-fill me-3 mt-1 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  </Element>
  );
}
