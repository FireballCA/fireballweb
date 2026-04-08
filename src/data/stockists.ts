export interface StockistLocation {
  id: string
  name: string
  address1: string
  address2?: string
  city: string
  province: string
  postalCode?: string
  country: string
  phone?: string
  website?: string
  email?: string
  notes?: string
  lat: number
  lng: number
}

export const STOCKIST_LOCATIONS: StockistLocation[] = [
  { id: 'loc_3m2kpewv', name: 'Gpomp Detailing', address1: '', city: 'Calgary', province: 'Alberta', postalCode: 'T3H', country: 'Canada', phone: '(403) 473-1595', website: 'https://www.instagram.com/gpomp/', lat: 51.0447, lng: -114.0719 },
  { id: 'loc_45nyrnrn', name: 'Northern Detail & Polish', address1: '136 Imperial Road', city: 'North Bay', province: 'Ontario', country: 'Canada', phone: '(705) 230-8863', website: 'http://northerndetailpolish.ca', email: 'admin@northerndetailpolish.ca', lat: 46.3091, lng: -79.4608 },
  { id: 'loc_489k98p6', name: 'Jolivette Detailing', address1: '', city: 'Gatineau', province: 'Quebec', postalCode: 'J9J 3Z1', country: 'Canada', phone: '(819) 790-1134', notes: 'MASTER INSTALLER', lat: 45.4765, lng: -75.7013 },
  { id: 'loc_4nwex7x5', name: 'Infinite Auto Care', address1: '8 Rue Mitchell', city: 'Gatineau', province: 'Quebec', postalCode: 'J8P 2A5', country: 'Canada', phone: '(819) 386-8114', website: 'http://infiniteautocare.ca', email: 'infiniteautocaregatineau@gmail.com', lat: 45.4765, lng: -75.7013 },
  { id: 'loc_4pee298k', name: 'AutoMroad', address1: '395 Rue du parc Suite #1', city: 'Saint-Eustache', province: 'Quebec', postalCode: 'J7R 0A3', country: 'Canada', phone: '(438) 924-7436', website: 'https://www.facebook.com/p/AutoMroad-100068435373964', email: 'Automroad@gmail.com', lat: 45.5650, lng: -73.9050 },
  { id: 'loc_3r88yrvq', name: 'Monza Autospa', address1: '17105 Boul Hymus', city: 'Kirkland', province: 'Quebec', postalCode: 'H9J 0A1', country: 'Canada', phone: '514-992-0618', website: 'https://www.autospamonza.com/', email: 'm-a.martel@autospamonza.com', notes: 'MASTER INSTALLER', lat: 45.4500, lng: -73.8650 },
  { id: 'loc_39ee98wy', name: 'FG Esthetique automobile', address1: '20 Rue Gregoire', city: 'Saint-Lin-Laurentides', province: 'Quebec', postalCode: 'J5M 1T9', country: 'Canada', phone: '(514) 919-8139', website: 'https://www.facebook.com/profile.php?id=100063565360956', email: 'fg_esthetique@outlook.com', lat: 45.8500, lng: -73.7600 },
  { id: 'loc_4z22vgzw', name: 'Protech-Shine', address1: '2568 chemin Chambly', city: 'Longueuil', province: 'Quebec', postalCode: 'J4L 1M4', country: 'Canada', phone: '450 670-9603', website: 'https://protech-shine.com/', email: 'info@protech-shine.com', notes: 'MASTER INSTALLER', lat: 45.5312, lng: -73.5181 },
  { id: 'loc_3x7pqk66', name: 'DTR Detail Shop', address1: '', city: 'Lourdes-de-Joliette', province: 'Quebec', country: 'Canada', phone: '(450) 271-4397', email: 'its_food_11@hotmail.com', lat: 46.0160, lng: -73.4500 },
  { id: 'loc_3jjk92re', name: 'Clinique Automobile Megamorphose', address1: '100 QC-158', city: 'Saint-Thomas', province: 'Quebec', postalCode: 'J0K 3L0', country: 'Canada', phone: '(438) 888-6596', website: 'https://esthetique-auto-megamorphose.odoo.com/', email: 'info.megamorphose@gmail.com', lat: 46.0500, lng: -73.3600 },
  { id: 'loc_487mpw86', name: 'Pat Esthetique Detailing', address1: '', city: 'Ville St Thomas', province: 'Quebec', postalCode: 'J0K 3L0', country: 'Canada', phone: '(418) 282-0277', email: 'patategoulet@gmail.com', notes: 'MASTER INSTALLER', lat: 46.0500, lng: -73.3600 },
  { id: 'loc_32vvjgm9', name: 'Denys Mantha', address1: '', city: 'Saint-Bruno', province: 'Quebec', country: 'Canada', website: 'https://www.facebook.com/denys.mantha.568/', lat: 45.5330, lng: -73.3500 },
  { id: 'loc_3emxykqv', name: 'Auto Spa Protection', address1: '955 rue des Carrieres Suite 6', city: 'Saint-Jean-sur-Richelieu', province: 'Quebec', postalCode: 'J3B 2P1', country: 'Canada', phone: '(438) 491-5027', website: 'http://autospaprotection.com', email: 'info@autospaprotection.com', lat: 45.3160, lng: -73.2660 },
  { id: 'loc_3qjjevzy', name: 'Retro Chic Esthetique', address1: '', city: 'Saint-Basile-Le-Grand', province: 'Quebec', postalCode: 'J3N 1P5', country: 'Canada', phone: '514-702-3126', website: 'https://www.facebook.com/guy.hache.7906', email: 'Retrochicesthetique@gmail.com', notes: 'MASTER INSTALLER', lat: 45.5330, lng: -73.2830 },
  { id: 'loc_32jmqyn9', name: 'Prestige Esthetique Mobile', address1: '', city: 'Contrecoeur', province: 'Quebec', country: 'Canada', phone: '(450) 494-9066', website: 'https://www.facebook.com/profile.php?id=61550952800429', lat: 45.8500, lng: -73.2330 },
  { id: 'loc_4nqpp6n5', name: 'Labelle Protection', address1: '991-B Route 133', city: 'Sabrevois', province: 'Quebec', country: 'Canada', phone: '(450) 821-2125', website: 'http://labelleprotection.com', lat: 45.2330, lng: -73.2500 },
  { id: 'loc_3j5qy99e', name: 'Esthetique Heroux', address1: '3075 Rue Gadbois', city: 'Saint-Jean-Baptiste', province: 'Quebec', postalCode: 'J0L 2B0', country: 'Canada', phone: '(514) 809-3856', website: 'https://esthetiqueheroux.ca/', email: 'esthetique.heroux@hotmail.com', notes: 'MASTER INSTALLER', lat: 45.3800, lng: -73.1200 },
  { id: 'loc_4nnnw7g5', name: 'Martin Shine', address1: '', city: 'Sorel-Tracy', province: 'Quebec', country: 'Canada', phone: '450-561-5434', website: 'https://martinshine.wixsite.com/martinshine', lat: 46.0400, lng: -73.1100 },
  { id: 'loc_3g77zrj7', name: 'Dynamik Esthetique', address1: '7400 Bd Laurier O', city: 'Saint-Hyacinthe', province: 'Quebec', postalCode: 'J2S 9A9', country: 'Canada', phone: '(514) 799-7175', website: 'https://dynamikesthetiqueauto.ca/', notes: 'MASTER INSTALLER', lat: 45.6300, lng: -72.9500 },
  { id: 'loc_4wpk2nwx', name: 'Passion Detailing', address1: '8007 Emilien-Letarte', city: 'Saint-Hyacinthe', province: 'Quebec', postalCode: 'J2R 0A4', country: 'Canada', phone: '4509243233', email: 'info@passiondetailing.ca', notes: 'MASTER INSTALLER', lat: 45.6300, lng: -72.9500 },
  { id: 'loc_3eeem2qv', name: 'Perfexion Esthetique Auto', address1: '84 Chem. De Saint-Gerard', city: 'Shawinigan', province: 'Quebec', postalCode: 'G9N 6Z3', country: 'Canada', phone: '(819) 944-4690', website: 'https://perfexion.ca/', email: 'info@perfexion.ca', lat: 46.5500, lng: -72.7500 },
  { id: 'loc_466wry85', name: 'Brillance Esthetique Auto', address1: '192 Rue Robinson Sud', city: 'Granby', province: 'Quebec', postalCode: 'J2G 7M1', country: 'Canada', phone: '(450) 776-5757', website: 'https://brillanceesthetique.com/', email: 'info@brillanceesthetique.com', lat: 45.4040, lng: -72.7320 },
  { id: 'loc_4kyyqrxq', name: 'JF Prince Mdrn Detailing', address1: '', city: 'Granby', province: 'Quebec', postalCode: 'J2G 9M6', country: 'Canada', lat: 45.4040, lng: -72.7320 },
  { id: 'loc_32699gv9', name: 'Belle Gamme Esthetique Automobile', address1: '', city: 'Granby', province: 'Quebec', country: 'Canada', phone: '(450) 405-8717', lat: 45.4040, lng: -72.7320 },
  { id: 'loc_47nn8mzq', name: 'Ric Esthetique', address1: '1610 Rue Landry', city: 'Acton Vale', province: 'Quebec', postalCode: 'J0H 1A0', country: 'Canada', phone: '(450) 230-7902', website: 'https://www.facebook.com/RicEsthetique/', email: 'ricesthetique@outlook.com', lat: 45.6500, lng: -72.5600 },
  { id: 'loc_4w5v7mkx', name: 'Protection Ultimum', address1: '1203 Route 122', city: 'Notre-Dame-du-Bon-Conseil', province: 'Quebec', country: 'Canada', phone: '(819) 850-6586', website: 'https://www.protectionultimum.com', email: 'info@protectionultimum.com', notes: 'MASTER INSTALLER', lat: 45.8900, lng: -72.3500 },
  { id: 'loc_4kgmwxxq', name: 'Precision Autoworks', address1: '1322A rue Notre-Dame O', city: 'Victoriaville', province: 'Quebec', postalCode: 'G6P 7L6', country: 'Canada', phone: '(819) 960-6215', email: 'precision.autoworks@hotmail.com', lat: 46.0600, lng: -71.9600 },
  { id: 'loc_3qjjevxy', name: 'Sherbrooke Auto Care', address1: '50 rue Radisson', city: 'Sherbrooke', province: 'Quebec', postalCode: 'J1L 1E3', country: 'Canada', phone: '819 569-0303', website: 'https://sherbrookeautocare.com/', email: 'anthony@sherbrookeautocare.com', lat: 45.4042, lng: -71.8929 },
  { id: 'loc_3mmx2kkv', name: 'Wipe Garage', address1: '700 Notre-Dame Est', city: 'Victoriaville', province: 'Quebec', postalCode: 'G6P 4B7', country: 'Canada', phone: '(819) 806-1650', email: 'wipe-garage@hotmail.com', lat: 46.0600, lng: -71.9600 },
  { id: 'loc_3qjjev9y', name: "S'a Coche Esthetique Automobile", address1: '221 1re Avenue Nord', city: 'Saint-Gedeon-de-Beauce', province: 'Quebec', postalCode: 'G0W 2V0', country: 'Canada', phone: '(418) 487-8065', website: 'https://sacocheesthetiqueautomobile.com/', email: 'info@sacocheesthetiqueautomobile.com', notes: 'MASTER INSTALLER', lat: 46.1200, lng: -70.7000 },
  { id: 'loc_4peevpmk', name: 'Shine It Esthetique Auto', address1: '1925 Boul. Alphonse-Desjardins', city: 'Levis', province: 'Quebec', postalCode: 'G6V 9K5', country: 'Canada', phone: '(418) 906-5111', website: 'https://www.facebook.com/shine.it.esthetique.auto', email: 'Shineit.esthetique@hotmail.com', notes: 'MASTER INSTALLER', lat: 46.7380, lng: -71.2460 },
  { id: 'loc_5z7zzren', name: 'Entretien extreme JB inc.', address1: '255-C 59e avenue', city: 'Beauceville', province: 'Quebec', postalCode: 'G5X 0A1', country: 'Canada', phone: '(418) 957-7709', website: 'https://www.facebook.com/profile.php?id=61563042144596', email: 'entretienextremejb@gmail.com', lat: 46.2170, lng: -70.7800 },
  { id: 'loc_4nrxj855', name: 'PLF Esthetique', address1: '326 route 138', city: 'Saint-Hilarion', province: 'Quebec', postalCode: 'G0A 3V0', country: 'Canada', phone: '(418) 457-3672', website: 'https://www.plfesthetique.com/', email: 'info@plfesthetique.com', lat: 47.5600, lng: -70.2000 },
  { id: 'loc_4kyyqx8q', name: 'The Shine of the Beast', address1: '', city: 'Rimouski', province: 'Quebec', postalCode: 'G0L 1B0', country: 'Canada', phone: '(418) 732-0515', website: 'https://www.facebook.com/p/Esth%C3%A9tique-Automobile-Rimouski-100063502117487', email: 'earimouski@gmail.com', lat: 48.4480, lng: -68.5230 },
  { id: 'loc_3mkq82vv', name: "Daigle's Detailing", address1: '', city: 'Grand-Sault', province: 'New Brunswick', country: 'Canada', phone: '(506) 479-1469', website: 'https://www.facebook.com/DaiglesDetailing1', email: 'Tony.daigle11@yahoo.com', lat: 47.0500, lng: -67.7400 },
  { id: 'loc_3j88r5ee', name: 'XPrience Mobile Detailing', address1: '', city: 'Beaubassin-Est', province: 'New Brunswick', postalCode: 'E4P 6C8', country: 'Canada', phone: '(506) 744-0200', website: 'https://www.facebook.com/benoit.hebert.3150', email: 'benoithebert27@gmail.com', notes: 'MASTER INSTALLER', lat: 46.1800, lng: -64.3600 },
]
