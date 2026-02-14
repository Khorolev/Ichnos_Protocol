import {
  ROADMAP_PHASES,
  TECHNOLOGY_ROADMAP_CONTENT,
} from '../../constants/services';

const badgeClass = (badge) =>
  badge === 'CURRENT' ? 'badge-roadmap-current' : 'badge-roadmap-planned';

const PhaseCard = ({ title, badge, description, features }) => (
  <div className="col-12 col-md-6 mb-4">
    <div className="card h-100 roadmap-card">
      <div className="card-body">
        <div className="mb-3">
          <span className={`badge ${badgeClass(badge)}`}>{badge}</span>
        </div>
        <h3 className="card-title h5 mb-3 roadmap-card-title">{title}</h3>
        <p className="card-text mb-3 roadmap-card-text">{description}</p>
        <ul className="list-unstyled mb-0">
          {features.map((feat) => (
            <li key={feat} className="mb-1 small roadmap-card-detail">
              <span className="me-2 text-accent">&#8226;</span>
              {feat}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export default function TechnologyRoadmap() {
  return (
    <section className="py-5">
    <h2 className="text-center mb-2 section-heading">
      {TECHNOLOGY_ROADMAP_CONTENT.heading}
    </h2>
    <p className="text-center mb-5 section-subtext">
      {TECHNOLOGY_ROADMAP_CONTENT.subtext}
    </p>
    <div className="row">
      {ROADMAP_PHASES.map(({ id, title, badge, description, features }) => (
        <PhaseCard
          key={id}
          title={title}
          badge={badge}
          description={description}
          features={features}
        />
      ))}
    </div>
    <p className="text-center mt-3 small section-subtext">
      {TECHNOLOGY_ROADMAP_CONTENT.footer}
    </p>
  </section>
  );
}
