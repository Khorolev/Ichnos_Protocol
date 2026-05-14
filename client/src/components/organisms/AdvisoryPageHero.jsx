export default function AdvisoryPageHero({ title, subtitle }) {
  return (
    <header className="advisory-page-hero full-bleed-section">
      <h1 className="page-title">{title}</h1>
      <p className="lead section-subtext">{subtitle}</p>
    </header>
  );
}
