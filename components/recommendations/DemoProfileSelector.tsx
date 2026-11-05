/**
 * Sélecteur de personas fictifs.
 *
 * Chaque carte résume la ville de référence, le budget et les centres
 * d'intérêt. La sélection recharge les préférences et efface les interactions.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/lib/constants';
import { formatPriceRange } from '@/services/recommendations/explanations';
import type { DemoProfileView } from '@/types/recommendations';

interface DemoProfileSelectorProps {
  readonly profiles: readonly DemoProfileView[];
  readonly selectedProfileId: string;
  readonly onSelect: (profileId: string) => void;
}

export const DemoProfileSelector = React.memo(function DemoProfileSelector({
  profiles,
  selectedProfileId,
  onSelect,
}: DemoProfileSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      accessibilityRole="list"
    >
      {profiles.map((profile) => {
        const selected = profile.profileId === selectedProfileId;
        return (
          <Pressable
            key={profile.profileId}
            onPress={() => onSelect(profile.profileId)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`Profil ${profile.displayName}`}
            style={({ pressed }) => [
              styles.card,
              selected && styles.cardSelected,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.headerRow}>
              <View style={[styles.dot, { backgroundColor: profile.accentColor }]} />
              <Text style={styles.city}>{profile.city}</Text>
              {selected ? <Text style={styles.selectedTag}>ACTIF</Text> : null}
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {profile.displayName}
            </Text>
            <Text style={styles.tagline} numberOfLines={2}>
              {profile.tagline}
            </Text>
            <Text style={styles.budget}>
              {formatPriceRange(profile.budgetMin, profile.budgetMax)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm + 4,
    paddingRight: spacing.lg,
  },
  card: {
    width: 232,
    minHeight: 150,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: 6,
  },
  cardSelected: {
    borderColor: colors.borderGold,
    backgroundColor: colors.elevated,
  },
  cardPressed: {
    opacity: 0.86,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  city: {
    ...typography.overline,
    color: colors.textSecondary,
    flex: 1,
  },
  selectedTag: {
    ...typography.overline,
    color: colors.gold,
  },
  name: {
    ...typography.title,
    color: colors.text,
  },
  tagline: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flexGrow: 1,
  },
  budget: {
    ...typography.captionSemiBold,
    color: colors.goldSoft,
  },
});
