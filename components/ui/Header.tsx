/**
 * Header du design system avec bouton retour et actions.
 *
 * Regles UI/UX :
 * - Background bg sand
 * - Bouton retour : icone fine-line chevron-left, 44x44dp touch target
 * - Titre : typography h3, couleur onyx, aligne a gauche
 * - Actions droite : 0-2 icon buttons (44x44dp)
 * - Safe area top automatique (react-native-safe-area-context)
 * - Border bottom 1px stone a 20% opacity
 */

import React from 'react';
import { View, Text, Pressable, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/lib/constants';
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

  const containerStyle: ViewStyle = {
    paddingTop: insets.top + spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.sand,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.stone}33`,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56 + insets.top,
  };

  const handleBack = () => {
    impact('light');
    onBack?.();
  };

  return (
    <View testID={testID} style={containerStyle}>
      {/* Bouton retour */}
      {showBack && (
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={{
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing.sm,
          }}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          {onBack && (
            <Text style={{ color: colors.terracotta, fontSize: 24, lineHeight: 28 }}>
              {'<'}
            </Text>
          )}
        </Pressable>
      )}

      {/* Titre + sous-titre */}
      <View style={{ flex: 1 }}>
        {title && (
          <Text
            style={[typography.h3, { color: colors.onyx }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
        {subtitle && (
          <Text
            style={[typography.caption, { color: colors.stone, marginTop: 2 }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Actions droite */}
      {rightActions && rightActions.length > 0 && (
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          {rightActions.map((action, index) => (
            <Pressable
              key={index}
              onPress={() => {
                impact('light');
                action.onPress();
              }}
              hitSlop={12}
              style={{
                width: 44,
                height: 44,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              {action.icon}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
});