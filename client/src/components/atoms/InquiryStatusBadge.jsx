import Badge from 'react-bootstrap/Badge';

const STATUS_MAP = {
  new: { bg: 'primary', label: 'New' },
  contacted: { bg: 'info', label: 'Contacted' },
  in_progress: { bg: 'warning', label: 'In Progress' },
  resolved: { bg: 'success', label: 'Resolved' },
};

export default function InquiryStatusBadge({ status }) {
  const { bg, label } = STATUS_MAP[status] || STATUS_MAP.new;
  return <Badge bg={bg}>{label}</Badge>;
}
