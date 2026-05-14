import { axe } from "vitest-axe";
import { renderWithProviders, screen, cleanup } from "../../test-utils";
import VisionStatement from "./VisionStatement";
import { VISION_STATEMENT } from "../../constants/teamContent";

describe("VisionStatement", () => {
  it("renders the locked section heading", () => {
    renderWithProviders(<VisionStatement />);
    expect(
      screen.getByRole("heading", { name: "Our Vision" }),
    ).toBeInTheDocument();
  });

  it("renders the vision quote and attribution", () => {
    renderWithProviders(<VisionStatement />);
    expect(screen.getByText(VISION_STATEMENT.quote)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(VISION_STATEMENT.attribution)),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    cleanup();
    const { container } = renderWithProviders(<VisionStatement />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
