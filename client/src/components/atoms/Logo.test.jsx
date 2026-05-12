import { describe, it, expect } from 'vitest';

import Logo from './Logo';
import { renderWithProviders, screen, fireEvent } from '../../test-utils';

describe('Logo', () => {
  it('renders advisory logo by default', () => {
    renderWithProviders(<Logo />);

    const img = screen.getByAltText('Ichnos Protocol');
    expect(img).toHaveAttribute('src', '/logo.png');
  });

  it('renders legacy logo when theme="passport"', () => {
    renderWithProviders(<Logo theme="passport" />);

    const img = screen.getByAltText('Ichnos Protocol');
    expect(img).toHaveAttribute('src', '/logo-legacy.png');
  });

  it('falls back to text when image fails to load', () => {
    renderWithProviders(<Logo />);

    const img = screen.getByAltText('Ichnos Protocol');
    fireEvent.error(img);

    expect(screen.getByText('ICHNOS PROTOCOL')).toBeInTheDocument();
    expect(screen.queryByAltText('Ichnos Protocol')).toBeNull();
  });
});
