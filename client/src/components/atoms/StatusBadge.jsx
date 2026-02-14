import Badge from 'react-bootstrap/Badge';

const STATUS_VARIANTS = {
  Live: 'badge-status-live',
  'In Development': 'badge-status-dev',
  Planned: 'badge-status-planned',
};

export default function StatusBadge({ status }) {
  return (
    <Badge bg="" className={STATUS_VARIANTS[status] || 'badge-status-planned'}>
      {status}
    </Badge>
  );
}
