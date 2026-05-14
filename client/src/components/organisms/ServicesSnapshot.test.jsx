import { axe } from 'vitest-axe';
import { renderWithProviders, screen, cleanup } from '../../test-utils';
import ServicesSnapshot from './ServicesSnapshot';
import { SERVICES_LIST } from '../../constants/services';

describe('ServicesSnapshot', () => {
  it('renders one card for each entry in SERVICES_LIST', () => {
    renderWithProviders(<ServicesSnapshot />);
    const cardHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(cardHeadings).toHaveLength(SERVICES_LIST.length);
  });

  it('renders the service cards in the locked order', () => {
    renderWithProviders(<ServicesSnapshot />);
    const titles = screen
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(titles).toEqual(SERVICES_LIST.map((s) => s.title));
  });

  it('renders the "See full services →" link to /services', () => {
    renderWithProviders(<ServicesSnapshot />);
    const cta = screen.getByTestId('services-snapshot-cta');
    expect(cta).toHaveAttribute('href', '/services');
    expect(cta).toHaveTextContent('See full services →');
  });

  it('has no accessibility violations', async () => {
    cleanup();
    const { container } = renderWithProviders(<ServicesSnapshot />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
