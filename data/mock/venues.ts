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
    "name": "Lieu d'Exception Sports Bafoussam #13",
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
    "name": "Lieu d'Exception Spectacle Garoua #14",
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
    "name": "Lieu d'Exception Lounge Bamenda #15",
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
    "name": "Lieu d'Exception Reception Yaoundé #16",
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
    "name": "Lieu d'Exception Conference Douala #17",
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
    "name": "Lieu d'Exception Sports Kribi #18",
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
    "name": "Lieu d'Exception Spectacle Limbé #19",
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
    "name": "Lieu d'Exception Lounge Buea #20",
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
    "name": "Lieu d'Exception Reception Bafoussam #21",
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
    "name": "Lieu d'Exception Conference Garoua #22",
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
    "name": "Lieu d'Exception Sports Bamenda #23",
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
    "name": "Lieu d'Exception Spectacle Yaoundé #24",
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
    "name": "Lieu d'Exception Lounge Douala #25",
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
    "name": "Lieu d'Exception Reception Kribi #26",
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
    "name": "Lieu d'Exception Conference Limbé #27",
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
    "name": "Lieu d'Exception Sports Buea #28",
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
    "name": "Lieu d'Exception Spectacle Bafoussam #29",
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
    "name": "Lieu d'Exception Lounge Garoua #30",
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
    "name": "Lieu d'Exception Reception Bamenda #31",
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
    "name": "Lieu d'Exception Conference Yaoundé #32",
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
    "name": "Lieu d'Exception Sports Douala #33",
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
    "name": "Lieu d'Exception Spectacle Kribi #34",
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
    "name": "Lieu d'Exception Lounge Limbé #35",
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
    "name": "Lieu d'Exception Reception Buea #36",
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
    "name": "Lieu d'Exception Conference Bafoussam #37",
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
    "name": "Lieu d'Exception Sports Garoua #38",
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
    "name": "Lieu d'Exception Spectacle Bamenda #39",
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
    "name": "Lieu d'Exception Lounge Yaoundé #40",
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
    "name": "Lieu d'Exception Reception Douala #41",
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
    "name": "Lieu d'Exception Conference Kribi #42",
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
    "name": "Lieu d'Exception Sports Limbé #43",
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
    "name": "Lieu d'Exception Spectacle Buea #44",
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
    "name": "Lieu d'Exception Lounge Bafoussam #45",
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
    "name": "Lieu d'Exception Reception Garoua #46",
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
    "name": "Lieu d'Exception Conference Bamenda #47",
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
    "name": "Lieu d'Exception Sports Yaoundé #48",
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
    "name": "Lieu d'Exception Spectacle Douala #49",
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
    "name": "Lieu d'Exception Lounge Kribi #50",
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
    "name": "Lieu d'Exception Reception Limbé #51",
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
    "name": "Lieu d'Exception Conference Buea #52",
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
    "name": "Lieu d'Exception Sports Bafoussam #53",
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
    "name": "Lieu d'Exception Spectacle Garoua #54",
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
    "name": "Lieu d'Exception Lounge Bamenda #55",
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
    "name": "Lieu d'Exception Reception Yaoundé #56",
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
    "name": "Lieu d'Exception Conference Douala #57",
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
    "name": "Lieu d'Exception Sports Kribi #58",
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
    "name": "Lieu d'Exception Spectacle Limbé #59",
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
    "name": "Lieu d'Exception Lounge Buea #60",
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
    "name": "Lieu d'Exception Reception Bafoussam #61",
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
    "name": "Lieu d'Exception Conference Garoua #62",
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
    "name": "Lieu d'Exception Sports Bamenda #63",
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
    "name": "Lieu d'Exception Spectacle Yaoundé #64",
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
    "name": "Lieu d'Exception Lounge Douala #65",
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
    "name": "Lieu d'Exception Reception Kribi #66",
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
    "name": "Lieu d'Exception Conference Limbé #67",
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
    "name": "Lieu d'Exception Sports Buea #68",
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
    "name": "Lieu d'Exception Spectacle Bafoussam #69",
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
    "name": "Lieu d'Exception Lounge Garoua #70",
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
    "name": "Lieu d'Exception Reception Bamenda #71",
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
    "name": "Lieu d'Exception Conference Yaoundé #72",
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
    "name": "Lieu d'Exception Sports Douala #73",
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
    "name": "Lieu d'Exception Spectacle Kribi #74",
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
    "name": "Lieu d'Exception Lounge Limbé #75",
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
    "name": "Lieu d'Exception Reception Buea #76",
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
    "name": "Lieu d'Exception Conference Bafoussam #77",
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
    "name": "Lieu d'Exception Sports Garoua #78",
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
    "name": "Lieu d'Exception Spectacle Bamenda #79",
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
    "name": "Lieu d'Exception Lounge Yaoundé #80",
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
    "name": "Lieu d'Exception Reception Douala #81",
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
    "name": "Lieu d'Exception Conference Kribi #82",
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
    "name": "Lieu d'Exception Sports Limbé #83",
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
    "name": "Lieu d'Exception Spectacle Buea #84",
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
    "name": "Lieu d'Exception Lounge Bafoussam #85",
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
    "name": "Lieu d'Exception Reception Garoua #86",
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
    "name": "Lieu d'Exception Conference Bamenda #87",
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
    "name": "Lieu d'Exception Sports Yaoundé #88",
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
    "name": "Lieu d'Exception Spectacle Douala #89",
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
    "name": "Lieu d'Exception Lounge Kribi #90",
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
    "name": "Lieu d'Exception Reception Limbé #91",
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
    "name": "Lieu d'Exception Conference Buea #92",
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
    "name": "Lieu d'Exception Sports Bafoussam #93",
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
    "name": "Lieu d'Exception Spectacle Garoua #94",
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
    "name": "Lieu d'Exception Lounge Bamenda #95",
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
    "name": "Lieu d'Exception Reception Yaoundé #96",
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
    "name": "Lieu d'Exception Conference Douala #97",
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
    "name": "Lieu d'Exception Sports Kribi #98",
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
    "name": "Lieu d'Exception Spectacle Limbé #99",
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
    "name": "Lieu d'Exception Lounge Buea #100",
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
    "name": "Lieu d'Exception Reception Bafoussam #101",
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
    "name": "Lieu d'Exception Conference Garoua #102",
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
    "name": "Lieu d'Exception Sports Bamenda #103",
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
    "name": "Lieu d'Exception Spectacle Yaoundé #104",
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
    "name": "Lieu d'Exception Lounge Douala #105",
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
    "name": "Lieu d'Exception Reception Kribi #106",
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
    "name": "Lieu d'Exception Conference Limbé #107",
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
    "name": "Lieu d'Exception Sports Buea #108",
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
    "name": "Lieu d'Exception Spectacle Bafoussam #109",
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
    "name": "Lieu d'Exception Lounge Garoua #110",
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
    "name": "Lieu d'Exception Reception Bamenda #111",
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
    "name": "Lieu d'Exception Conference Yaoundé #112",
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
    "name": "Lieu d'Exception Sports Douala #113",
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
    "name": "Lieu d'Exception Spectacle Kribi #114",
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
    "name": "Lieu d'Exception Lounge Limbé #115",
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
    "name": "Lieu d'Exception Reception Buea #116",
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
    "name": "Lieu d'Exception Conference Bafoussam #117",
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
    "name": "Lieu d'Exception Sports Garoua #118",
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
    "name": "Lieu d'Exception Spectacle Bamenda #119",
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
    "name": "Lieu d'Exception Lounge Yaoundé #120",
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
