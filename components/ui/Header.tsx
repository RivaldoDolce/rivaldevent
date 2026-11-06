/**
 * Header — design system « Noir & Or ».
 *
 * - Fond décoratif profond avec halo doré (dégradé)
 * - Bouton retour pastille verre + chevron or
 * - Titre Playfair Display, sous-titre caption
 * - Actions droites 0-2 (44px touch target)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { colors, spacing, radius, typography } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';

// ============================================================
// Types
// ============================================================

interface HeaderAction {
  readonly icon: React.ReactNode;
  readonly onPress: () => void;
  readonly label?: string;
}

interface HeaderProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly onBack?: () => void;
  readonly rightActions?: HeaderAction[];
  readonly showBack?: boolean;
  readonly testID?: string;
}

// ============================================================
// Composant
// ============================================================

export const Header = React.memo(function Header({
  title,
  subtitle,
  onBack,
  rightActions,
  showBack = false,
  testID,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();

  const handleBack = () => {
    impact('light');
    onBack?.();
  };

  return (
    <LinearGradient
      testID={testID}
      colors={[colors.elevated, colors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + spacing.sm }]}
    >
      <View pointerEvents="none" style={styles.glow} />

      <View style={styles.row}>
        {showBack && (
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            {onBack && (
              <ChevronLeft size={22} color={colors.goldBright} strokeWidth={1.75} />
            )}
          </Pressable>
        )}

        <View style={styles.titleBlock}>
          {title && (
            <Text style={[typography.h3, styles.title]} numberOfLines={1}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[typography.caption, styles.subtitle]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {rightActions && rightActions.length > 0 && (
          <View style={styles.actions}>
            {rightActions.map((action, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  impact('light');
                  action.onPress();
                }}
                hitSlop={12}
                style={styles.actionButton}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                {action.icon}
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </LinearGradient>
  );
});

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    minHeight: 64,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(216,180,90,0.07)',
  },
});