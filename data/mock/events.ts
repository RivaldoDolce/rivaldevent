/**
 * Générateur Haute Fidélité et Événements Mock pour le développement.
 *
 * Combinatoire : 25 titres × 25 images × 31 lieux × 29 organisateurs = ~561 000 combinaisons uniques par catégorie.
 */

import type { MockEvent, MockFeaturedEvent, MockEventDetail, MockOrganizer, MockVenueSummary, MockTicketTier } from './types';

// ============================================================================
// 1. ORGANISATEURS ET LIEUX STATIQUES POUR DÉTAILS
// ============================================================================

const MOCK_ORGANIZERS: readonly MockOrganizer[] = [
  {
    id: "org-1",
    full_name: "Pro Events CMR",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    phone: "+237 6 99 88 77 66"
  },
  {
    id: "org-2",
    full_name: "Ministère de la Culture CMR",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    phone: "+237 2 22 33 44 55"
  },
  {
    id: "org-3",
    full_name: "Cameroon Tech Hub",
    avatar_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100",
    phone: "+237 6 77 66 55 44"
  },
  {
    id: "org-4",
    full_name: "FECAfoot Officiel",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
    phone: "+237 2 33 44 55 66"
  },
  {
    id: "org-5",
    full_name: "Troupe Les Éclats du Mvett",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
    phone: "+237 6 55 44 33 22"
  },
  {
    id: "org-6",
    full_name: "Fondation Hope Cameroun",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    phone: "+237 6 98 11 22 33"
  },
  {
    id: "org-7",
    full_name: "Kribi Sunset Festival Ltd",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100",
    phone: "+237 6 90 22 33 44"
  },
] as const;

const MOCK_VENUE_SUMMARIES: readonly MockVenueSummary[] = [
  { id: 'venue-1', name: 'Palais des Sports (PAPOSY)', city: 'Yaoundé' },
  { id: 'venue-2', name: 'Canal Olympia Bessengue', city: 'Douala' },
  { id: 'venue-3', name: 'Hôtel Pullman Rabingha', city: 'Douala' },
  { id: 'venue-4', name: 'Stade de Japoma', city: 'Douala' },
  { id: 'venue-5', name: 'Maison de la Culture', city: 'Yaoundé' },
  { id: 'venue-6', name: 'Hilton Yaoundé', city: 'Yaoundé' },
  { id: 'venue-7', name: 'Kribi Beach Resort', city: 'Kribi' },
] as const;

const AVATAR_POOL = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
];

// ============================================================================
// 2. DICTIONNAIRES DE TEXTES (25 par catégorie)
// ============================================================================

const TITLES: Record<string, string[]> = {
  concerts: [
    'Live : Charlotte Dipanda', 'Showcase Locko VIP', 'Tenor en Concert', 'Stanley Enow : The Tour', 'Krys M Acoustic',
    'Indira Gospel Night', 'Cysoul - Étoile Montante', 'Fally Ipupa au Cameroun', 'Tayc : Nuit de l\'Amour', 'Kareyce Fotso Live',
    'Mr Leo Unplugged', 'Ko-c : Le Phénomène', 'Petit Pays : La Légende', 'Lady Ponce : Bikutsi Queen', 'Coco Argentée Show',
    'X-Maleya Retour', 'Magasco Urban Night', 'Daphne en Concert', 'Blanche Bailly Showcase', 'Salatiel : Nuit des Boss',
    'Mink\'s : Rap & Vibe', 'Maahlox le Vibeur Live', 'Tzy Panchak & Friends', 'Magic System en Guest', 'Nuit de la Rumba'
  ],
  festivals: [
    'Festival Ngondo', 'Festival du Nguon', 'Kribi Beach Festival', 'Seme Beach Sun & Sound', 'Festival des Arts de la Rue',
    'Carnaval Urbain de Douala', 'Fest-Musique Bantoue', 'Yaoundé Jazz Festival', 'Douala Hip Hop Fest', 'FENAC Cameroun',
    'Ecrans Noirs Cinéma', 'Festival des Grillades', 'Festival du Poisson (Youpwé)', 'Bamenda Cultural Week', 'Foumban Art Fest',
    'Maroua Sahel Festival', 'Festival Sanaga', 'Buea Mountain Fest', 'Limbe Seafood Festival', 'Festival des Rois (Ouest)',
    'Festi-Bikutsi', 'DOMAF (Douala Art Fest)', 'Conte Panafricain', 'Yaoundé Fashion Week', 'Fête de la Musique'
  ],
  conferences: [
    'Sommet IA & Avenir', 'Fintech Afrique Centrale', 'DevCon Cameroun', 'Cybersécurité 360', 'Blockchain & Web3',
    'Entrepreneuriat Féminin', 'Innovations Mobile Money', 'Startups & Levée de Fonds', 'Cloud & DevOps Forum', 'E-commerce & Logistique',
    'Agritech Summit', 'Transition Énergétique', 'Marketing Digital', 'Big Data Africa', 'Santé Numérique (E-Health)',
    'Leadership & Management', 'Innovation Bancaire', 'EdTech Cameroun', 'Avenir du Télétravail', 'Création de Contenu',
    'Design UX/UI Masterclass', 'Smart Cities', 'Droit du Numérique', 'Transformation Digitale PME', 'Open Source Africa'
  ],
  sports: [
    'Gala Lions Indomptables', 'Coton Sport vs Union', 'Tournoi Basket Inter-Quartiers', 'Marathon de la Lobé', 'Championnat de Judo',
    'Open Tennis Yaoundé', 'Course de l\'Espoir', 'Finale Coupe du Cameroun', 'Gala Boxe Poids Lourds', 'Tournoi Rugby à 7',
    'Championnat Natation', 'Course Cycliste Chantal Biya', 'Volleyball Plage', 'Lutte Traditionnelle', 'Semi-Marathon Douala',
    'Championnat Taekwondo', 'Tournoi Échecs', 'Match Amical Elite One', 'Futsal Universitaire', 'Compétition Gymnastique',
    'Championnat Athlétisme', 'Course de Pirogues Wouri', 'Finale Handball', 'Open Golf Likomba', 'Tournoi Pétanque'
  ],
  theatre: [
    'Trois Prétendants un Mari', 'Tragédie du Roi Christophe', 'Une Saison au Congo', 'Le Baobab Magique', 'Les Femmes Savantes',
    'L\'Épopée du Mvett', 'Le Mandat du Peuple', 'Bataille de Co-épouses', 'Le Prix de la Dot', 'Nuit de Contes Africains',
    'Le Silence du Masque', 'L\'Ombre du Sorcier', 'Retour au Village', 'La Voix des Ancêtres', 'Le Dilemme du Chef',
    'Comédie de Quartier', 'L\'Enfant Prodige', 'Esprits de la Forêt', 'Secret de la Calebasse', 'Sang de l\'Honneur',
    'Révolte des Esclaves', 'Le Chant du Griot', 'Tribulations d\'un Chômeur', 'Amour et Trahison', 'Danse des Ténèbres'
  ],
  galas: [
    'Gala Croix-Rouge', 'Nuit des Décideurs', 'Bal des Médecins', 'Soirée Lions Club', 'Awards de l\'Excellence',
    'Nuit de la Mode', 'Dîner des Entrepreneurs', 'Bienfaisance Orphelinat', 'Gala Ordre des Avocats', 'Bal des Ingénieurs',
    'Nuit des Étoiles', 'Levée de Fonds Rotary', 'Prestige Immobilier', 'Dîner Spectacle VIP', 'Bal de la Saint-Sylvestre',
    'Gala Anciens Élèves', 'Femmes d\'Influence', 'Gala de l\'Agriculture', 'Gastronomie Africaine', 'Gala des Banquiers',
    'Soirée des Lauréats', 'Dîner Fondation Cœur', 'Art Contemporain', 'Gala Diplomatique', 'Hommage aux Pionniers'
  ]
};

// ============================================================================
// 3. DICTIONNAIRES GÉOGRAPHIQUES ET ORGANISATEURS (31 Lieux & 29 Organisateurs)
// ============================================================================

const VENUES = [ // 31 Lieux
  'Palais des Sports (PAPOSY), Yaoundé', 'Stade de Japoma, Douala', 'Canal Olympia Bessengue, Douala', 'Hilton Hotel, Yaoundé', 
  'Stade d\'Olembé, Yaoundé', 'Kribi Beach Resort', 'Place des Fêtes, Foumban', 'Musée National, Yaoundé', 'GICAM, Douala', 
  'Stade Roumdé Adjia, Garoua', 'Hôtel La Falaise, Bonapriso', 'Palais des Congrès, Yaoundé', 'Stade de la Réunification, Douala', 
  'Parcours Vita, Douala', 'Berges du Wouri, Douala', 'Plage de Ngoye, Kribi', 'Complexe de la Lobé, Kribi', 'Hôtel Pullman, Douala', 
  'Akwa Palace, Douala', 'Djeuga Palace, Yaoundé', 'Institut Français (IFC), Yaoundé', 'Institut Français (IFC), Douala', 
  'Goethe-Institut, Yaoundé', 'Salle des Fêtes d\'Akwa, Douala', 'Star Land Hotel, Bastos', 'Maison de la Culture, Douala', 
  'Buea Mountain Hotel', 'Place des Fêtes, Bafoussam', 'Esplanade Hôtel de Ville, Yaoundé', 'Monument de la Réunification, Yaoundé', 
  'La Chaumière Jazz Club, Douala'
];

const ORGANIZERS = [ // 29 Organisateurs
  'MTN Cameroun', 'Orange Cameroun', 'Empire Company', 'Cyriaque Bassoka Prod', 'FECAFOOT', 'Ministère des Arts (MINAC)', 
  'Ministère des Sports (MINSEP)', 'Institut Français Cameroun', 'Goethe-Institut', 'GICAM', 'Cameroon Tech Hub', 'ActivSpaces', 
  'Fondation Chantal Biya', 'Rotary Club Cameroun', 'Lions Club District 403', 'Trace Africa', 'Boomplay Cameroun', 
  'Association Patrimoine Sawa', 'Canal+ Cameroun', 'Guinness Cameroun', 'Brasseries du Cameroun (SABC)', 'Jumia Cameroun', 
  'Africa First Events', 'Pit Baccardi Events', 'Syndicat des Artistes', 'Ordre des Médecins', 'Ligue Régionale de Football', 
  'Communauté Urbaine de Douala', 'Ministère des Postes & Télécoms'
];

// ============================================================================
// 4. DICTIONNAIRES D'IMAGES (liste blanche d’URLs Unsplash vérifiées HTTP 200)
// ============================================================================
const BASE_URL = 'https://images.unsplash.com/photo-';
const IMG_PARAMS = '?w=800&auto=format&fit=crop&q=80';

const IMAGES: Record<string, string[]> = {
  concerts: [
    '1676156787191-c055f62e9771', '1470225620780-dba8ba36b745', '1501386761578-eac5c94b800a', '1493225457124-a3eb161ffa5f', '1511671782779-c97d3d27a1d4', '1521336575822-6da63fb45455', '1459749411175-04bf5292ceea', '1516450360452-9312f5e86fc7', '1478737270239-2f02b77fc618', '1511192336575-5a79af67a629', '1468164016595-6108e4c60c8b', '1516035069371-29a1b244cc32', '1489599849927-2ee91cede3ba', '1595239094789-4e00e532528a', '1780847614316-c9e933e9a9e0', '1530023367847-a683933f4172', '1533174072545-7a4b6ad7a6c3', '1507525428034-b723cf961d3e', '1555939594-58d7cb561ad1', '1519750157634-b6d493a0f77c'
  ],
  festivals: [
    '1595239094789-4e00e532528a', '1780847614316-c9e933e9a9e0', '1533174072545-7a4b6ad7a6c3', '1507525428034-b723cf961d3e', '1555939594-58d7cb561ad1', '1530023367847-a683933f4172', '1519750157634-b6d493a0f77c', '1528605248644-14dd04022da1', '1511795409834-ef04bbd61622', '1472653431158-6364773b2a56', '1475721027785-f74eccf877e2', '1518611012118-696072aa579a', '1522778119026-d647f0596c20', '1461896836934-ffe607ba8211', '1505373877841-8d25f7d46678', '1552664730-d307ca884978', '1515187029135-18ee286d815b', '1676156787191-c055f62e9771', '1470225620780-dba8ba36b745', '1501386761578-eac5c94b800a'
  ],
  conferences: [
    '1515187029135-18ee286d815b', '1552664730-d307ca884978', '1475721027785-f74eccf877e2', '1505373877841-8d25f7d46678', '1524178232363-1fb2b075b655', '1558403194-611308249627', '1511556532299-8f662fc26c06', '1591115765373-5207764f72e7', '1563245372-f21724e3856d', '1522071820081-009f0129c71c', '1551836022-d5d88e9218df', '1531482615713-2afd69097998', '1573164713988-8665fc963095', '1528605248644-14dd04022da1', '1511795409834-ef04bbd61622', '1519750157634-b6d493a0f77c', '1530023367847-a683933f4172', '1595239094789-4e00e532528a', '1780847614316-c9e933e9a9e0', '1676156787191-c055f62e9771'
  ],
  sports: [
    '1461896836934-ffe607ba8211', '1522778119026-d647f0596c20', '1518611012118-696072aa579a', '1526628953301-3e589a6a8b74', '1483721310020-03333e577078', '1478720568477-152d9b164e26', '1511192336575-5a79af67a629', '1478737270239-2f02b77fc618', '1516450360452-9312f5e86fc7', '1459749411175-04bf5292ceea', '1521336575822-6da63fb45455', '1511671782779-c97d3d27a1d4', '1595239094789-4e00e532528a', '1780847614316-c9e933e9a9e0', '1676156787191-c055f62e9771', '1470225620780-dba8ba36b745', '1501386761578-eac5c94b800a', '1493225457124-a3eb161ffa5f', '1468164016595-6108e4c60c8b', '1516035069371-29a1b244cc32'
  ],
  theatre: [
    '1460723237483-7a6dc9d0b212', '1507676184212-d03ab07a01bf', '1503095396549-807759245b35', '1493225457124-a3eb161ffa5f', '1514525253161-7a46d19cd819', '1470225620780-dba8ba36b745', '1501386761578-eac5c94b800a', '1511671782779-c97d3d27a1d4', '1521336575822-6da63fb45455', '1459749411175-04bf5292ceea', '1516450360452-9312f5e86fc7', '1478737270239-2f02b77fc618', '1511192336575-5a79af67a629', '1595239094789-4e00e532528a', '1780847614316-c9e933e9a9e0', '1676156787191-c055f62e9771', '1468164016595-6108e4c60c8b', '1516035069371-29a1b244cc32', '1489599849927-2ee91cede3ba', '1530023367847-a683933f4172'
  ],
  galas: [
    '1519671482749-fd09be7ccebf', '1469371670807-013ccf25f16a', '1511795409834-ef04bbd61622', '1516035069371-29a1b244cc32', '1552664730-d307ca884978', '1505373877841-8d25f7d46678', '1558403194-611308249627', '1511556532299-8f662fc26c06', '1591115765373-5207764f72e7', '1563245372-f21724e3856d', '1522071820081-009f0129c71c', '1551836022-d5d88e9218df', '1531482615713-2afd69097998', '1595239094789-4e00e532528a', '1780847614316-c9e933e9a9e0', '1676156787191-c055f62e9771', '1470225620780-dba8ba36b745', '1501386761578-eac5c94b800a', '1493225457124-a3eb161ffa5f', '1511671782779-c97d3d27a1d4'
  ]
};

// ============================================================================
// 5. MOTEUR DE GÉNÉRATION D'ÉVÉNEMENTS
// ============================================================================

export function generateRealisticEvents(count: number = 3000): MockEvent[] {
  const categoryIds = ['concerts', 'festivals', 'conferences', 'sports', 'theatre', 'galas'];
  const months = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];

  return Array.from({ length: count }, (_, i) => {
    const cat = categoryIds[i % categoryIds.length];
    
    // Croisements déterministes : les titres, images, lieux et organisateurs évoluent à des rythmes différents.
    const titleList = TITLES[cat] || TITLES.concerts;
    const imgList = IMAGES[cat] || IMAGES.concerts;
    
    const title = titleList[(i * 1) % titleList.length];
    // Le rang dans la catégorie avance séparément : un événement sur six appartient à la même catégorie.
    // Le pas 11 évite les répétitions rapprochées et parcourt progressivement chaque bibliothèque.
    const categoryPosition = Math.floor(i / categoryIds.length);
    const imageIndex = (categoryPosition * 11 + (i % categoryIds.length) * 5) % imgList.length;
    const baseImgId = imgList[imageIndex];
    const venue = VENUES[(i * 7) % VENUES.length];
    const organizer = ORGANIZERS[(i * 11) % ORGANIZERS.length];
    const organizerAvatar = AVATAR_POOL[(i * 11) % AVATAR_POOL.length];
    
    const day = ((i * 13) % 28) + 1;
    const month = months[i % months.length];

    return {
      id: `${i + 1}`,
      title: title,
      image: `${BASE_URL}${baseImgId}${IMG_PARAMS}`,
      date: `${day < 10 ? '0' + day : day} ${month}`,
      location: venue,
      time: `${14 + (i % 7)}h30`,
      organizerName: organizer,
      organizerAvatar: organizerAvatar,
      price: ((i % 15) + 1) * 2000,
      currency: 'FCFA',
      category: cat,
      isFeatured: i % 12 === 0
    };
  });
}

/** 
 * Export de 3000 événements ultra-variés pour tester l'application 
 */
export const MOCK_EVENTS: readonly MockEvent[] = generateRealisticEvents(3000);

/**
 * 8 Événements à la une pour le carrousel principal
 */
export const MOCK_FEATURED: readonly MockFeaturedEvent[] = MOCK_EVENTS
  .filter(e => e.isFeatured)
  .slice(0, 8)
  .map(e => ({
    id: e.id,
    title: e.title,
    image: e.image,
    date: e.date,
    location: e.location,
    category: e.category,
    price: e.price,
    currency: e.currency,
  }));

// ============================================================================
// 6. DÉTAILS D'ÉVÉNEMENT MOCK & HELPERS DE RECHERCHE
// ============================================================================

const tiersDefault: readonly MockTicketTier[] = [
  {
    id: 'tier-std',
    event_id: '1',
    name: 'Standard',
    price: 5000,
    quantity_total: 500,
    quantity_sold: 120,
    description: 'Accès général, zone debout',
    benefits: ['Accès scène générale', 'Boisson de bienvenue'],
    available_quantity: 380,
    is_sold_out: false,
    is_low_stock: false,
  },
  {
    id: 'tier-vip',
    event_id: '1',
    name: 'VIP',
    price: 25000,
    quantity_total: 100,
    quantity_sold: 85,
    description: 'Accès VIP assise & cocktail',
    benefits: ['Zone assise VIP', 'Cocktail prestige', 'Parking VIP'],
    available_quantity: 15,
    is_sold_out: false,
    is_low_stock: true,
  },
  {
    id: 'tier-prem',
    event_id: '1',
    name: 'PREMIUM',
    price: 75000,
    quantity_total: 20,
    quantity_sold: 18,
    description: 'Table réservée front row & Champagne',
    benefits: ['Table réservée', 'Champagne illimité', 'Meet & Greet', 'Parking VIP sécurisé'],
    available_quantity: 2,
    is_sold_out: false,
    is_low_stock: true,
  },
] as const;

export const MOCK_EVENT_DETAILS: readonly MockEventDetail[] = [
  {
    id: '1',
    title: MOCK_EVENTS[0]?.title || 'Soirée Afrobeats & Makossa Yaoundé',
    description: 'Le plus grand rassemblement musical de Yaoundé ! Au Palais des Sports, venez vibrer aux rythmes des meilleurs artistes camerounais et africains. DJ sets internationaux, performances live et ambiance électrique.',
    category: MOCK_EVENTS[0]?.category || 'concerts',
    event_type: MOCK_EVENTS[0]?.category || 'concerts',
    cover_image: MOCK_EVENTS[0]?.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=65',
    images: [
      MOCK_EVENTS[0]?.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=65',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=65',
      'https://images.unsplash.com/photo-1506157784157-b1f8f8424e71?w=400&auto=format&fit=crop&q=65'
    ],
    start_date: '2026-09-12T20:00:00Z',
    end_date: '2026-09-13T04:00:00Z',
    address: MOCK_EVENTS[0]?.location || 'Palais des Sports Warda, Yaoundé',
    city: 'Yaoundé',
    status: 'published',
    is_featured: true,
    organizer: MOCK_ORGANIZERS[0],
    venue: MOCK_VENUE_SUMMARIES[0],
    ticket_tiers: tiersDefault,
    total_available: 397,
    is_sold_out: false,
  }
] as const;

export function getMockEventDetailById(id: string): MockEventDetail | null {
  const detail = MOCK_EVENT_DETAILS.find((e) => e.id === id);
  return detail ?? null;
}

export function buildMockEventDetailFromList(id: string): MockEventDetail | null {
  const event = MOCK_EVENTS.find((e) => e.id === id);
  if (!event) return null;

  const idNum = parseInt(event.id, 10) || 1;
  const organizer = MOCK_ORGANIZERS[idNum % MOCK_ORGANIZERS.length];
  const venue = MOCK_VENUE_SUMMARIES[idNum % MOCK_VENUE_SUMMARIES.length];
  const dayStr = String((idNum % 28) + 1).padStart(2, '0');
  const endDayStr = String((idNum % 28) + 2).padStart(2, '0');

  const defaultTiers: readonly MockTicketTier[] = [
    {
      id: `tier-${event.id}-std`,
      event_id: event.id,
      name: 'Standard',
      price: event.price,
      quantity_total: 300,
      quantity_sold: 110,
      description: "Accès général à l'événement",
      benefits: ['Entrée générale', 'Boisson offerte'],
      available_quantity: 190,
      is_sold_out: false,
      is_low_stock: false,
    },
    {
      id: `tier-${event.id}-vip`,
      event_id: event.id,
      name: 'VIP',
      price: event.price * 3,
      quantity_total: 80,
      quantity_sold: 60,
      description: 'Accès VIP privilégié',
      benefits: ['Accès espace assis VIP', 'Service bar dédié'],
      available_quantity: 20,
      is_sold_out: false,
      is_low_stock: false,
    },
    {
      id: `tier-${event.id}-prem`,
      event_id: event.id,
      name: 'PREMIUM',
      price: event.price * 8,
      quantity_total: 15,
      quantity_sold: 12,
      description: 'Table prestige réservée',
      benefits: ['Table réservée', 'Champagne', 'Parking VIP'],
      available_quantity: 3,
      is_sold_out: false,
      is_low_stock: true,
    },
  ] as const;

  return {
    id: event.id,
    title: event.title,
    description: `Découvrez l'événement ${event.title} organisé par ${event.organizerName} à ${event.location}. Une expérience culturelle et festive incontournable au Cameroun.`,
    category: event.category,
    event_type: event.category,
    cover_image: event.image,
    images: [event.image],
    start_date: `2026-09-${dayStr}T20:00:00Z`,
    end_date: `2026-09-${endDayStr}T04:00:00Z`,
    address: event.location,
    city: event.location.includes('Yaoundé') ? 'Yaoundé' : event.location.includes('Douala') ? 'Douala' : 'Kribi',
    status: 'published',
    is_featured: event.isFeatured,
    organizer,
    venue,
    ticket_tiers: defaultTiers,
    total_available: 213,
    is_sold_out: false,
  };
}

export function getMockEventDetailWithFallback(id: string): MockEventDetail | null {
  return getMockEventDetailById(id) ?? buildMockEventDetailFromList(id);
}
