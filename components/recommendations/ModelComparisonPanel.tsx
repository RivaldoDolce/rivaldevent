/**
 * Panneau expérimental : métriques réellement générées par le benchmark.
 *
 * Les valeurs sont lues dans `benchmark.v1.json`. Aucun chiffre n'est écrit
 * en dur dans l'interface. Les effectifs et les limites sont affichés avec les
 * résultats pour éviter toute surinterprétation.
 */

import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/lib/constants';
import type { BenchmarkArtifact, BenchmarkSplit } from '@/types/recommendations';

interface ModelComparisonPanelProps {
  readonly benchmark: BenchmarkArtifact;
}

const METHOD_COLORS: Readonly<Record<string, string>> = {
  metadata: colors.textMuted,
  tfidf: colors.info,
  e5: colors.terracotta,
  e5_context: colors.goldSoft,
  e5_context_mmr: colors.gold,
};

const DISPLAY_METRICS = [
  { key: 'ndcg@10', label: 'NDCG@10' },
  { key: 'recall@10', label: 'Recall@10' },
  { key: 'coverage@10', label: 'Couverture@10' },
  { key: 'diversity@10', label: 'Diversité@10' },
] as const;

function formatMetric(value: number | undefined): string {
  return value === undefined ? '—' : value.toFixed(3);
}

export const ModelComparisonPanel = React.memo(function ModelComparisonPanel({
  benchmark,
}: ModelComparisonPanelProps) {
  const [split, setSplit] = useState<BenchmarkSplit>('test');

  const rows = useMemo(
    () => benchmark.results.filter((result) => result.split === split),
    [benchmark.results, split],
  );

  const bestScore = useMemo(
    () => Math.max(0, ...rows.map((row) => row.metrics['ndcg@10'] ?? 0)),
    [rows],
  );

  const profileCount =
    split === 'test' ? benchmark.sampleCounts.testProfiles : benchmark.sampleCounts.devProfiles;

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>PANNEAU EXPÉRIMENTAL</Text>
          <Text style={styles.title}>Cinq approches comparées</Text>
        </View>
        <View style={styles.tabs}>
          {(['test', 'dev'] as const).map((value) => (
            <Pressable
              key={value}
              onPress={() => setSplit(value)}
              accessibilityRole="button"
              accessibilityState={{ selected: split === value }}
              style={[styles.tab, split === value && styles.tabActive]}
            >
              <Text style={[styles.tabText, split === value && styles.tabTextActive]}>
                {value === 'test' ? 'Test' : 'Développement'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={styles.subtitle}>
        {profileCount} profils · {benchmark.sampleCounts.judgments} jugements · seuil de
        pertinence ≥ {benchmark.protocol.relevanceThreshold} · K = 10
      </Text>

      <View style={styles.rows}>
        {rows.map((row) => {
          const isBest = row.metrics['ndcg@10'] !== undefined && row.metrics['ndcg@10'] === bestScore;
          return (
            <View key={row.method} style={[styles.row, isBest && styles.rowBest]}>
              <View style={styles.rowHeader}>
                <View style={styles.methodLabel}>
                  <View
                    style={[
                      styles.colorBar,
                      { backgroundColor: METHOD_COLORS[row.method] ?? colors.textMuted },
                    ]}
                  />
                  <Text style={styles.methodName}>{row.label}</Text>
                  {isBest ? <Text style={styles.bestTag}>MEILLEUR NDCG</Text> : null}
                </View>
                <Text style={styles.ndcg}>{formatMetric(row.metrics['ndcg@10'])}</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.max(
                        0,
                        Math.min(100, ((row.metrics['ndcg@10'] ?? 0) / (bestScore || 1)) * 100),
                      )}%`,
                      backgroundColor: METHOD_COLORS[row.method] ?? colors.gold,
                    },
                  ]}
                />
              </View>
              <View style={styles.metricsRow}>
                {DISPLAY_METRICS.slice(1).map((metric) => (
                  <View key={metric.key} style={styles.metric}>
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                    <Text style={styles.metricValue}>{formatMetric(row.metrics[metric.key])}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Poids contextuels : contenu {(benchmark.tuning.selectedWeightsNormalized.semantic * 100).toFixed(0)} %,
          catégorie {(benchmark.tuning.selectedWeightsNormalized.category * 100).toFixed(0)} %,
          ville {(benchmark.tuning.selectedWeightsNormalized.location * 100).toFixed(0)} %,
          budget {(benchmark.tuning.selectedWeightsNormalized.budget * 100).toFixed(0)} %,
          date {(benchmark.tuning.selectedWeightsNormalized.temporal * 100).toFixed(0)} %.
          Lambda MMR = {benchmark.tuning.selectedMmrLambda.toFixed(2)}.
        </Text>
        <Text style={styles.footerText}>
          Métriques calculées par le pipeline Python sur des événements et des jugements de
          démonstration. Un petit échantillon ne permet pas de conclure à une supériorité
          statistique.
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  panel: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderGold,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  headerText: {
    flex: 1,
    minWidth: 200,
    gap: 2,
  },
  eyebrow: {
    ...typography.overline,
    color: colors.gold,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    padding: 3,
  },
  tab: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  tabActive: {
    backgroundColor: colors.gold,
  },
  tabText: {
    ...typography.captionSemiBold,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.onyx,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  rows: {
    gap: spacing.sm + 2,
  },
  row: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  rowBest: {
    borderColor: colors.borderGold,
    backgroundColor: colors.elevated,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  methodLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  colorBar: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  methodName: {
    ...typography.bodySmallSemiBold,
    color: colors.text,
  },
  bestTag: {
    ...typography.overline,
    color: colors.gold,
  },
  ndcg: {
    ...typography.bodySemiBold,
    color: colors.goldBright,
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metric: {
    gap: 1,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metricValue: {
    ...typography.captionSemiBold,
    color: colors.textSecondary,
  },
  footer: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  footerText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
