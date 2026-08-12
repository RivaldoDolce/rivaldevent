/**
 * Bandeau d'indicateur hors-ligne.
 *
 * S'affiche en haut de l'ecran quand la connexion est perdue.
 * Design : fond noir profond, filet doré, texte ivoire, icone warning.
 * Se cache automatiquement quand la connexion revient.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOffline } from '@/hooks/useOffline';
import { colors, spacing } from '@/lib/constants';

export const OfflineBanner = React.memo(function OfflineBanner() {
  const isOffline = useOffline();
  const insets = useSafeAreaInsets();

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top }]}>
      <View style={styles.dot} />
      <WifiOff color={colors.goldBright} size={15} strokeWidth={1.75} />
      <Text style={styles.text}>Hors ligne — données en attente de sync</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    backgroundColor: 'rgba(10,9,8,0.96)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: `${colors.gold}45`,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
    opacity: 0.9,
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
    letterSpacing: 0.3,
  },
});