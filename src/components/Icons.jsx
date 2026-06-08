// Lightweight inline SVG icon set — stroke icons sized via `size` prop.
const S = ({ size = 18, children, ...p }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    {...p}
  >
    {children}
  </svg>
)

export const Icon = {
  dashboard: (p) => <S {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></S>,
  briefcase: (p) => <S {...p}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></S>,
  users: (p) => <S {...p}><circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3 3 0 0 1 0 5.4"/><path d="M21 20a5.5 5.5 0 0 0-3.5-5"/></S>,
  user: (p) => <S {...p}><circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/></S>,
  gavel: (p) => <S {...p}><path d="m14 13-7 7"/><path d="M5.5 18.5 8 21"/><path d="m11 9 4 4"/><path d="m13.5 6.5 4 4"/><path d="m9.5 8.5 6-6 4 4-6 6z" transform="rotate(0)"/><path d="M3 21h7"/></S>,
  calendar: (p) => <S {...p}><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></S>,
  folder: (p) => <S {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></S>,
  check: (p) => <S {...p}><path d="M20 6 9 17l-5-5"/></S>,
  checkCircle: (p) => <S {...p}><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5L16 9"/></S>,
  tasks: (p) => <S {...p}><path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 5.5 1.2 1.2 2-2.4M3.5 11.5l1.2 1.2 2-2.4M3.5 17.5l1.2 1.2 2-2.4"/></S>,
  bell: (p) => <S {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></S>,
  settings: (p) => <S {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 7 2.6h.1A1.6 1.6 0 0 0 8.6 1V1a2 2 0 0 1 4 0v.1A1.6 1.6 0 0 0 15 2.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.1a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.4 1z"/></S>,
  search: (p) => <S {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></S>,
  plus: (p) => <S {...p}><path d="M12 5v14M5 12h14"/></S>,
  filter: (p) => <S {...p}><path d="M3 5h18l-7 8v6l-4-2v-4z"/></S>,
  mail: (p) => <S {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></S>,
  lock: (p) => <S {...p}><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></S>,
  eye: (p) => <S {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></S>,
  eyeOff: (p) => <S {...p}><path d="M9.9 5.2A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3 3.8M6.2 6.2A16 16 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 4-.8"/><path d="m9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20"/></S>,
  phone: (p) => <S {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L20 13l2 5v1a2 2 0 0 1-2 2A16 16 0 0 1 4 6a2 2 0 0 1 1-2z"/></S>,
  arrowLeft: (p) => <S {...p}><path d="M19 12H5M12 19l-7-7 7-7"/></S>,
  arrowRight: (p) => <S {...p}><path d="M5 12h14M12 5l7 7-7 7"/></S>,
  upload: (p) => <S {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 9l5-5 5 5M12 4v12"/></S>,
  download: (p) => <S {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></S>,
  clock: (p) => <S {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></S>,
  mapPin: (p) => <S {...p}><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></S>,
  trendUp: (p) => <S {...p}><path d="m3 17 6-6 4 4 8-8"/><path d="M17 7h4v4"/></S>,
  trendDown: (p) => <S {...p}><path d="m3 7 6 6 4-4 8 8"/><path d="M17 17h4v-4"/></S>,
  dots: (p) => <S {...p}><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></S>,
  chevronRight: (p) => <S {...p}><path d="m9 6 6 6-6 6"/></S>,
  logout: (p) => <S {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></S>,
  scale: (p) => <S {...p}><path d="M12 3v18M7 21h10"/><path d="M12 6 5 8l-2.5 5a3 3 0 0 0 5 0L5 8M19 8l-7-2M19 8l2.5 5a3 3 0 0 1-5 0L19 8"/></S>,
  doc: (p) => <S {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></S>,
  alert: (p) => <S {...p}><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.1"/></S>,
  edit: (p) => <S {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></S>,
  send: (p) => <S {...p}><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></S>,
  building: (p) => <S {...p}><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/></S>,
  shield: (p) => <S {...p}><path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/></S>,
  star: (p) => <S {...p}><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.8 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/></S>,
  x: (p) => <S {...p}><path d="M18 6 6 18M6 6l12 12"/></S>,
  menu: (p) => <S {...p}><path d="M3 6h18M3 12h18M3 18h18"/></S>,
}

export default Icon
