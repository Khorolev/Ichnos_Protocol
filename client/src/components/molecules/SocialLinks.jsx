import Icon from '../atoms/Icon';

export default function SocialLinks({ links }) {
  return (
    <div className="d-flex gap-3 align-items-center">
      {links.map(({ url, icon, label }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="text-decoration-none social-link"
        >
          <Icon name={icon} className="fs-5" />
        </a>
      ))}
    </div>
  );
}
