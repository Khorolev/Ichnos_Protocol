import { describe, it, expect } from 'vitest';

import Logo from './Logo';
import { renderWithProviders, screen, fireEvent } from '../../test-utils';

describe('Logo', () => {
  it('renders default logo when no theme is provided', () => {
    renderWithProviders(<Logo />);

    const img = screen.getByAltText('Ichnos Protocol');
    expect(img).toHaveAttribute('src', '/logo-dark.png');
  });

  it('renders dark-on-light logo when theme="light"', () => {
    renderWithProviders(<Logo theme="light" />);

    const img = screen.getByAltText('Ichnos Protocol');
    expect(img).toHaveAttribute('src', '/logo-dark.png');
  });

  it('renders light-on-dark logo when theme="dark"', () => {
    renderWithProviders(<Logo theme="dark" />);

    const img = screen.getByAltText('Ichnos Protocol');
    expect(img).toHaveAttribute('src', '/logo.png');
  });

  it('remains backwards-compatible with legacy theme="passport"', () => {
    renderWithProviders(<Logo theme="passport" />);

    const img = screen.getByAltText('Ichnos Protocol');
    expect(img).toHaveAttribute('src', '/logo.png');
  });

  it('falls back to text when image fails to load', () => {
    renderWithProviders(<Logo />);

    const img = screen.getByAltText('Ichnos Protocol');
    fireEvent.error(img);

    expect(screen.getByText('ICHNOS PROTOCOL')).toBeInTheDocument();
    expect(screen.queryByAltText('Ichnos Protocol')).toBeNull();
  });
});
