/**
 * Every piece of copy, link and image path on the site lives here.
 * Edit this file to change content — the components only render it.
 * Swap placeholder images by dropping your files into /public/images
 * and updating the paths below (e.g. "/images/projects/atlas.jpg").
 */

export const site = {
  name: "Inés Valverde",
  title: "Inés Valverde — Robotics Engineer",
  description:
    "Portfolio of Inés Valverde, a senior robotics engineer based in Valencia, building collaborative, legged and aerial robots.",
  handle: "INÉSVALVERDE_VLC",
  timeZone: "Europe/Madrid",
  email: "hello@example.com",
  cvUrl: "https://read.cv",
};

export const nav = {
  cta: { label: "Lets talk", href: "#contact" },
  menu: [
    { label: "Work", href: "#work" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ],
};

export type Social = { label: string; href: string };

export const socialsPrimary: Social[] = [
  { label: "GitHub", href: "https://github.com" },
  { label: "LinkedIn", href: "https://www.linkedin.com" },
  { label: "Read.cv", href: "https://read.cv" },
];

export const socialsSecondary: Social[] = [
  { label: "Scholar", href: "https://scholar.google.com" },
  { label: "YouTube", href: "https://www.youtube.com" },
  { label: "Instagram", href: "https://www.instagram.com" },
];

export const hero = {
  firstName: "Inés",
  lastName: "Valverde",
  role: "Sr. Robotics Engineer",
  location: "Based in Valencia",
  edition: "Portfolio_20/26",
  scrollHint: { label: "[Scroll to explore]", href: "#work" },
};

export type Project = {
  slug: string;
  title: string;
  category: string;
  year: string;
  image: string;
};

export const work = {
  label: "(Selected work)",
  range: "Robotics_2022—2026",
  dragHint: "[Drag to explore]",
  projects: [
    { slug: "atlas", title: "Atlas", category: "Collaborative Manipulation", year: "2026", image: "/images/projects/atlas.svg" },
    { slug: "tidewalker", title: "Tidewalker", category: "Legged Locomotion", year: "2025", image: "/images/projects/tidewalker.svg" },
    { slug: "pollinator", title: "Pollinator", category: "Aerial Robotics", year: "2025", image: "/images/projects/pollinator.svg" },
    { slug: "kinesis", title: "Kinesis", category: "Dexterous Manipulation", year: "2024", image: "/images/projects/kinesis.svg" },
    { slug: "nave-siete", title: "Nave Siete", category: "Warehouse Autonomy", year: "2023", image: "/images/projects/nave-siete.svg" },
    { slug: "aula", title: "Aula", category: "Educational Robotics", year: "2022", image: "/images/projects/aula.svg" },
  ] satisfies Project[],
};

export const about = {
  label: "(About)",
  statement:
    "I build machines that move with intent. My work lives where mechanics, perception and control meet — robots that are safe around people, honest about uncertainty and quietly reliable when nobody is watching.",
  practice:
    "My practice spans motion planning, embedded control and mechanical design. I prototype fast, test in the real world early and let field data — not assumptions — decide what ships.",
  cvLabel: "Download my CV",
  offDuty:
    "When I’m not in the lab, I sail on the Albufera, restore old film cameras and teach an evening robotics class for teenagers in Ruzafa.",
  stats: [
    { label: "Years in robotics", value: "9+" },
    { label: "Greenwich Mean Time", value: "+1" },
    { label: "Robots in the field", value: "40+" },
  ],
};

export const contact = {
  heading: "Get in touch",
  /** Set `video` to e.g. "/videos/contact.mp4" once you add the file. */
  video: null as string | null,
  poster: "/images/contact.svg",
  credits: { prefix: "Design & engineering_", builtIn: "Built in_", builtWith: "Next.js" },
  copyright: "©2026_All rights reserved",
};
