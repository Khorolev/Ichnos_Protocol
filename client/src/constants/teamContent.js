import {
  CAREER_TIMELINE_FRANCESCO,
  CAREER_TIMELINE_IHSAN,
} from "./teamTimelines";

export const TEAM_MEMBERS = [
  {
    id: "francesco",
    name: "Dr.-Ing. Francesco Maltoni",
    title: "Founder",
    photo: "/founder.png",
    bio: [
      "Dr. Francesco Maltoni is the Founder of Ichnos Protocol. He helps OEMs, Tier-1 suppliers, and recyclers build battery systems and battery passports that work in production — not just on paper.",
      "Francesco's expertise spans battery system architecture and safety, mechanical development, remanufacturing, and EU/APAC compliance. Since 2022, his focus has extended into the operational reality of EU Regulation 2023/1542 and DIN DKE SPEC 99100: what the data actually has to look like, where it comes from in the supply chain, and how to move it between systems that were never designed to talk to each other. At FEV Europe, he led a battery passport pilot project as Lead Expert — Battery Systems, and directed the internal software work that turned real-time battery data into passport-compliant output. He has also contributed to Horizon EU grant proposals on adjacent topics.",
      "His doctorate (Dr.-Ing., RWTH Aachen PEM) was on automotive battery systems for the circular economy, with a focus on remanufacturing — recognised with the 3rd-place RWTH Innovation Award. During his doctoral years he also lectured on battery recycling at the RWTH Aachen Chair of Production Engineering of E-Mobility Components (PEM). Before the doctorate, thirteen years in engineering roles across Ducati, Technogym, and FEV — spanning engine design, motorcycle design, electrification, and vehicle battery design.",
      "In 2026 he founded Ichnos Protocol (Singapore) as a battery advisory practice that also builds a digital Battery Passport platform aligned with EU Regulation 2023/1542 and Malaysian MS 2818.",
    ],
    skillsChips: [
      "Battery Systems & Safety (FMEA · requirements · test management)",
      "Mechanical Development",
      "Remanufacturing & Circular Economy",
      "EU–APAC Compliance (incl. ASEAN)",
      "Battery Passport (EU 2023/1542 · DIN DKE SPEC 99100 · MS 2818)",
      "Project Management & Agile (Scrum, PSM I)",
      "AI Integration",
      "Languages: IT · DE · EN",
    ],
    showTimeline: true,
    timeline: CAREER_TIMELINE_FRANCESCO,
  },
  {
    id: "ihsan",
    name: "Ihsan Ahmad",
    title: "Co-Founder",
    photo: "/ihsan.png",
    bio: [
      "Ihsan Ahmad is Co-Founder of Ichnos Protocol, bringing methodical excellence to the company's digital strategy and product development.",
      "A mathematician by training (M.Sc. Wirtschaftsmathematik, Karlsruhe Institute of Technology), Ihsan combines analytical rigour with hands-on execution across AI integration, quantitative financial modelling, and coordination of testing with notified bodies in the chemical industry.",
      "At Ichnos Protocol, Ihsan leads the digital and analytical workstreams supporting the Battery Passport product — applying his AI-integration background and process discipline to the data, intelligence, and certification layers of the platform.",
    ],
    skillsChips: [
      "AI Integration",
      "Quantitative Modelling",
      "Notified-Body Coordination",
      "Methodical Excellence",
    ],
    showTimeline: false, // hidden — flip after content review
    timeline: CAREER_TIMELINE_IHSAN,
  },
];

export const CORE_COMPETENCIES = [
  {
    id: "battery-engineering",
    title: "Battery Systems Engineering",
    icon: "battery-charging",
    description:
      "Battery system development, requirement management, and performance optimization across automotive and motorcycle industries.",
  },
  {
    id: "eu-regulation",
    title: "EU Regulation & Compliance",
    icon: "shield-check",
    description:
      "Deep expertise in the EU Battery Regulation, homologation requirements, and legal compliance frameworks.",
  },
  {
    id: "circular-economy",
    title: "Circular Economy Strategy",
    icon: "arrow-repeat",
    description:
      "Remanufacturing, repurposing, and second-life strategies to maximize battery asset value and sustainability.",
  },
  {
    id: "software-development",
    title: "Software Development",
    icon: "code-slash",
    description:
      "Full stack web development — building digital solutions that bridge the gap between engineering and technology.",
  },
];

export const VISION_STATEMENT = {
  quote:
    "Batteries should live as long as possible. Remanufacturing and repurposing are not just environmentally responsible — they are economically smart.",
  attribution: "Dr.-Ing. Francesco Maltoni",
};

export const TEAM_PAGE_HEADER = {
  title: "Meet the Team",
  subtitle: "The expertise and vision behind Ichnos Protocol.",
};

export const SECTION_HEADINGS = {
  coreCompetencies: {
    title: "Core Competencies",
    subtitle: "A blend of engineering depth and software capability.",
  },
  careerHighlights: {
    title: "Career Highlights",
    subtitle:
      "A journey from academic research to industry leadership and entrepreneurship.",
  },
  vision: {
    title: "Our Vision",
    subtitle: "The conviction driving everything we build.",
  },
};
