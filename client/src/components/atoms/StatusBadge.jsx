const STATUS_VARIANTS = {
  Live: 'badge-status-live',
  'In Development': 'badge-status-dev',
  Planned: 'badge-status-planned',
};

const StatusBadge = ({ status }) => (
  <span className={`badge ${STATUS_VARIANTS[status] || 'badge-status-planned'}`}>
    {status}
  </span>
);

export default StatusBadge;
