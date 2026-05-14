import { axe } from "vitest-axe";
import { renderWithProviders, screen, cleanup } from "../../test-utils";
import ServicesGroup from "./ServicesGroup";

const FIXTURE_SERVICES = [
  {
    id: "test-service-a",
    icon: "bi-shield-check",
    title: "Test Service A",
    tagline: "Tagline A",
    description: "Description A.",
  },
  {
    id: "test-service-b",
    icon: "bi-tools",
    title: "Test Service B",
    tagline: "Tagline B",
    description: "Description B.",
  },
  {
    id: "test-service-c",
    icon: "bi-globe",
    title: "Test Service C",
    tagline: "Tagline C",
    description: "Description C.",
    passportLink: "/passport",
  },
];

describe("ServicesGroup", () => {
  it("renders an h2 heading with the provided label", () => {
    renderWithProviders(
      <ServicesGroup
        id="engineering"
        label="Engineering"
        services={FIXTURE_SERVICES}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Engineering" }),
    ).toBeInTheDocument();
  });

  it("renders a section element with the provided id", () => {
    const { container } = renderWithProviders(
      <ServicesGroup
        id="engineering"
        label="Engineering"
        services={FIXTURE_SERVICES}
      />,
    );
    const section = container.querySelector("section#engineering");
    expect(section).not.toBeNull();
  });

  it("renders one card per service in the services array", () => {
    renderWithProviders(
      <ServicesGroup
        id="engineering"
        label="Engineering"
        services={FIXTURE_SERVICES}
      />,
    );
    FIXTURE_SERVICES.forEach((service) => {
      expect(
        screen.getByText(service.title, { selector: ".service-card-title" }),
      ).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Description [A-C]\./)).toHaveLength(
      FIXTURE_SERVICES.length,
    );
  });

  it("renders the intro paragraph when the intro prop is provided", () => {
    const intro = "An overview of engineering services.";
    renderWithProviders(
      <ServicesGroup
        id="engineering"
        label="Engineering"
        intro={intro}
        services={FIXTURE_SERVICES}
      />,
    );
    expect(screen.getByText(intro)).toBeInTheDocument();
  });

  it("does not render an intro paragraph when intro is omitted", () => {
    const { container } = renderWithProviders(
      <ServicesGroup
        id="engineering"
        label="Engineering"
        services={FIXTURE_SERVICES}
      />,
    );
    expect(
      container.querySelector(".services-group-intro"),
    ).toBeNull();
  });

  it("has no accessibility violations", async () => {
    cleanup();
    const { container } = renderWithProviders(
      <ServicesGroup
        id="engineering"
        label="Engineering"
        intro="An overview of engineering services."
        services={FIXTURE_SERVICES}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
