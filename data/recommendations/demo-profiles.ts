/**
 * Profils de démonstration et métadonnées de présentation.
 *
 * Les données factuelles (ville, budget, catégories, seeds) proviennent de
 * `profiles.v1.json`, généré par le pipeline Python : une seule source de
 * vérité évite les divergences entre le benchmark et le runtime.
 *
 * Ce fichier ajoute uniquement des éléments de présentation (accroche,
 * couleur d'accent) propres à l'interface.
 */

import type { DemoProfileView, ProfilesArtifact } from '@/types/recommendations';

import profilesArtifactJson from './generated/profiles.v1.json';

export const DEMO_PROFILES_ARTIFACT = profilesArtifactJson as unknown as ProfilesArtifact;

interface ProfilePresentation {
  readonly tagline: string;
  readonly accentColor: string;
}

const PRESENTATION: Readonly<Record<string, ProfilePresentation>> = {
  music_fan_douala: {
    tagline: 'Sorties afrobeat, makossa et festivals à Douala',
    accentColor: '#D8B45A',
  },
  tech_enthusiast_yaounde: {
    tagline: 'IA, hackathons et meetups tech à Yaoundé',
    accentColor: '#7FA7CE',
  },
  culture_lover_douala: {
    tagline: 'Théâtre, expositions et patrimoine camerounais',
    accentColor: '#C9603F',
  },
  student_buea: {
    tagline: 'Étudiant anglophone à petit budget',
    accentColor: '#4C9A6E',
  },
  family_bafoussam: {
    tagline: 'Sorties culturelles et familiales dans l’Ouest',
    accentColor: '#E8B64C',
  },
  entrepreneur_douala: {
    tagline: 'Financement, réseau et formations business',
    accentColor: '#F2DC9B',
  },
  sport_fan_yaounde: {
    tagline: 'Football, course et compétitions régionales',
    accentColor: '#5BC48B',
  },
  english_arts_limbe: {
    tagline: 'Photo, festivals et plein air à Limbe',
    accentColor: '#C7A05A',
  },
  gala_professional_yaounde: {
    tagline: 'Galas, concerts premium et conférences',
    accentColor: '#D97A55',
  },
  weekend_kribi: {
    tagline: 'Week-ends plage, musique et bien-être à Kribi',
    accentColor: '#7FA7CE',
  },
};

export const DEMO_PROFILES: readonly DemoProfileView[] =
  DEMO_PROFILES_ARTIFACT.profiles.map((profile) => {
    const presentation = PRESENTATION[profile.profileId];
    return {
      ...profile,
      tagline: presentation?.tagline ?? 'Profil de démonstration',
      accentColor: presentation?.accentColor ?? '#D8B45A',
    };
  });

export function findProfileView(profileId: string): DemoProfileView | undefined {
  return DEMO_PROFILES.find((profile) => profile.profileId === profileId);
}
