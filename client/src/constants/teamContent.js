import {
  CAREER_TIMELINE_FRANCESCO,
  CAREER_TIMELINE_IHSAN,
} from "./teamTimelines";

export const TEAM_MEMBERS = [
  {
    id: "francesco",
    name: "Dr.-Ing. Francesco Maltoni",
    title: "Founder & Lead Consultant",
    photo: "/founder.png",
    bio: [
      "Dr.-Ing. Francesco Maltoni founded Ichnos Protocol after a career spanning research and industry leadership in the battery and automotive sectors.",
      "His academic research at RWTH Aachen University focused on circular economy for battery systems, with an emphasis on remanufacturing. He then served as Lead Expert for Battery Systems at FEV Europe, gaining deep industry experience in battery system development, requirement management, and EU Battery Regulation compliance.",
      "Combining domain expertise with hands-on software engineering skills acquired at Sigma School, Dr.-Ing. Maltoni is uniquely positioned to build a Battery Passport solution that serves both regulatory compliance and real-world utility.",
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
      "Ihsan Ahmad is Co-Founder with years of experience in EU regulatory frameworks and technical compliance management within the battery industry.",
      "As a Technomathematician, he combines analytical problem-solving with deep technical and regulatory expertise, supporting companies in navigating complex battery certification and compliance processes.",
      "His expertise includes EU Battery Regulation compliance, Battery Passport systems, requirement management, homologation support, and coordination with testing and certification bodies.",
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
