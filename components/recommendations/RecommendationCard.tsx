/**
 * Carte d'un événement recommandé.
 *
 * Affiche le rang, le score, les facteurs réellement calculés et les actions
 * locales (favori, désintérêt). Aucune action ne simule un achat réel.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, Heart, MapPin, Ticket, X } from 'lucide-react-native';

import { colors, radii, spacing, typography } from '@/lib/constants';
import {
  categoryLabel,
  formatEventDate,
  formatPriceRange,
} from '@/services/recommendations/explanations';
import type { Recommendation, ScoreComponents } from '@/types/recommendations';

import { RecommendationExplanationList } from './RecommendationExplanation';

interface RecommendationCardProps {
  readonly recommendation: Recommendation;
  readonly isFavorite: boolean;
  readonly onToggleFavorite: () => void;
  readonly onToggleDislike: () => void;
}

const COMPONENT_COLORS: Readonly<Record<keyof Omit<ScoreComponents, 'total'>, string>> = {
  semantic: colors.gold,
  category: colors.terracotta,
  location: colors.info,
  budget: colors.success,
  temporal: colors.textMuted,
};

const COMPONENT_LABELS: Readonly<Record<keyof Omit<ScoreComponents, 'total'>, string>> = {
  semantic: 'Contenu',
  category: 'Catégorie',
  location: 'Ville',
  budget: 'Budget',
  temporal: 'Date',
};

function ScoreStrip({ components }: { readonly components: ScoreComponents }) {
  const entries = (
    Object.keys(COMPONENT_COLORS) as Array<keyof Omit<ScoreComponents, 'total'>>
  )
    .map((key) => ({ key, value: Math.max(0, components[key]) }))
    .filter((entry) => entry.value > 0.0001);

  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={styles.scoreStrip} accessibilityLabel="Décomposition du score">
      {entries.map((entry) => (
        <View
          key={entry.key}
          style={{
            flex: entry.value,
            backgroundColor: COMPONENT_COLORS[entry.key],
          }}
        />
      ))}
    </View>
  );
}

function ComponentLegend({ components }: { readonly components: ScoreComponents }) {
  const entries = (
    Object.keys(COMPONENT_COLORS) as Array<keyof Omit<ScoreComponents, 'total'>>
  ).filter((key) => components[key] > 0.0001);

  return (
    <View style={styles.legend}>
      {entries.map((key) => (
        <View key={key} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COMPONENT_COLORS[key] }]} />
          <Text style={styles.legendText}>{COMPONENT_LABELS[key]}</Text>
        </View>
      ))}
    </View>
  );
}

export const RecommendationCard = React.memo(function RecommendationCard({
  recommendation,
  isFavorite,
  onToggleFavorite,
  onToggleDislike,
}: RecommendationCardProps) {
  const { event, rank, score, components, explanations } = recommendation;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
        <View style={styles.badges}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{categoryLabel(event.category)}</Text>
          </View>
          {event.isDemo ? (
            <View style={styles.demoPill}>
              <Text style={styles.demoPillText}>Donnée fictive</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.score}>{score.toFixed(3)}</Text>
      </View>

      <Text style={styles.title}>{event.title}</Text>

      <View style={styles.metaRow}>
        <MapPin size={13} color={colors.textMuted} />
        <Text style={styles.metaText}>
          {event.city}
          {event.venue ? ` · ${event.venue}` : ''}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <CalendarDays size={13} color={colors.textMuted} />
        <Text style={styles.metaText}>{formatEventDate(event.startAt)}</Text>
        <Ticket size={13} color={colors.textMuted} style={styles.ticketIcon} />
        <Text style={styles.metaText}>
          {formatPriceRange(event.priceMin, event.priceMax)}
        </Text>
      </View>

      <ScoreStrip components={components} />
      <ComponentLegend components={components} />

      <RecommendationExplanationList explanations={explanations} />

      <View style={styles.actions}>
        <Pressable
          onPress={onToggleFavorite}
          accessibilityRole="button"
          accessibilityLabel={
            isFavorite ? `Retirer ${event.title} des favoris` : `Ajouter ${event.title} aux favoris`
          }
          style={({ pressed }) => [
            styles.actionButton,
            isFavorite && styles.actionButtonActive,
            pressed && styles.actionButtonPressed,
          ]}
        >
          <Heart
            size={15}
            color={isFavorite ? colors.onyx : colors.gold}
            fill={isFavorite ? colors.gold : 'transparent'}
          />
          <Text style={[styles.actionText, isFavorite && styles.actionTextActive]}>
            {isFavorite ? 'Favori' : 'Ajouter aux favoris'}
          </Text>
        </Pressable>

        <Pressable
          onPress={onToggleDislike}
          accessibilityRole="button"
          accessibilityLabel={`Marquer ${event.title} comme non pertinent`}
          style={({ pressed }) => [styles.dislikeButton, pressed && styles.actionButtonPressed]}
        >
          <X size={15} color={colors.textSecondary} />
          <Text style={styles.dislikeText}>Pas pertinent</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rankBadge: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderGold,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rankText: {
    ...typography.captionSemiBold,
    color: colors.gold,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  pill: {
    borderRadius: radii.full,
    backgroundColor: colors.glassGold,
    borderWidth: 1,
    borderColor: colors.borderGold,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: {
    ...typography.overline,
    color: colors.goldBright,
    letterSpacing: 0.6,
  },
  demoPill: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  demoPillText: {
    ...typography.overline,
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  score: {
    ...typography.bodySmallSemiBold,
    color: colors.gold,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  ticketIcon: {
    marginLeft: spacing.sm,
  },
  scoreStrip: {
    flexDirection: 'row',
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.divider,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderGold,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    minHeight: 38,
  },
  actionButtonActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  actionButtonPressed: {
    opacity: 0.75,
  },
  actionText: {
    ...typography.captionSemiBold,
    color: colors.gold,
  },
  actionTextActive: {
    color: colors.onyx,
  },
  dislikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    minHeight: 38,
  },
  dislikeText: {
    ...typography.captionSemiBold,
    color: colors.textSecondary,
  },
});
