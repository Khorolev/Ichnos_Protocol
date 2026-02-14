import { SERVICES_LIST, SERVICES_LIST_CONTENT } from '../../constants/services';

const ServiceCard = ({ title, description, details }) => (
  <div className="col-12 col-md-6 col-lg-4 mb-4">
    <div className="card h-100 service-card">
      <div className="card-body">
        <h3 className="card-title h5 mb-3 service-card-title">{title}</h3>
        <p className="card-text mb-3 service-card-text">{description}</p>
        <ul className="list-unstyled mb-0">
          {details.map((detail) => (
            <li key={detail} className="mb-1 small service-card-detail">
              <span className="me-2 text-accent">&#10003;</span>
              {detail}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export default function ServicesList() {
  return (
    <section className="py-5">
    <h2 className="text-center mb-2 section-heading">
      {SERVICES_LIST_CONTENT.heading}
    </h2>
    <p className="text-center mb-5 section-subtext">
      {SERVICES_LIST_CONTENT.subtext}
    </p>
    <div className="row">
      {SERVICES_LIST.map(({ id, title, description, details }) => (
        <ServiceCard
          key={id}
          title={title}
          description={description}
          details={details}
        />
      ))}
    </div>
  </section>
  );
}
