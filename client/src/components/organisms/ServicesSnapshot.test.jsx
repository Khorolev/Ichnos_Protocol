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

  it('renders exactly one pillar badge per card', () => {
    const { container } = renderWithProviders(<ServicesSnapshot />);
    const cards = container.querySelectorAll('.service-card');
    expect(cards).toHaveLength(SERVICES_LIST.length);
    cards.forEach((card) => {
      const badges = card.querySelectorAll('.pillar-badge');
      expect(badges).toHaveLength(1);
    });
  });

  it('renders the expected badge label on each card in SERVICES_LIST order', () => {
    const { container } = renderWithProviders(<ServicesSnapshot />);
    const cards = container.querySelectorAll('.service-card');
    expect(cards).toHaveLength(SERVICES_LIST.length);

    const expectedBadgeFor = (service) => {
      if (service.deliveryMethod === true) return 'DELIVERY METHOD';
      if (service.pillar === 'engineering') return 'ENGINEERING';
      if (service.pillar === 'compliance') return 'COMPLIANCE';
      if (service.pillar === 'circularity') return 'CIRCULARITY';
      return null;
    };

    SERVICES_LIST.forEach((service, index) => {
      const card = cards[index];
      const title = card.querySelector('.service-card-title');
      expect(title).not.toBeNull();
      expect(title.textContent).toBe(service.title);

      const badge = card.querySelector('.pillar-badge');
      const actualLabel = badge ? badge.textContent : null;
      expect(actualLabel).toBe(expectedBadgeFor(service));
    });
  });

  it('renders the exact badge label distribution', () => {
    const { container } = renderWithProviders(<ServicesSnapshot />);
    const labels = Array.from(container.querySelectorAll('.pillar-badge')).map(
      (b) => b.textContent,
    );
    const counts = labels.reduce((acc, label) => {
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({
      ENGINEERING: 2,
      COMPLIANCE: 2,
      CIRCULARITY: 1,
      'DELIVERY METHOD': 1,
    });
  });

  it('does not mention "Sustainability" anywhere', () => {
    const { container } = renderWithProviders(<ServicesSnapshot />);
    expect(container.textContent).not.toMatch(/Sustainability/i);
  });

  it('has no accessibility violations', async () => {
    cleanup();
    const { container } = renderWithProviders(<ServicesSnapshot />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
