import { Button as BsButton } from 'react-bootstrap';

export default function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  ...rest
}) {
  return (
    <BsButton
      variant={variant}
      className={className}
      onClick={onClick}
      {...rest}
    >
      {children}
    </BsButton>
  );
}
