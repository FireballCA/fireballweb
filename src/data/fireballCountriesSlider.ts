import type { VoyagerSlide } from '@/components/VoyagerCoatingsSlider/VoyagerCoatingsSlider'

/** Unsplash — largeur modérée pour limiter la mémoire (nombreux pays sur la landing). */
function u(photoId: string) {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1600&q=80`
}

/** Pexels — photos (usage conforme aux conditions Pexels). */
function p(photoId: number) {
  return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=1600`
}

/**
 * Présence Fireball dans le monde — slider « Trusted Worldwide ».
 * Une image marquante par pays (paysages / repères visuels).
 */
export const FIREBALL_COUNTRY_SLIDES: VoyagerSlide[] = [
  {
    id: 'ca',
    title: 'CANADA',
    subtitle: 'Official distribution and growing network of certified professionals.',
    // Lac Louise / Rocheuses — repère immédiat « décor canadien »
    image: p(1450082),
  },
  {
    id: 'us',
    title: 'UNITED STATES',
    subtitle: 'Trusted by detailing professionals across the country.',
    image: u('1485738422979-f5c462d49f74'),
  },
  {
    id: 'pr',
    title: 'PUERTO RICO',
    subtitle: 'Expanding presence with dedicated detailing specialists.',
    image: u('1507525428034-b723cf961d3e'),
  },
  {
    id: 'cl',
    title: 'CHILE',
    subtitle: 'Adopted by professionals focused on performance and durability.',
    image: u('1519681393784-d120267933ba'),
  },
  {
    id: 'br',
    title: 'BRAZIL',
    subtitle: 'Growing demand for high-performance detailing solutions.',
    image: u('1483729558449-99ef09a8c325'),
  },
  {
    id: 'fr',
    title: 'FRANCE',
    subtitle: 'Premium detailing standards embraced by professionals.',
    image: u('1502602898657-3e91760cbb34'),
  },
  {
    id: 'de',
    title: 'GERMANY',
    subtitle: 'Engineered precision meets high detailing expectations.',
    image: u('1472214103451-9374bd1c798e'),
  },
  {
    id: 'pl',
    title: 'POLAND',
    subtitle: 'Strong community of skilled detailing professionals.',
    image: u('1469474968028-56623f02e42e'),
  },
  {
    id: 'no',
    title: 'NORWAY',
    subtitle: 'Built to perform in harsh and demanding conditions.',
    image: u('1426604966848-d7adac402bff'),
  },
  {
    id: 'tr',
    title: 'TURKEY',
    subtitle: 'Expanding network of certified installers and enthusiasts.',
    image: u('1441974231531-c6227db76b6e'),
  },
  {
    id: 'ua',
    title: 'UKRAINE',
    subtitle: 'Adopted by professionals delivering high-end results.',
    image: u('1501854140801-50d01698950b'),
  },
  {
    id: 'ru',
    title: 'RUSSIA',
    subtitle: 'Trusted for durability in extreme environments.',
    image: u('1518837695005-2083093ee35b'),
  },
  {
    id: 'ae',
    title: 'UNITED ARAB EMIRATES',
    subtitle: 'Designed for extreme heat and premium vehicle care.',
    image: p(417074),
  },
  {
    id: 'dubai',
    title: 'DUBAI',
    subtitle:
      'City skyline & luxury hubs: flagship studios, supercar culture, and concours-level finishing.',
    // Ville (skyline Dubai) — pas un paysage générique
    image: p(3787839),
  },
  {
    id: 'uz',
    title: 'UZBEKISTAN',
    subtitle: 'Emerging market with growing detailing expertise.',
    image: u('1564501049412-61c2a3083791'),
  },
  {
    id: 'in',
    title: 'INDIA',
    subtitle: 'Rapidly growing demand for premium detailing solutions.',
    image: p(2387873),
  },
  {
    id: 'th',
    title: 'THAILAND',
    subtitle: 'Strong adoption in high-end detailing studios.',
    image: p(346885),
  },
  {
    id: 'vn',
    title: 'VIETNAM',
    subtitle: 'Expanding presence among professional detailers.',
    image: p(2929241),
  },
  {
    id: 'cn',
    title: 'CHINA',
    subtitle: 'Large-scale adoption of advanced coating technologies.',
    image: p(350749),
  },
  {
    id: 'kr',
    title: 'SOUTH KOREA',
    subtitle: 'Home of innovation and Fireball technology.',
    image: p(355241),
  },
  {
    id: 'jp',
    title: 'JAPAN',
    subtitle: 'Precision-driven detailing culture and performance.',
    image: p(356004),
  },
  {
    id: 'ph',
    title: 'PHILIPPINES',
    subtitle: 'Growing network of passionate detailing professionals.',
    image: p(3400236),
  },
  {
    id: 'bn',
    title: 'BRUNEI',
    subtitle: 'Premium detailing solutions for a niche market.',
    image: p(357156),
  },
  {
    id: 'sg',
    title: 'SINGAPORE',
    subtitle: 'High-end detailing standards in a premium market.',
    image: p(358532),
  },
  {
    id: 'id',
    title: 'INDONESIA',
    subtitle: 'Expanding community of detailing enthusiasts.',
    image: p(2166553),
  },
  {
    id: 'au',
    title: 'AUSTRALIA',
    subtitle: 'Engineered for extreme conditions and performance.',
    image: u('1506905925346-21bda4d32df4'),
  },
  {
    id: 'nz',
    title: 'NEW ZEALAND',
    subtitle: 'Trusted by professionals focused on quality and care.',
    image: p(363047),
  },
]
