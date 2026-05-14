import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

const RECOGNITION_BY_MEMBER_ID = {
  francesco: [
    {
      id: "award",
      heading: "Award",
      items: [
        "RWTH Innovation Award, 3rd place — circular-economy battery systems",
      ],
    },
    {
      id: "patents",
      heading: "Patents",
      items: [
        "Battery module and method for producing same",
        "Battery with an interface for transmitting a control command that reconfigures the battery for a new purpose or recycling",
        "Oil multiple pump and motor vehicle with such a multiple oil pump",
        "Inlet device for an internal combustion engine and internal combustion engine",
      ],
    },
    {
      id: "publications",
      heading: "Publications",
      items: [
        "Cell Tab Cooling System for Battery Life Extension",
        "Design of automotive battery systems for the circular economy",
        "Recycling von Lithium-Ionen-Batterien",
        "Battery Pack Remanufacturing Process up to Cell Level with Sorting and Repurposing of Battery Cells",
        "Benefits of aluminium cell housings for cylindrical lithium-ion batteries",
      ],
    },
    {
      id: "certification",
      heading: "Certification",
      items: [
        "Professional Scrum Master™ I (PSM I) — Scrum methodology (not a project-management credential)",
      ],
    },
    {
      id: "teaching",
      heading: "Teaching",
      items: [
        "Battery recycling lessons at RWTH Aachen Chair of Production Engineering of E-Mobility Components (PEM), during doctoral period (2017–2021)",
      ],
    },
  ],
};

export default function RecognitionBlock({ memberId }) {
  const subsections = RECOGNITION_BY_MEMBER_ID[memberId];
  if (!subsections || subsections.length === 0) {
    return null;
  }

  return (
    <section className="py-4" data-testid="recognition-block">
      <Row>
        <Col xs={12} md={10} lg={8}>
          <h3 className="h5 fw-semibold mb-3">Recognition</h3>
          {subsections.map((subsection) => (
            <div key={subsection.id}>
              <h4 className="h6 fw-semibold mt-3 mb-2">{subsection.heading}</h4>
              <ul className="list-unstyled small section-subtext mb-2">
                {subsection.items.map((item, index) => (
                  <li key={`${subsection.id}-${index}`} className="mb-1">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Col>
      </Row>
    </section>
  );
}
