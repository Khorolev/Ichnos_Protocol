// Top-level navbar entries.
// - Flat items have `path` (route) and optionally `sectionId` (scroll target
//   when already on `/`) + `activeSectionId` (scrollspy match).
// - Dropdown items have `children`. Active state for the parent fires when
//   any child matches the current route or the scrollspy section.
export const NAV_ITEMS = [
  {
    label: 'Company',
    activeSectionId: 'company',
    children: [
      // "Why Ichnos" → homepage company section anchor (scrolls to #company)
      { label: 'Why Ichnos', sectionId: 'company' },
      // "Team" → /team route
      { label: 'Team', path: '/team' },
    ],
  },
  { label: 'Services', path: '/services', sectionId: 'services', activeSectionId: 'services' },
  { label: 'Battery Passport', path: '/passport' },
  { label: 'Contact', path: '/contact', sectionId: 'contact', activeSectionId: 'contact' },
];

export const LANDING_SECTION_IDS = ['company', 'services', 'passport', 'contact'];
