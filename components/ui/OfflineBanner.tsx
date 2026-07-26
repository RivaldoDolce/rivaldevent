/**
 * Bandeau d'indicateur hors-ligne.
 *
 * S'affiche en haut de l'ecran quand la connexion est perdue.
 * Design : fond onyx, texte ivoire, icone warning.
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
      <WifiOff color={colors.ivory} size={16} strokeWidth={1.5} />
      <Text style={styles.text}>Pas de connexion internet</Text>
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
    backgroundColor: colors.onyx,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.gold}40`,
  },
  text: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.ivory,
    letterSpacing: 0.3,
  },
});