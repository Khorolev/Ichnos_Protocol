import { renderWithProviders, screen } from "../../test-utils";
import TechnologyRoadmap from "./TechnologyRoadmap";
import { ROADMAP_PHASES } from "../../constants/passportContent";

const APPROVED_FOOTER =
  "The Solana choice aligns with the project's values: high throughput, low cost, and a growing ecosystem of battery-lifecycle-focused decentralized applications.";

describe("TechnologyRoadmap", () => {
  it("renders the exact approved footer copy", () => {
    renderWithProviders(<TechnologyRoadmap />);
    expect(screen.getByText(APPROVED_FOOTER)).toBeInTheDocument();
  });

  it("does not render the word 'sustainability' anywhere on the roadmap", () => {
    const { container } = renderWithProviders(<TechnologyRoadmap />);
    expect(container.textContent).not.toMatch(/sustainability/i);
  });

  it("preserves the existing roadmap phase structure and Solana rationale", () => {
    renderWithProviders(<TechnologyRoadmap />);
    ROADMAP_PHASES.forEach(({ title }) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
    const productionPhase = ROADMAP_PHASES.find((phase) => phase.id === "production");
    expect(productionPhase.description).toMatch(/Solana/);
    expect(screen.getByText(productionPhase.description)).toBeInTheDocument();
  });
});
