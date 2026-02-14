import { Element } from 'react-scroll';

import { SERVICES_PREVIEW } from '../../constants/landingContent';
import ServiceCard from '../molecules/ServiceCard';

export default function ServicesSnapshot() {
  return (
    <Element name="services">
    <section className="py-5">
      <div className="container">
        <h2 className="text-center fw-bold mb-5">Our Services</h2>
        <div className="row g-4">
          {SERVICES_PREVIEW.map(({ id, title, description }) => (
            <div key={id} className="col-md-4">
              <ServiceCard title={title} description={description} />
            </div>
          ))}
        </div>
      </div>
    </section>
  </Element>
  );
}
