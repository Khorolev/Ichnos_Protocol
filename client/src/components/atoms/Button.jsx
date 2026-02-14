export default function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  ...rest
}) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
