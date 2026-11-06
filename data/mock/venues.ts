/**
 * Lieux mock pour le développement (120 lieux d'Afrique/Cameroun).
 *
 * Photos HD Unsplash & adresses réelles camerounaises.
 */

import type { MockVenue, MockVenueDetail, MockOrganizer, MockVenuePromotion, MockCategory } from './types';

const MOCK_VENUE_OWNERS: readonly MockOrganizer[] = [
  {
    id: 'owner-1',
    full_name: 'Jean-Pierre Fotso',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    phone: '+237 6 99 12 34 56',
  },
  {
    id: 'owner-2',
    full_name: 'Marie-Claire Nkoulou',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    phone: '+237 6 77 88 99 00',
  },
] as const;

export const VENUE_CATEGORIES: readonly MockCategory[] = [
  { id: 'all', label: 'Tous' },
  { id: 'lounge', label: 'Lounges' },
  { id: 'reception', label: 'Réceptions' },
  { id: 'conference', label: 'Conférences' },
  { id: 'sports', label: 'Stades' },
  { id: 'spectacle', label: 'Spectacles' },
] as const;

export const MOCK_VENUES: readonly MockVenue[] = [
  {
    "id": "1",
    "name": "The Golden Lounge Bastos",
    "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&auto=format&fit=crop&q=65",
    "location": "Bastos, Yaoundé",
    "rating": 4.3,
    "badge": "Premium",
    "category": "lounge",
    "capacity_max": 350,
    "price_per_day": 75000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "2",
    "name": "Suna 'a Home Bonapriso",
    "image": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&auto=format&fit=crop&q=65",
    "location": "Bonapriso, Douala",
    "rating": 4.4,
    "badge": "Recommandé",
    "category": "reception",
    "capacity_max": 250,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "3",
    "name": "Espace Mont Fébé VIP",
    "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop&q=65",
    "location": "Mont Fébé, Yaoundé",
    "rating": 4.5,
    "badge": null,
    "category": "reception",
    "capacity_max": 500,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "4",
    "name": "Stade Japoma Arena",
    "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&auto=format&fit=crop&q=65",
    "location": "Japoma, Douala",
    "rating": 4.6,
    "badge": "Or Savane",
    "category": "sports",
    "capacity_max": 50000,
    "price_per_day": 350000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "5",
    "name": "Silicon Mountain Hub",
    "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&auto=format&fit=crop&q=65",
    "location": "Buea, Sud-Ouest",
    "rating": 4.7,
    "badge": "Premium",
    "category": "conference",
    "capacity_max": 200,
    "price_per_day": 45000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "6",
    "name": "Kribi Ocean Beach Resort",
    "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&auto=format&fit=crop&q=65",
    "location": "Plage de Kribi, Kribi",
    "rating": 4.8,
    "badge": "Recommandé",
    "category": "reception",
    "capacity_max": 400,
    "price_per_day": 150000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "7",
    "name": "Hilton Yaoundé Grand Ballroom",
    "image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&auto=format&fit=crop&q=65",
    "location": "Centre Ville, Yaoundé",
    "rating": 4.9,
    "badge": null,
    "category": "reception",
    "capacity_max": 600,
    "price_per_day": 200000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "8",
    "name": "Hôtel Star Land Bonapriso",
    "image": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=65",
    "location": "Bonapriso, Douala",
    "rating": 4.2,
    "badge": "Or Savane",
    "category": "lounge",
    "capacity_max": 300,
    "price_per_day": 90000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "9",
    "name": "Complexe d'Olembé Spectacles",
    "image": "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&auto=format&fit=crop&q=65",
    "location": "Olembé, Yaoundé",
    "rating": 4.3,
    "badge": "Premium",
    "category": "spectacle",
    "capacity_max": 15000,
    "price_per_day": 250000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "10",
    "name": "Limbé Atlantic Seaside Club",
    "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=65",
    "location": "Coastline, Limbé",
    "rating": 4.4,
    "badge": "Recommandé",
    "category": "lounge",
    "capacity_max": 250,
    "price_per_day": 65000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "11",
    "name": "Bafoussam Royal Hall",
    "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&auto=format&fit=crop&q=65",
    "location": "Centre Ville, Bafoussam",
    "rating": 4.5,
    "badge": null,
    "category": "reception",
    "capacity_max": 450,
    "price_per_day": 80000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "12",
    "name": "Akwa Palace Sky Bar",
    "image": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&auto=format&fit=crop&q=65",
    "location": "Akwa, Douala",
    "rating": 4.6,
    "badge": "Or Savane",
    "category": "lounge",
    "capacity_max": 180,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "13",
    "name": "Prestige Hall Yaoundé",
    "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bafoussam",
    "rating": 4.7,
    "badge": "Premium",
    "category": "sports",
    "capacity_max": 150,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "14",
    "name": "Grand Amphithéâtre Douala",
    "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Garoua",
    "rating": 4.8,
    "badge": "Recommandé",
    "category": "spectacle",
    "capacity_max": 150,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "15",
    "name": "Salle des Congrès Buea",
    "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bamenda",
    "rating": 4.9,
    "badge": null,
    "category": "lounge",
    "capacity_max": 1000,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "16",
    "name": "Palais des Princes Bafoussam",
    "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Yaoundé",
    "rating": 4.2,
    "badge": "Or Savane",
    "category": "reception",
    "capacity_max": 150,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "17",
    "name": "Villa Royale Garoua",
    "image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Douala",
    "rating": 4.3,
    "badge": "Premium",
    "category": "conference",
    "capacity_max": 150,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "18",
    "name": "Club Premium Limbé",
    "image": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Kribi",
    "rating": 4.4,
    "badge": "Recommandé",
    "category": "sports",
    "capacity_max": 2500,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "19",
    "name": "Arena Kribi Beach",
    "image": "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Limbé",
    "rating": 4.5,
    "badge": null,
    "category": "spectacle",
    "capacity_max": 1000,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "20",
    "name": "Salle de Gala Bamenda",
    "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Buea",
    "rating": 4.6,
    "badge": "Or Savane",
    "category": "lounge",
    "capacity_max": 400,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "21",
    "name": "Espace Prestige Nkongsamba",
    "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bafoussam",
    "rating": 4.7,
    "badge": "Premium",
    "category": "reception",
    "capacity_max": 1000,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "22",
    "name": "Théâtre Damas Yaoundé",
    "image": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Garoua",
    "rating": 4.8,
    "badge": "Recommandé",
    "category": "conference",
    "capacity_max": 150,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "23",
    "name": "Akonolinga Cultural Center",
    "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bamenda",
    "rating": 4.9,
    "badge": null,
    "category": "sports",
    "capacity_max": 600,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "24",
    "name": "Ebolowa Grand Hall",
    "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Yaoundé",
    "rating": 4.2,
    "badge": "Or Savane",
    "category": "spectacle",
    "capacity_max": 1000,
    "price_per_day": 40000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "25",
    "name": "Bertoua Convention Center",
    "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Douala",
    "rating": 4.3,
    "badge": "Premium",
    "category": "lounge",
    "capacity_max": 150,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "26",
    "name": "Maroua Prestige Arena",
    "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Kribi",
    "rating": 4.4,
    "badge": "Recommandé",
    "category": "reception",
    "capacity_max": 400,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "27",
    "name": "Foumban Royal Ballroom",
    "image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Limbé",
    "rating": 4.5,
    "badge": null,
    "category": "conference",
    "capacity_max": 400,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "28",
    "name": "Dschang Summit Hall",
    "image": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Buea",
    "rating": 4.6,
    "badge": "Or Savane",
    "category": "sports",
    "capacity_max": 400,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "29",
    "name": "Kumba Beachfront Resort",
    "image": "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bafoussam",
    "rating": 4.7,
    "badge": "Premium",
    "category": "spectacle",
    "capacity_max": 250,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "30",
    "name": "Tiko Harbor Club",
    "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Garoua",
    "rating": 4.8,
    "badge": "Recommandé",
    "category": "lounge",
    "capacity_max": 2500,
    "price_per_day": 40000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "31",
    "name": "Edea Riverside Venue",
    "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bamenda",
    "rating": 4.9,
    "badge": null,
    "category": "reception",
    "capacity_max": 250,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "32",
    "name": "Batouri Event Center",
    "image": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Yaoundé",
    "rating": 4.2,
    "badge": "Or Savane",
    "category": "conference",
    "capacity_max": 2500,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "33",
    "name": "Yokadouma Paradise Lodge",
    "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Douala",
    "rating": 4.3,
    "badge": "Premium",
    "category": "sports",
    "capacity_max": 2500,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "34",
    "name": "Loum Convention Hall",
    "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Kribi",
    "rating": 4.4,
    "badge": "Recommandé",
    "category": "spectacle",
    "capacity_max": 250,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "35",
    "name": "Dibamba Entertainment Hub",
    "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Limbé",
    "rating": 4.5,
    "badge": null,
    "category": "lounge",
    "capacity_max": 250,
    "price_per_day": 40000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "36",
    "name": "Mbalmayo Plaza",
    "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Buea",
    "rating": 4.6,
    "badge": "Or Savane",
    "category": "reception",
    "capacity_max": 1000,
    "price_per_day": 40000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "37",
    "name": "Akono Cultural Garden",
    "image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bafoussam",
    "rating": 4.7,
    "badge": "Premium",
    "category": "conference",
    "capacity_max": 250,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "38",
    "name": "Sangmelima Business Center",
    "image": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Garoua",
    "rating": 4.8,
    "badge": "Recommandé",
    "category": "sports",
    "capacity_max": 2500,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "39",
    "name": "Lomié Eco Resort",
    "image": "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bamenda",
    "rating": 4.9,
    "badge": null,
    "category": "spectacle",
    "capacity_max": 400,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "40",
    "name": "Abong-Mbang Heritage Hall",
    "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Yaoundé",
    "rating": 4.2,
    "badge": "Or Savane",
    "category": "lounge",
    "capacity_max": 2500,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "41",
    "name": "Batouri Convention",
    "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Douala",
    "rating": 4.3,
    "badge": "Premium",
    "category": "reception",
    "capacity_max": 150,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "42",
    "name": "Kékem Plaza Events",
    "image": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Kribi",
    "rating": 4.4,
    "badge": "Recommandé",
    "category": "conference",
    "capacity_max": 1000,
    "price_per_day": 40000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "43",
    "name": "Penja Coffee Hall",
    "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Limbé",
    "rating": 4.5,
    "badge": null,
    "category": "sports",
    "capacity_max": 250,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "44",
    "name": "Muyuka Summit Center",
    "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Buea",
    "rating": 4.6,
    "badge": "Or Savane",
    "category": "spectacle",
    "capacity_max": 150,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "45",
    "name": "Idenau Beach Pavilion",
    "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bafoussam",
    "rating": 4.7,
    "badge": "Premium",
    "category": "lounge",
    "capacity_max": 250,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "46",
    "name": "Mamfe Riverfront Venue",
    "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Garoua",
    "rating": 4.8,
    "badge": "Recommandé",
    "category": "reception",
    "capacity_max": 250,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "47",
    "name": "Kumbo Royal Resort",
    "image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bamenda",
    "rating": 4.9,
    "badge": null,
    "category": "conference",
    "capacity_max": 600,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "48",
    "name": "Menchum Valley Hall",
    "image": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Yaoundé",
    "rating": 4.2,
    "badge": "Or Savane",
    "category": "sports",
    "capacity_max": 2500,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "49",
    "name": "Wum Community Center",
    "image": "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Douala",
    "rating": 4.3,
    "badge": "Premium",
    "category": "spectacle",
    "capacity_max": 150,
    "price_per_day": 40000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "50",
    "name": "Nso Palace Events",
    "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Kribi",
    "rating": 4.4,
    "badge": "Recommandé",
    "category": "lounge",
    "capacity_max": 2500,
    "price_per_day": 40000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "51",
    "name": "Bambui Grand Hall",
    "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Limbé",
    "rating": 4.5,
    "badge": null,
    "category": "reception",
    "capacity_max": 1000,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "52",
    "name": "Elak Prestige Lounge",
    "image": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Buea",
    "rating": 4.6,
    "badge": "Or Savane",
    "category": "conference",
    "capacity_max": 600,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "53",
    "name": "Njinikom Eco Venue",
    "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bafoussam",
    "rating": 4.7,
    "badge": "Premium",
    "category": "sports",
    "capacity_max": 250,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "54",
    "name": "Kom Cultural Space",
    "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Garoua",
    "rating": 4.8,
    "badge": "Recommandé",
    "category": "spectacle",
    "capacity_max": 150,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "55",
    "name": "Mbot Heritage Center",
    "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bamenda",
    "rating": 4.9,
    "badge": null,
    "category": "lounge",
    "capacity_max": 1000,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "56",
    "name": "Bangwa Royal Hall",
    "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Yaoundé",
    "rating": 4.2,
    "badge": "Or Savane",
    "category": "reception",
    "capacity_max": 250,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "57",
    "name": "Mankon Business Hub",
    "image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Douala",
    "rating": 4.3,
    "badge": "Premium",
    "category": "conference",
    "capacity_max": 250,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "58",
    "name": "Tubah Grand Arena",
    "image": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Kribi",
    "rating": 4.4,
    "badge": "Recommandé",
    "category": "sports",
    "capacity_max": 150,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "59",
    "name": "Bafut Castle Events",
    "image": "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Limbé",
    "rating": 4.5,
    "badge": null,
    "category": "spectacle",
    "capacity_max": 1000,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "60",
    "name": "Belo Heritage Lounge",
    "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Buea",
    "rating": 4.6,
    "badge": "Or Savane",
    "category": "lounge",
    "capacity_max": 1000,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "61",
    "name": "Foung'a Event Center",
    "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bafoussam",
    "rating": 4.7,
    "badge": "Premium",
    "category": "reception",
    "capacity_max": 2500,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "62",
    "name": "Oku Summit Hall",
    "image": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Garoua",
    "rating": 4.8,
    "badge": "Recommandé",
    "category": "conference",
    "capacity_max": 150,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "63",
    "name": "Buruntum Prestige Venue",
    "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bamenda",
    "rating": 4.9,
    "badge": null,
    "category": "sports",
    "capacity_max": 2500,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "64",
    "name": "Kom-Muanenguba Resort",
    "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Yaoundé",
    "rating": 4.2,
    "badge": "Or Savane",
    "category": "spectacle",
    "capacity_max": 250,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "65",
    "name": "Manenguba Lakes Hall",
    "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Douala",
    "rating": 4.3,
    "badge": "Premium",
    "category": "lounge",
    "capacity_max": 2500,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "66",
    "name": "Balihaghwé Convention",
    "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Kribi",
    "rating": 4.4,
    "badge": "Recommandé",
    "category": "reception",
    "capacity_max": 2500,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "67",
    "name": "Balimbirira Heritage Hall",
    "image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Limbé",
    "rating": 4.5,
    "badge": null,
    "category": "conference",
    "capacity_max": 600,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "68",
    "name": "Balissofin Events",
    "image": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Buea",
    "rating": 4.6,
    "badge": "Or Savane",
    "category": "sports",
    "capacity_max": 150,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "69",
    "name": "Bamendjim Summit Center",
    "image": "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bafoussam",
    "rating": 4.7,
    "badge": "Premium",
    "category": "spectacle",
    "capacity_max": 400,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "70",
    "name": "Bamenda Grand Ballroom",
    "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Garoua",
    "rating": 4.8,
    "badge": "Recommandé",
    "category": "lounge",
    "capacity_max": 1000,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "71",
    "name": "Bamessieuk Hall",
    "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bamenda",
    "rating": 4.9,
    "badge": null,
    "category": "reception",
    "capacity_max": 400,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "72",
    "name": "Bamessing Prestige",
    "image": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Yaoundé",
    "rating": 4.2,
    "badge": "Or Savane",
    "category": "conference",
    "capacity_max": 600,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "73",
    "name": "Bameta Event Lounge",
    "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Douala",
    "rating": 4.3,
    "badge": "Premium",
    "category": "sports",
    "capacity_max": 2500,
    "price_per_day": 40000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "74",
    "name": "Bamilike Heritage Center",
    "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Kribi",
    "rating": 4.4,
    "badge": "Recommandé",
    "category": "spectacle",
    "capacity_max": 2500,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "75",
    "name": "Banso Royal Palace",
    "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Limbé",
    "rating": 4.5,
    "badge": null,
    "category": "lounge",
    "capacity_max": 400,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "76",
    "name": "Bansoa Grand Hall",
    "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Buea",
    "rating": 4.6,
    "badge": "Or Savane",
    "category": "reception",
    "capacity_max": 600,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "77",
    "name": "Banten Cultural Hub",
    "image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bafoussam",
    "rating": 4.7,
    "badge": "Premium",
    "category": "conference",
    "capacity_max": 2500,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "78",
    "name": "Bantoum Event Center",
    "image": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Garoua",
    "rating": 4.8,
    "badge": "Recommandé",
    "category": "sports",
    "capacity_max": 250,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "79",
    "name": "Banyangfanglak Summit",
    "image": "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bamenda",
    "rating": 4.9,
    "badge": null,
    "category": "spectacle",
    "capacity_max": 600,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "80",
    "name": "Banyou Heritage Lounge",
    "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Yaoundé",
    "rating": 4.2,
    "badge": "Or Savane",
    "category": "lounge",
    "capacity_max": 150,
    "price_per_day": 40000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "81",
    "name": "Bapel Grand Arena",
    "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Douala",
    "rating": 4.3,
    "badge": "Premium",
    "category": "reception",
    "capacity_max": 400,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "82",
    "name": "Bapenda Palace Events",
    "image": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Kribi",
    "rating": 4.4,
    "badge": "Recommandé",
    "category": "conference",
    "capacity_max": 2500,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "83",
    "name": "Baptjoa Hall",
    "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Limbé",
    "rating": 4.5,
    "badge": null,
    "category": "sports",
    "capacity_max": 600,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "84",
    "name": "Babanki Summit Center",
    "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Buea",
    "rating": 4.6,
    "badge": "Or Savane",
    "category": "spectacle",
    "capacity_max": 400,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "85",
    "name": "Babet Heritage Venue",
    "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bafoussam",
    "rating": 4.7,
    "badge": "Premium",
    "category": "lounge",
    "capacity_max": 400,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "86",
    "name": "Babimbi Event Space",
    "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Garoua",
    "rating": 4.8,
    "badge": "Recommandé",
    "category": "reception",
    "capacity_max": 150,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "87",
    "name": "Babissi Grand Hall",
    "image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bamenda",
    "rating": 4.9,
    "badge": null,
    "category": "conference",
    "capacity_max": 400,
    "price_per_day": 40000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "88",
    "name": "Bacham Prestige Lounge",
    "image": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Yaoundé",
    "rating": 4.2,
    "badge": "Or Savane",
    "category": "sports",
    "capacity_max": 400,
    "price_per_day": 40000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "89",
    "name": "Bachuo Community Center",
    "image": "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Douala",
    "rating": 4.3,
    "badge": "Premium",
    "category": "spectacle",
    "capacity_max": 600,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "90",
    "name": "Badmen Heritage Hall",
    "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Kribi",
    "rating": 4.4,
    "badge": "Recommandé",
    "category": "lounge",
    "capacity_max": 1000,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "91",
    "name": "Bafia Festival Hall",
    "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Limbé",
    "rating": 4.5,
    "badge": null,
    "category": "reception",
    "capacity_max": 600,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "92",
    "name": "Bafmen Prestige Venue",
    "image": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Buea",
    "rating": 4.6,
    "badge": "Or Savane",
    "category": "conference",
    "capacity_max": 600,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "93",
    "name": "Bafum Royal Hall",
    "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bafoussam",
    "rating": 4.7,
    "badge": "Premium",
    "category": "sports",
    "capacity_max": 600,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "94",
    "name": "Bagassao Cultural Center",
    "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Garoua",
    "rating": 4.8,
    "badge": "Recommandé",
    "category": "spectacle",
    "capacity_max": 400,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "95",
    "name": "Bagente Event Hub",
    "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bamenda",
    "rating": 4.9,
    "badge": null,
    "category": "lounge",
    "capacity_max": 1000,
    "price_per_day": 40000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "96",
    "name": "Baham Grand Ballroom",
    "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Yaoundé",
    "rating": 4.2,
    "badge": "Or Savane",
    "category": "reception",
    "capacity_max": 250,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "97",
    "name": "Bahias Heritage Venue",
    "image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Douala",
    "rating": 4.3,
    "badge": "Premium",
    "category": "conference",
    "capacity_max": 400,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "98",
    "name": "Baibara Festival Center",
    "image": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Kribi",
    "rating": 4.4,
    "badge": "Recommandé",
    "category": "sports",
    "capacity_max": 250,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "99",
    "name": "Bajag Premium Lounge",
    "image": "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Limbé",
    "rating": 4.5,
    "badge": null,
    "category": "spectacle",
    "capacity_max": 1000,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "100",
    "name": "Bajenja Event Space",
    "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Buea",
    "rating": 4.6,
    "badge": "Or Savane",
    "category": "lounge",
    "capacity_max": 250,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "101",
    "name": "Bakari Grand Hall",
    "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bafoussam",
    "rating": 4.7,
    "badge": "Premium",
    "category": "reception",
    "capacity_max": 400,
    "price_per_day": 40000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "102",
    "name": "Bakassa Prestige Center",
    "image": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Garoua",
    "rating": 4.8,
    "badge": "Recommandé",
    "category": "conference",
    "capacity_max": 1000,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "103",
    "name": "Bakebali Festival Venue",
    "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bamenda",
    "rating": 4.9,
    "badge": null,
    "category": "sports",
    "capacity_max": 150,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "104",
    "name": "Bakemen Heritage Hall",
    "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Yaoundé",
    "rating": 4.2,
    "badge": "Or Savane",
    "category": "spectacle",
    "capacity_max": 600,
    "price_per_day": 40000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "105",
    "name": "Bakhuen Grand Arena",
    "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Douala",
    "rating": 4.3,
    "badge": "Premium",
    "category": "lounge",
    "capacity_max": 1000,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "106",
    "name": "Bakoke Event Lounge",
    "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Kribi",
    "rating": 4.4,
    "badge": "Recommandé",
    "category": "reception",
    "capacity_max": 1000,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "107",
    "name": "Bakouma Convention",
    "image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Limbé",
    "rating": 4.5,
    "badge": null,
    "category": "conference",
    "capacity_max": 150,
    "price_per_day": 40000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "108",
    "name": "Bakouissa Heritage Center",
    "image": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Buea",
    "rating": 4.6,
    "badge": "Or Savane",
    "category": "sports",
    "capacity_max": 2500,
    "price_per_day": 40000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "109",
    "name": "Bakubang Summit Hall",
    "image": "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bafoussam",
    "rating": 4.7,
    "badge": "Premium",
    "category": "spectacle",
    "capacity_max": 1000,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "110",
    "name": "Bakundu Prestige Venue",
    "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Garoua",
    "rating": 4.8,
    "badge": "Recommandé",
    "category": "lounge",
    "capacity_max": 400,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "111",
    "name": "Bakyelem Event Space",
    "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bamenda",
    "rating": 4.9,
    "badge": null,
    "category": "reception",
    "capacity_max": 150,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "112",
    "name": "Balabot Grand Hall",
    "image": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Yaoundé",
    "rating": 4.2,
    "badge": "Or Savane",
    "category": "conference",
    "capacity_max": 2500,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "113",
    "name": "Balakossa Heritage Venue",
    "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Douala",
    "rating": 4.3,
    "badge": "Premium",
    "category": "sports",
    "capacity_max": 1000,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "114",
    "name": "Balambié Festival Center",
    "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Kribi",
    "rating": 4.4,
    "badge": "Recommandé",
    "category": "spectacle",
    "capacity_max": 1000,
    "price_per_day": 180000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "115",
    "name": "Balapondo Event Hub",
    "image": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Limbé",
    "rating": 4.5,
    "badge": null,
    "category": "lounge",
    "capacity_max": 400,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "116",
    "name": "Balaré Grand Ballroom",
    "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Buea",
    "rating": 4.6,
    "badge": "Or Savane",
    "category": "reception",
    "capacity_max": 2500,
    "price_per_day": 60000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "117",
    "name": "Balauga Premium Lounge",
    "image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bafoussam",
    "rating": 4.7,
    "badge": "Premium",
    "category": "conference",
    "capacity_max": 250,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "118",
    "name": "Balau Heritage Hall",
    "image": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Garoua",
    "rating": 4.8,
    "badge": "Recommandé",
    "category": "sports",
    "capacity_max": 600,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "119",
    "name": "Balawat Prestige Center",
    "image": "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Bamenda",
    "rating": 4.9,
    "badge": null,
    "category": "spectacle",
    "capacity_max": 2500,
    "price_per_day": 120000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  },
  {
    "id": "120",
    "name": "Balayague Event Hub",
    "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=65",
    "location": "Quartier Résidentiel, Yaoundé",
    "rating": 4.2,
    "badge": "Or Savane",
    "category": "lounge",
    "capacity_max": 150,
    "price_per_day": 85000,
    "event_types": [
      "soirée",
      "gala",
      "conférence",
      "cocktail",
      "dîner"
    ]
  }
] as const;

const promotionGoldenLounge: MockVenuePromotion = {
  id: 'promo-1',
  venue_id: '1',
  tier: 'vip',
  start_date: '2026-07-01',
  end_date: '2026-09-30',
  amount_paid: 25000,
  impressions: 12500,
  clicks: 380,
  is_active: true,
};

export const MOCK_VENUE_DETAILS: readonly MockVenueDetail[] = [
  {
    id: '1',
    name: 'The Golden Lounge Bastos',
    description: 'Le lounge le plus exclusif de Bastos, Yaoundé. Ambiance raffinée, cuisine fusion africaine-européenne, bar premium avec cocktails signature.',
    address: '237 Rue Bastos, Yaoundé',
    city: 'Yaoundé',
    country: 'Cameroun',
    capacity_min: 50,
    capacity_max: 350,
    price_per_day: 75000,
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=65',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&auto=format&fit=crop&q=65',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&auto=format&fit=crop&q=65'
    ],
    amenities: ['Bar premium', 'Terrasse panoramique', 'Parking VIP', 'Vestiaire', 'Sonorisation HD', 'Scène éclairée', 'Wi-Fi haut débit'],
    event_types: ['soirée', 'gala', 'conférence', 'cocktail', 'dîner'],
    is_premium: true,
    promotion_tier: 'vip',
    lat: 3.8733,
    lng: 11.5235,
    owner: MOCK_VENUE_OWNERS[0],
    active_promotion: promotionGoldenLounge,
  }
] as const;

export function getMockVenueDetailById(id: string): MockVenueDetail | null {
  const detail = MOCK_VENUE_DETAILS.find((v) => v.id === id);
  return detail ?? null;
}

export function buildMockVenueDetailFromList(id: string): MockVenueDetail | null {
  const venue = MOCK_VENUES.find((v) => v.id === id);
  if (!venue) return null;

  return {
    id: venue.id,
    name: venue.name,
    description: "Description détaillée de l'établissement " + JSON.stringify(venue.name) + " situé à " + JSON.stringify(venue.location) + ". Idéal pour vos réceptions, soirées et événements d'exception.",
    address: venue.location,
    city: venue.location.includes('Yaoundé') ? 'Yaoundé' : venue.location.includes('Douala') ? 'Douala' : 'Kribi',
    country: 'Cameroun',
    capacity_min: 50,
    capacity_max: venue.capacity_max ?? 300,
    price_per_day: venue.price_per_day ?? 60000,
    images: [venue.image],
    amenities: ['Wi-Fi', 'Parking sécurisé', 'Sonorisation Pro', 'Climatisation', 'Service Traiteur'],
    event_types: [...venue.event_types],
    is_premium: venue.badge !== null,
    promotion_tier: venue.badge === 'Premium' ? 'premium' : venue.badge === 'Or Savane' ? 'vip' : null,
    lat: 3.8733,
    lng: 11.5235,
    owner: MOCK_VENUE_OWNERS[0],
    active_promotion: null,
  };
}

export function getMockVenueDetailWithFallback(id: string): MockVenueDetail | null {
  return getMockVenueDetailById(id) ?? buildMockVenueDetailFromList(id);
}
