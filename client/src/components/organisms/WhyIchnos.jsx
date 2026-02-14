import { Element } from 'react-scroll';

import { WHY_ICHNOS_CARDS } from '../../constants/landingContent';

const WhyIchnos = () => (
  <Element name="why-ichnos">
    <section className="py-5">
      <div className="container">
        <h2 className="text-center fw-bold mb-5">Why Ichnos Protocol</h2>
        <div className="row g-4">
          {WHY_ICHNOS_CARDS.map(({ title, description, icon }) => (
            <div key={title} className="col-sm-6 col-md-3">
              <div className="why-card text-center p-4 h-100">
                <div className="why-card-icon mx-auto mb-3">
                  <i className={`bi ${icon} fs-3`} aria-hidden="true" />
                </div>
                <h4 className="h6 fw-semibold mb-2">{title}</h4>
                <p className="small mb-0">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </Element>
);

export default WhyIchnos;
