import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { colors, typography, spacing, radius } from '@/lib/constants';

/**
 * SPLASH TEMPORAIRE - pour tester la navigation.
 * Sera remplace par un splash reel avec logo + animation dans feature/auth.
 */
export default function Splash() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rivald'event</Text>
      <Text style={styles.subtitle}>Splash temporaire</Text>

      <View style={styles.buttons}>
        <Pressable
          style={styles.button}
          onPress={() => router.replace('/(client)/home')}
        >
          <Text style={styles.buttonText}>Mode Client (4 onglets)</Text>
        </Pressable>

        <Pressable
          style={[styles.button, { backgroundColor: colors.forest }]}
          onPress={() => router.replace('/(seller)/home')}
        >
          <Text style={styles.buttonText}>Mode Vendeur (5 onglets)</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.outlineButton]}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={[styles.buttonText, { color: colors.terracotta }]}>
            Aller au Login
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.terracotta,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.stone,
    marginBottom: spacing['2xl'],
  },
  buttons: {
    width: '100%',
    gap: spacing.md,
  },
  button: {
    backgroundColor: colors.terracotta,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.terracotta,
  },
  buttonText: {
    ...typography.button,
    color: colors.sand,
  },
});