export type GaugeKey = 'hardness' | 'gloss' | 'resistance' | 'hydrophobicity'

export type CoatingSection = {
  id: string
  name: string
  years: string
  price: number
  description: string
  highlights: string[]
  gauges: Record<GaugeKey, number>
  matchNames: string[]
}

export const CERAMIC_COATING_SECTIONS: CoatingSection[] = [
  {
    id: 'dok-do-10',
    name: 'DOK DO',
    years: '10-YEAR',
    price: 2200,
    description:
      'Dok Do is our state-of-the-art flagship coating suited exclusively to the most skilled, hand-picked installers in the world. This 10 year coating exceeds 9H hardness and leads the industry in the highest amount of Si02. Dok Do consists of a super hard base coat, topped with a hard chemical resistant & glossy top coat. Dok Do contains over 92% Si02 & Si glass ceramic compounds made from five different types of Si02. Dok Do also contains high levels of titanium dioxide.\n\nWe recommend Dok Do on prestige vehicles where no compromise is requested by a customer. Exceeds 9H Hardness.\n\nDok Do Ceramic Coating is an innovative, two-layer formula of the highest proprietary renown, generating maximum protection for your vehicle.',
    highlights: [
      '10 Year Durability',
      'Our strongest most durable long lasting coating',
      'Highest Levels Of Protection',
      'Highest Levels of Depth & Gloss',
      'The World’s Best Ceramic Coating',
      'Highest percentage levels of ceramic compounds',
      'Leads the industry in every category',
    ],
    gauges: { hardness: 100, gloss: 100, resistance: 100, hydrophobicity: 100 },
    matchNames: ['dok do', 'dokdo'],
  },
  {
    id: 'butterfly-graphene-9',
    name: 'BUTTERFLY GRAPHENE',
    years: '9-YEAR',
    price: 2000,
    description:
      'Butterfly Graphene- The new and improved formula contains even more chemical and water spot resistance compared to other coatings on the market. The ultra slick coating makes for an incredibly easy installation process. The surface can be washed within 8 hours of application, with full curing taking place between 48-72 hours making for a faster curing process (depending on climate). Butterfly Graphene contains over 90% Si02 & Si glass-ceramic compounds made from five different types of Si02. The formula also contains titanium along with added graphene oxide for increased durability up to 9 years. The advanced graphene technology enhances gloss, water-spot resistance, increased slickness, hydrophobicity and exceeds 9H hardness for an extremely durable coating.\n\nButterfly Graphene is the latest in single-layer coatings. This new and improved formula is designed to give you the best protection against corrosion that synthesizes Nobel-prize winning research into an efficient, hyper-protective finish.',
    highlights: [
      '9 Year Durability',
      'Advanced graphene oxide ceramic technology',
      'Extremely hard',
      'Enhances gloss',
      'The best graphene coating in the world',
      'Modern innovation',
      '1-Layer Application',
    ],
    gauges: { hardness: 82, gloss: 82, resistance: 82, hydrophobicity: 78 },
    matchNames: ['butterfly graphene', 'graphene'],
  },
  {
    id: 'butterfly-7',
    name: 'BUTTERFLY',
    years: '7-YEAR',
    price: 1800,
    description:
      'Since the inception, Butterfly has been our flagship single layer coating. Butterfly is made from high quality materials that provide an incredible look with long lasting durability. Backed by a 7 year guarantee and made from industry leading technology, Butterfly’s innovative formula continues to push forward with high quality results that deliver in all types of weather conditions. Butterfly contains over 90% Si02 & Si glass ceramic compounds made from five different types of Si02. Butterfly also contains heavy amounts of titanium dioxide for more protection.',
    highlights: [
      '7 Year Durability',
      'Advanced Ceramic Technology',
      'Extremely Hard; Enhances Gloss',
      'Perfect For Daily Driven Vehicles',
      'The Most Popular Coating Option',
      '1-Layer Application',
    ],
    gauges: { hardness: 90, gloss: 88, resistance: 60, hydrophobicity: 80 },
    matchNames: ['butterfly'],
  },
  {
    id: 'silla-5',
    name: 'SILLA',
    years: '5-YEAR',
    price: 1500,
    description:
      'Silla is the highest corrosion resistant ceramic coating in the Fireball collection specializing in assurance against harmful contaminants. It features a single layer that warrants up to a 5 year guarantee from a proven formula pushing boundaries that provides excellent chemical resistance against salt, rust, and grime. Silla contains over 88% Si02 & Si glass ceramic compounds made from five different types of Si02. Silla also contains heavy amounts of titanium dioxide for more protection.\n\nSilla is a fantastic product for those that live in harsh environments with chemical or salty conditions. It reduces the risk of water spotting on your paintwork, and it won’t scratch easily like other coatings. Furthermore, Silla protects against coastal erosion which can be quite problematic when living close to oceans.',
    highlights: [
      '5 Year Durability',
      'Added Protection From Pollution',
      'Highest Chemical Resistance',
      'Intense Surface Clarity',
      'Perfect For Marine Applications',
    ],
    gauges: { hardness: 82, gloss: 80, resistance: 96, hydrophobicity: 58 },
    matchNames: ['silla'],
  },
  {
    id: 'devils-blood-3',
    name: "DEVIL'S BLOOD",
    years: '3-YEAR',
    price: 1200,
    description:
      'Devils Blood is the next generation of car care technology, utilizing an innovative hybrid nano structure. These breakthroughs create a high gloss dense coating with advances in various attributes. not seen before; including durability against water spots, acid, solvents, ice, oil, dirt, and UV radiation. Backed by a factory guarantee for up to 3 years. The powerful and superhydrophobic qualities resist the elements from the harshest conditions. This coating has an unprecedented self-cleaning feature unlike coatings of this nature. Devil’s Blood not only cleans itself but also limits dirt within its own bounds. Devil’s Blood contains over 81% Si02 & Si glass ceramic compounds made from five different types of Si02. Devil’s Blood also contains heavy amounts of titanium dioxide.\n\nLooking for a coating that can withstand the elements? Look no further than devil’s blood. This powerful and superhydrophobic coating is perfect for those who need a durable product that can resist the harshest conditions. Plus, its self-cleaning feature is unlike anything on the market today. So if you’re looking for a high-quality, long-lasting coating, devil’s blood is the perfect choice.',
    highlights: [
      '3 Year Durability',
      'Highest Level Of Hydrophobics',
      'Great Chemical Resistance',
      'Creates Outstanding Depth',
      'Optimal Solution For Price and Quality',
    ],
    gauges: { hardness: 80, gloss: 80, resistance: 90, hydrophobicity: 88 },
    matchNames: ["devil's blood", 'devils blood'],
  },
  {
    id: 'aegis-2',
    name: 'AEGIS',
    years: '2-YEAR',
    price: 900,
    description:
      'Aegis is a groundbreaking molecular achievement; this breakthrough contains over 76% Si02 & Si glass ceramic compounds made from five different types of pure Si02, which is higher quality and concentration in Si02 than most other coatings on the market. Aegis also contains titanium which is unseen in the industry for most coatings at this level.\nAegis is an exceptional all-round coating with amazing versatility that can also be used on exterior and interior surfaces and has a factory backed Guarantee for up to 2 years.\n\nAegis is our most versatile ceramic coating, offering outstanding protection for both exteriors and dedicated interior surfaces. This adaptable nano-technology based coating is so refined it’s an absolute marvel to behold.',
    highlights: [
      '2 Year Durability',
      'Flexible-hard Outer Shell',
      'Adds high levels of gloss',
      'High chemical resistance',
      'Versatile-multi-surface',
      'Si02 Content comparative to top tier competitor offerings that claim (5 years +)',
    ],
    gauges: { hardness: 60, gloss: 60, resistance: 70, hydrophobicity: 86 },
    matchNames: ['aegis'],
  },
  {
    id: 'typhoon-1',
    name: 'TYPHOON',
    years: '1-YEAR',
    price: 700,
    description:
      'Typhoon coating is our Super-Hydrophobic coating topper that has a durability of up to 12 months. Typhoon contains over 70% Si & Si02. Typhoon also contains 2.5% Titanium. Typhoon can be applied to glass-work or as a topper onto any paintwork coating from our range to give a super slick and outstanding water repellent finish. Mainly used in areas with high rainfall and/or dirty water areas, where water removal is desirable to keep surfaces cleaner. The main task of Typhoon is to add to the protected surface by giving exceptional hydrophobic properties, gloss, slickness and better self-cleaning properties.\n\nFireball Typhoon is an extremely hydrophobic, chemically bonded nano-coating topper that offers unparalleled protection.',
    highlights: [
      'Up To 1+ Year Durability',
      'Super-hydrophobic Nano-ceramic ⁠Topper-Added Protection',
      'Insane Slickness Unlike anything Else ⁠',
      'Excellent Self-Cleaning',
      'Multi-layerable for added protection',
      'Alternative between wax and coating',
      'Highest levels of depth & gloss on the market',
      'Can be used to add slickness to all coatings excluding',
    ],
    gauges: { hardness: 40, gloss: 96, resistance: 90, hydrophobicity: 94 },
    matchNames: ['typhoon'],
  },
]

/** Visuels locaux — dossier `public/Assets/Coatings/` (priorité sur Shopify). */
export const COATING_SECTION_IMAGES: Record<string, string> = {
  'dok-do-10': '/Assets/Coatings/DokDO.png',
  'butterfly-graphene-9': '/Assets/Coatings/BUTTERFLY-GRAPHENE.png',
  'butterfly-7': '/Assets/Coatings/Butterfly_50ml.png',
  'silla-5': '/Assets/Coatings/Silla_50ml.png',
  'devils-blood-3': '/Assets/Coatings/DevilsBlood.png',
  'aegis-2': '/Assets/Coatings/Aegis_50ml.png',
  'typhoon-1': '/Assets/Coatings/Typhoon_50ml.png',
}
