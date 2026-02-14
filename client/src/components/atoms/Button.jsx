const Button = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  ...rest
}) => (
  <button
    type="button"
    className={`btn btn-${variant} ${className}`}
    onClick={onClick}
    {...rest}
  >
    {children}
  </button>
);

export default Button;
