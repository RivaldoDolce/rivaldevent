/**
 * Retour OAuth (Google / Apple) — route `oauth-callback`.
 *
 * Le navigateur redirige vers exp://.../--/oauth-callback apres le choix du
 * compte. Cette route :
 * - complete la session navigateur (WebBrowser.maybeCompleteAuthSession)
 * - affiche un ecran de chargement pendant que le SSO finalise
 * - redirige vers l'accueil (acheteur ou vendeur) une fois connecte,
 *   ou vers la page de connexion si le flux a ete annule.
 */

import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { useAuth } from '@/hooks/useAuth';
import { useAppMode } from '@/stores/app-mode';
import { colors, spacing, typography } from '@/lib/constants';

WebBrowser.maybeCompleteAuthSession();

const FALLBACK_DELAY_MS = 4000;

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const mode = useAppMode((state: { mode: string }) => state.mode);
  const [elapsed, setElapsed] = useState(0);

  // Compteur de grace : laisse le temps a la session de s'activer
  // avant de considerer le flux comme annule.
  useEffect(() => {
    const timer = setTimeout(() => setElapsed((e) => e + 500), 500);
    return () => clearTimeout(timer);
  }, [elapsed]);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace(mode === 'seller' ? '/(seller)/home' : '/(client)/home');
    } else if (elapsed >= FALLBACK_DELAY_MS) {
      router.replace('/(auth)/login');
    }
  }, [isLoading, isAuthenticated, mode, elapsed, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.terracotta} />
      <Text style={styles.title}>Connexion</Text>
      <Text style={styles.subtitle}>Finalisation de l'authentification...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    lineHeight: 32,
    color: colors.onyx,
    marginTop: spacing.lg,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.stone,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
