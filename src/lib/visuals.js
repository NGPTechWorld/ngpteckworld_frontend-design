export const iconPaths = {
  web: '<polyline points="8 7 4 12 8 17"/><polyline points="16 7 20 12 16 17"/><line x1="13" y1="5" x2="11" y2="19"/>',
  mobile: '<rect x="6" y="2" width="12" height="20" rx="3"/><line x1="11" y1="18" x2="13" y2="18"/>',
  design: '<path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2 9.5 9.5"/><circle cx="11" cy="11" r="2"/>',
  erp: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  cloud: '<path d="M17.5 19a4.5 4.5 0 0 0 .5-9 6 6 0 0 0-11.6-1.5A4 4 0 0 0 6.5 19z"/>',
  ai: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
  support: '<path d="M14.7 6.3a4 4 0 0 0-5.6 5.6l-6.4 6.4a2 2 0 1 0 2.8 2.8l6.4-6.4a4 4 0 0 0 5.6-5.6l-2.6 2.6-2.1-2.1z"/>',
  quality: '<path d="M12 2 15 8l7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
  innovation: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/>',
  commit: '<path d="M20 6 9 17l-5-5"/>',
  transparency: '<circle cx="12" cy="12" r="3"/><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>',
}

const coverMap = {
  web: 'linear-gradient(135deg,#6B4E8E,#301D3D)',
  mobile: 'linear-gradient(135deg,#8160A8,#3A2649)',
  design: 'linear-gradient(135deg,#5A3E78,#241636)',
  ai: 'linear-gradient(135deg,#7657A0,#2A1A3C)',
  erp: 'linear-gradient(135deg,#4E3A6B,#301D3D)',
}

export const coverFor = (k) => coverMap[k] || coverMap.web

export const galleryBgs = () => [
  'linear-gradient(135deg,#6B4E8E,#3A2649)',
  'linear-gradient(135deg,#5A3E78,#241636)',
  'linear-gradient(135deg,#8160A8,#2A1A3C)',
  'linear-gradient(135deg,#4E3A6B,#301D3D)',
]

export const initials = (name = '') =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('')
