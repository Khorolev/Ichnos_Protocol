import { Link } from 'react-router-dom';

const PROFILE_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'surname', label: 'Surname' },
  { key: 'email', label: 'Email' },
  { key: 'company', label: 'Company' },
  { key: 'phone', label: 'Phone' },
  { key: 'linkedin', label: 'LinkedIn' },
];

export default function ContactFormProfile({ profile }) {
  if (!profile) return null;

  return (
    <div className="mb-3">
      <h6 className="fw-bold">Your Profile</h6>
      {PROFILE_FIELDS.filter(({ key }) => profile[key]).map(({ key, label }) => (
        <p key={key} className="mb-1 small">
          <strong>{label}:</strong> {profile[key]}
        </p>
      ))}
      <Link to="/privacy" className="small">
        Edit profile
      </Link>
    </div>
  );
}
