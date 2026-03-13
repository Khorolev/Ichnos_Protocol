import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-calendly', () => ({
  InlineWidget: function MockInlineWidget() {
    return <div data-testid="calendly-widget" />;
  },
}));

describe('CalendlyModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with title when isOpen is true', async () => {
    vi.stubEnv('VITE_CALENDLY_URL', 'https://calendly.com/test');
    const { default: CalendlyModal } = await import('./CalendlyModal');

    render(<CalendlyModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Schedule a Call')).toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it('does not render modal when isOpen is false', async () => {
    const { default: CalendlyModal } = await import('./CalendlyModal');

    render(<CalendlyModal isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByText('Schedule a Call')).not.toBeInTheDocument();
  });

  it('shows fallback link when VITE_CALENDLY_URL is not set', async () => {
    vi.stubEnv('VITE_CALENDLY_URL', '');
    vi.resetModules();
    const { default: CalendlyModal } = await import('./CalendlyModal');

    render(<CalendlyModal isOpen={true} onClose={vi.fn()} />);

    const link = screen.getByRole('link', {
      name: /schedule a call via calendly/i,
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://calendly.com');
    vi.unstubAllEnvs();
  });
});
