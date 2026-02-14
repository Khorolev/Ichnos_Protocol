import {
  BATTERY_PASSPORT_FEATURES,
  FEATURE_MATRIX_CONTENT,
} from '../../constants/services';
import StatusBadge from '../atoms/StatusBadge';

const MandatedIndicator = ({ mandated }) => (
  <span className={mandated ? 'text-accent' : 'text-muted-custom'}>
    {mandated ? '✓' : '✗'}
  </span>
);

const FeatureRow = ({ feature, mandated, status, phase }) => (
  <tr>
    <td className="table-cell-text">{feature}</td>
    <td className="text-center">
      <MandatedIndicator mandated={mandated} />
    </td>
    <td className="text-center">
      <StatusBadge status={status} />
    </td>
    <td className="text-center table-cell-text">{phase}</td>
  </tr>
);

export default function FeatureMaturityMatrix() {
  return (
    <section className="py-5">
    <h2 className="text-center mb-2 section-heading">
      {FEATURE_MATRIX_CONTENT.heading}
    </h2>
    <p className="text-center mb-5 section-subtext">
      {FEATURE_MATRIX_CONTENT.subtext}
    </p>
    <div className="table-responsive">
      <table className="table table-dark-custom align-middle">
        <thead>
          <tr>
            <th>{FEATURE_MATRIX_CONTENT.columns.feature}</th>
            <th className="text-center">
              {FEATURE_MATRIX_CONTENT.columns.mandated}
            </th>
            <th className="text-center">
              {FEATURE_MATRIX_CONTENT.columns.status}
            </th>
            <th className="text-center">
              {FEATURE_MATRIX_CONTENT.columns.phase}
            </th>
          </tr>
        </thead>
        <tbody>
          {BATTERY_PASSPORT_FEATURES.map((item) => (
            <FeatureRow key={item.feature} {...item} />
          ))}
        </tbody>
      </table>
    </div>
  </section>
  );
}
