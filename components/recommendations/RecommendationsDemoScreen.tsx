/**
 * Démonstration de recherche — recommandeur contextuel multilingue.
 *
 * Route publique `/recommendation-demo`, sans authentification, sans Supabase
 * et sans appel réseau : tout le classement est calculé localement à partir des
 * artefacts JSON générés par le pipeline Python.
 *
 * L'écran est explicitement identifié comme une démonstration : profils
 * fictifs, événements fixtures, interactions simulées, métriques issues d'un
 * benchmark sur un petit échantillon annoté.
 */

import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, ChevronLeft, Heart, Search, TrendingUp, Users, X } from 'lucide-react-native';

import { colors, radii, spacing, typography } from '@/lib/constants';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { EmptyState } from '@/components/ui/EmptyState';
import { DemoProfileSelector } from '@/components/recommendations/DemoProfileSelector';
import { ModelComparisonPanel } from '@/components/recommendations/ModelComparisonPanel';
import { RecommendationCard } from '@/components/recommendations/RecommendationCard';
import { BUDGET_PRESETS, useRecommendationDemo } from '@/hooks/useRecommendationDemo';
import {
  formatEventDate,
  formatXAF,
  categoryLabel,
} from '@/services/recommendations/explanations';
import type { EventCategory } from '@/types/recommendations';

const CATEGORY_ORDER: readonly EventCategory[] = [
  'music',
  'festival',
  'culture',
  'arts',
  'theatre',
  'entertainment',
  'technology',
  'entrepreneurship',
  'conference',
  'education',
  'sport',
  'gala',
];

function SectionHeading({
  index,
  title,
  description,
}: {
  readonly index: string;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionIndex}>{index}</Text>
      <View style={styles.sectionHeadingText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionDescription}>{description}</Text>
      </View>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  readonly label: string;
  readonly active: boolean;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Stat({
  value,
  label,
  icon,
}: {
  readonly value: string;
  readonly label: string;
  readonly icon?: React.ReactNode;
}) {
  return (
    <View style={styles.stat}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function NoticeCard({
  title,
  children,
}: {
  readonly title: string;
  readonly children: string;
}) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

export default function RecommendationsDemoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 860;

  const demo = useRecommendationDemo();
  const {
    profiles,
    selectedProfile,
    selectedProfileId,
    selectProfile,
    result,
    error,
    engineError,
    cities,
    cityOverride,
    setCityOverride,
    budgetOverride,
    setBudgetPreset,
    preferredCategories,
    toggleCategory,
    favoriteIds,
    dislikedIds,
    toggleFavorite,
    toggleDislike,
    resetScenario,
    benchmark,
    referenceDate,
  } = demo;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const engine = result;
  const recommendations = engine?.recommendations ?? [];

  return (
    <ScreenBackground scrimOpacity="strong">
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* -------------------------------------------------- */}
          {/* En-tête                                             */}
          {/* -------------------------------------------------- */}
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <Pressable
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Retour"
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              >
                <ChevronLeft size={20} color={colors.gold} />
              </Pressable>
              <View style={styles.researchPill}>
                <View style={styles.researchDot} />
                <Text style={styles.researchText}>DÉMONSTRATION DE RECHERCHE</Text>
              </View>
            </View>

            <Text style={styles.eyebrow}>RIVALD’EVENT × MACHINE LEARNING</Text>
            <Text style={styles.heroTitle}>Le bon événement, pour ce profil-ci.</Text>
            <Text style={styles.heroText}>
              Recommandeur content-based multilingue : embeddings E5 pré-calculés, signaux
              contextuels (catégorie, ville, budget, date) et diversification MMR. Aucun
              historique de transactions n’est utilisé.
            </Text>

            <View style={styles.heroStats}>
              <Stat
                value={String(benchmark.sampleCounts.catalogEvents)}
                label="événements au catalogue"
                icon={<CalendarDays size={14} color={colors.goldSoft} />}
              />
              <Stat
                value={String(profiles.length)}
                label="personas"
                icon={<Users size={14} color={colors.goldSoft} />}
              />
              <Stat
                value={String(benchmark.sampleCounts.judgments)}
                label="jugements de pertinence"
                icon={<TrendingUp size={14} color={colors.goldSoft} />}
              />
              <Stat
                value={`${benchmark.model.dimension}`}
                label="dimensions E5"
                icon={<Search size={14} color={colors.goldSoft} />}
              />
            </View>
          </View>

          {/* -------------------------------------------------- */}
          {/* Profil                                              */}
          {/* -------------------------------------------------- */}
          <View style={styles.section}>
            <SectionHeading
              index="01"
              title="Choisir un persona"
              description="Dix profils fictifs couvrent plusieurs villes, budgets et intentions de découverte."
            />
            <DemoProfileSelector
              profiles={profiles}
              selectedProfileId={selectedProfileId}
              onSelect={selectProfile}
            />
            {selectedProfile ? (
              <View style={styles.profileSummary}>
                <Text style={styles.profileSummaryText}>{selectedProfile.description}</Text>
                <Text style={styles.profileSummaryMeta}>
                  Ville de référence : {selectedProfile.city} · Budget :{' '}
                  {formatXAF(selectedProfile.budgetMin)} – {formatXAF(selectedProfile.budgetMax)}{' '}
                  XAF
                </Text>
              </View>
            ) : null}
          </View>

          {/* -------------------------------------------------- */}
          {/* Préférences                                         */}
          {/* -------------------------------------------------- */}
          <View style={styles.preferencesCard}>
            <View style={styles.preferencesHeader}>
              <View style={styles.preferencesHeaderText}>
                <Text style={styles.eyebrow}>CONTEXTE MODIFIABLE</Text>
                <Text style={styles.preferencesTitle}>Affiner les préférences</Text>
              </View>
              <Pressable
                onPress={resetScenario}
                accessibilityRole="button"
                style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
              >
                <Text style={styles.resetText}>Réinitialiser</Text>
              </Pressable>
            </View>

            <View style={styles.preferenceGroup}>
              <Text style={styles.preferenceLabel}>Ville</Text>
              <View style={styles.chipsWrap}>
                {cities.map((city) => {
                  const active =
                    cityOverride === city || (cityOverride === null && selectedProfile?.city === city);
                  return (
                    <Chip
                      key={city}
                      label={city}
                      active={active}
                      onPress={() => setCityOverride(city === selectedProfile?.city ? null : city)}
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.preferenceGroup}>
              <Text style={styles.preferenceLabel}>Budget indicatif</Text>
              <View style={styles.chipsWrap}>
                {BUDGET_PRESETS.map((preset) => {
                  const active =
                    budgetOverride?.min === preset.min && budgetOverride?.max === preset.max;
                  return (
                    <Chip
                      key={preset.label}
                      label={`${preset.label} XAF`}
                      active={active}
                      onPress={() => setBudgetPreset(preset)}
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.preferenceGroup}>
              <Text style={styles.preferenceLabel}>Catégories préférées</Text>
              <View style={styles.chipsWrap}>
                {CATEGORY_ORDER.map((category) => (
                  <Chip
                    key={category}
                    label={categoryLabel(category)}
                    active={preferredCategories.includes(category)}
                    onPress={() => toggleCategory(category)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.statsRow}>
              <Stat
                value={String(favoriteIds.size)}
                label="favoris simulés"
                icon={<Heart size={13} color={colors.gold} />}
              />
              <Stat
                value={String(dislikedIds.size)}
                label="désintérêts"
                icon={<X size={13} color={colors.textSecondary} />}
              />
              <Stat value={String(engine?.candidateCount ?? 0)} label="candidats classés" />
              <Stat value={String(engine?.excludedExpired ?? 0)} label="expirés exclus" />
            </View>

            {engine ? (
              <Text style={styles.contextNote}>
                Date de référence : {formatEventDate(referenceDate.toISOString())}
                {engine.profileVectorAvailable
                  ? ' · Vecteur de profil construit à partir des événements de référence et des interactions.'
                  : ' · Profil sans vecteur : classement contextuel de repli.'}
                {engine.missingEmbeddings > 0
                  ? ` · ${engine.missingEmbeddings} événement(s) sans embedding ignoré(s).`
                  : ''}
              </Text>
            ) : null}
          </View>

          {/* -------------------------------------------------- */}
          {/* Recommandations                                     */}
          {/* -------------------------------------------------- */}
          <View style={styles.section}>
            <SectionHeading
              index="02"
              title="Top 10 personnalisé"
              description="Le classement se recalcule immédiatement après chaque modification ou interaction locale."
            />

            {engineError ? (
              <NoticeCard title="Artefacts invalides">{engineError}</NoticeCard>
            ) : null}

            {!engineError && error ? (
              <NoticeCard title="Calcul impossible">{error}</NoticeCard>
            ) : null}

            {!engineError && !error && recommendations.length === 0 ? (
              <EmptyState
                icon={<X size={22} color={colors.gold} />}
                title="Aucun événement éligible"
                description="Tous les événements correspondants sont expirés, désintéressés ou absents du catalogue courant."
                actionLabel="Réinitialiser le scénario"
                onAction={resetScenario}
              />
            ) : null}

            {!engineError && !error ? (
              <View style={[styles.resultsGrid, wide && styles.resultsGridWide]}>
                {recommendations.map((recommendation) => (
                  <View
                    key={recommendation.event.eventId}
                    style={[styles.resultItem, wide && styles.resultItemWide]}
                  >
                    <RecommendationCard
                      recommendation={recommendation}
                      isFavorite={favoriteIds.has(recommendation.event.eventId)}
                      onToggleFavorite={() => toggleFavorite(recommendation.event.eventId)}
                      onToggleDislike={() => toggleDislike(recommendation.event.eventId)}
                    />
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {/* -------------------------------------------------- */}
          {/* Benchmark                                           */}
          {/* -------------------------------------------------- */}
          <View style={styles.section}>
            <SectionHeading
              index="03"
              title="Évaluation comparative"
              description="TF-IDF, E5, contexte et MMR sont comparés sur les mêmes profils et le même catalogue."
            />
            <ModelComparisonPanel benchmark={benchmark} />
          </View>

          {/* -------------------------------------------------- */}
          {/* Méthodologie                                        */}
          {/* -------------------------------------------------- */}
          <View style={styles.section}>
            <SectionHeading
              index="04"
              title="Méthodologie et limites"
              description="Ce que la démonstration montre — et ce qu’elle ne montre pas."
            />
            <View style={styles.methodology}>
              <Text style={styles.methodologyLead}>
                Démonstration de recherche. Les profils et les interactions présentés ici sont
                fictifs ou simulés. Les métriques proviennent d’un jeu de données annoté décrit
                dans le rapport. Cette démonstration ne représente pas des ventes réelles ni un
                déploiement auprès de clients.
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>
                  • Les {benchmark.sampleCounts.catalogEvents} événements sont des fixtures de
                  démonstration (is_demo=true), pas des offres vérifiées.
                </Text>
                <Text style={styles.bullet}>
                  • Les annotations sont des jugements guidés par une seule personne, pas des
                  clics ou des achats réels ; {benchmark.sampleCounts.testProfiles} profils
                  servent au test, {benchmark.sampleCounts.devProfiles} au réglage.
                </Text>
                <Text style={styles.bullet}>
                  • Le modèle E5 est exécuté hors ligne en Python ; le runtime TypeScript ne fait
                  que des calculs vectoriels et contextuels locaux.
                </Text>
                <Text style={styles.bullet}>
                  • Un désintérêt retire l’événement et réduit l’affinité des contenus proches ;
                  une impression n’est jamais traitée comme un rejet.
                </Text>
                <Text style={styles.bullet}>
                  • Aucun appel Supabase, Clerk, paiement ou service ML distant n’est effectué.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Artefacts : {benchmark.datasetVersion} · {benchmark.model.id} @{' '}
              {benchmark.model.revision.slice(0, 8)} · généré le{' '}
              {formatEventDate(benchmark.generatedAt)}
            </Text>
            <Text style={styles.footerText}>
              Pipeline : ml/scripts/build_dataset.py → build_embeddings.py →
              run_benchmark.py → export_runtime_assets.py.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 1000,
    gap: spacing.xl,
  },
  hero: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  researchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
  },
  researchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  researchText: {
    ...typography.overline,
    color: colors.textSecondary,
  },
  eyebrow: {
    ...typography.overline,
    color: colors.gold,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.text,
  },
  heroText: {
    ...typography.body,
    color: colors.textSecondary,
    maxWidth: 760,
  },
  heroStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  stat: {
    gap: 1,
    minWidth: 110,
  },
  statValue: {
    ...typography.h3,
    color: colors.goldBright,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeading: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  sectionIndex: {
    ...typography.h3,
    color: colors.goldDeep,
  },
  sectionHeadingText: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  sectionDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  profileSummary: {
    gap: 4,
    paddingLeft: spacing.xs,
  },
  profileSummaryText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  profileSummaryMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  preferencesCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  preferencesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  preferencesHeaderText: {
    flex: 1,
    gap: 2,
  },
  preferencesTitle: {
    ...typography.title,
    color: colors.text,
  },
  resetButton: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderGold,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  resetText: {
    ...typography.captionSemiBold,
    color: colors.gold,
  },
  preferenceGroup: {
    gap: spacing.sm,
  },
  preferenceLabel: {
    ...typography.captionSemiBold,
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  chipActive: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  chipText: {
    ...typography.captionSemiBold,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.onyx,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  contextNote: {
    ...typography.caption,
    color: colors.textMuted,
  },
  resultsGrid: {
    gap: spacing.md,
  },
  resultsGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  resultItem: {
    flexGrow: 1,
    flexBasis: '100%',
    maxWidth: '100%',
  },
  resultItemWide: {
    flexBasis: '48%',
    maxWidth: '48%',
  },
  notice: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.terracotta,
    backgroundColor: 'rgba(201,96,63,0.12)',
    padding: spacing.md,
    gap: 4,
  },
  noticeTitle: {
    ...typography.bodySmallSemiBold,
    color: colors.terracottaSoft,
  },
  noticeText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  methodology: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  methodologyLead: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  bulletList: {
    gap: 6,
  },
  bullet: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 19,
  },
  footer: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  footerText: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
