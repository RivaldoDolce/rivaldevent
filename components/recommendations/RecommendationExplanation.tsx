/**
 * Explications d'une recommandation.
 *
 * Les valeurs affichées proviennent directement des composantes du score
 * calculées par le moteur. Un facteur nul n'est jamais affiché.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/lib/constants';
import type { RecommendationExplanation } from '@/types/recommendations';

interface RecommendationExplanationListProps {
  readonly explanations: readonly RecommendationExplanation[];
}

export const RecommendationExplanationList = React.memo(
  function RecommendationExplanationList({
    explanations,
  }: RecommendationExplanationListProps) {
    if (explanations.length === 0) {
      return (
        <Text style={styles.empty}>
          Aucun facteur suffisamment contributif n’a pu être isolé pour cette recommandation.
        </Text>
      );
    }

    return (
      <View style={styles.list}>
        {explanations.map((explanation) => (
          <View key={explanation.key} style={styles.row}>
            <View style={styles.marker} />
            <View style={styles.body}>
              <Text style={styles.title}>{explanation.title}</Text>
              <Text style={styles.detail}>{explanation.detail}</Text>
            </View>
            <View style={styles.signalBadge}>
              <Text style={styles.signalText}>{Math.round(explanation.signal * 100)}%</Text>
            </View>
          </View>
        ))}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.glass,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
  },
  marker: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginTop: 7,
  },
  body: {
    flex: 1,
    gap: 1,
  },
  title: {
    ...typography.captionSemiBold,
    color: colors.goldBright,
  },
  detail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  signalBadge: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  signalText: {
    ...typography.captionSemiBold,
    color: colors.textSecondary,
  },
  empty: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
