import { render, screen } from '@testing-library/react';
import RecognitionBlock from './RecognitionBlock';

describe('RecognitionBlock', () => {
  describe('when rendered for francesco', () => {
    beforeEach(() => {
      render(<RecognitionBlock memberId="francesco" />);
    });

    it('renders the Recognition heading', () => {
      expect(
        screen.getByRole('heading', { level: 3, name: 'Recognition' }),
      ).toBeInTheDocument();
    });

    it('renders the Award subsection with exact text', () => {
      expect(
        screen.getByRole('heading', { level: 4, name: 'Award' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'RWTH Innovation Award, 3rd place — circular-economy battery systems',
        ),
      ).toBeInTheDocument();
    });

    it('renders the Patents subsection with all four patent entries', () => {
      expect(
        screen.getByRole('heading', { level: 4, name: 'Patents' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Battery module and method for producing same'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Battery with an interface for transmitting a control command that reconfigures the battery for a new purpose or recycling',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Oil multiple pump and motor vehicle with such a multiple oil pump',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Inlet device for an internal combustion engine and internal combustion engine',
        ),
      ).toBeInTheDocument();
    });

    it('renders the Publications subsection with all five publication entries', () => {
      expect(
        screen.getByRole('heading', { level: 4, name: 'Publications' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Cell Tab Cooling System for Battery Life Extension'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Design of automotive battery systems for the circular economy',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Recycling von Lithium-Ionen-Batterien'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Battery Pack Remanufacturing Process up to Cell Level with Sorting and Repurposing of Battery Cells',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Benefits of aluminium cell housings for cylindrical lithium-ion batteries',
        ),
      ).toBeInTheDocument();
    });

    it('renders the Certification subsection with exact text', () => {
      expect(
        screen.getByRole('heading', { level: 4, name: 'Certification' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Professional Scrum Master™ I (PSM I) — Scrum methodology (not a project-management credential)',
        ),
      ).toBeInTheDocument();
    });

    it('renders the Teaching subsection with exact text', () => {
      expect(
        screen.getByRole('heading', { level: 4, name: 'Teaching' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Battery recycling lessons at RWTH Aachen Chair of Production Engineering of E-Mobility Components (PEM), during doctoral period (2017–2021)',
        ),
      ).toBeInTheDocument();
    });

    it('exposes the recognition-block test id', () => {
      expect(screen.getByTestId('recognition-block')).toBeInTheDocument();
    });
  });

  it('renders nothing for a member without recognition data', () => {
    const { container } = render(<RecognitionBlock memberId="ihsan" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when memberId is unknown', () => {
    const { container } = render(<RecognitionBlock memberId="unknown" />);
    expect(container).toBeEmptyDOMElement();
  });
});
