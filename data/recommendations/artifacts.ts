/**
 * Chargement statique des artefacts générés par le pipeline Python.
 *
 * Les JSON sont importés directement : Expo les embarque dans le bundle, ce
 * qui évite tout appel réseau au chargement de la démonstration. Aucun secret
 * ni service distant n'est requis.
 */

import type {
  BenchmarkArtifact,
  EmbeddingsArtifact,
  EventsArtifact,
  ProfilesArtifact,
} from '@/types/recommendations';

import benchmarkJson from './generated/benchmark.v1.json';
import embeddingsJson from './generated/embeddings.v1.json';
import eventsJson from './generated/events.v1.json';
import profilesJson from './generated/profiles.v1.json';

export const EVENTS_ARTIFACT = eventsJson as unknown as EventsArtifact;
export const EMBEDDINGS_ARTIFACT = embeddingsJson as unknown as EmbeddingsArtifact;
export const PROFILES_ARTIFACT = profilesJson as unknown as ProfilesArtifact;
export const BENCHMARK_ARTIFACT = benchmarkJson as unknown as BenchmarkArtifact;
