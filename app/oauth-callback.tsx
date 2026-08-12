/**
 * Retour OAuth (Google / Apple) — route `oauth-callback`.
 *
 * Le navigateur redirige vers exp://.../--/oauth-callback?rotating_token_nonce=...
 * apres le choix du compte. Cette route :
 * - complete la session navigateur (WebBrowser.maybeCompleteAuthSession)
 * - finalise elle-meme le flux SSO a partir du rotating_token_nonce
 *   (fiable meme si la promesse du startSSOFlow a ete perdue)
 * - redirige vers l'accueil (acheteur ou vendeur) une fois connecte
 * - n'abandonne jamais silencieusement : erreur claire + bouton reessayer
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useClerk, useSignUp } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';

import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAppMode } from '@/stores/app-mode';
import { colors, spacing, typography, radius } from '@/lib/constants';
import { logger } from '@/lib/logger';

WebBrowser.maybeCompleteAuthSession();

// Messages reseau — l'utilisateur n'est jamais laisse dans une attente muette.
const OFFLINE_MESSAGE = 'Pas de connexion Internet. Vérifiez votre réseau puis réessayez.';
const WEAK_NETWORK_MESSAGE = 'Votre connexion est instable. Rapprochez-vous de votre box ou de votre opérateur, puis réessayez.';
const SLOW_MESSAGE = 'La connexion au serveur est lente. Patientez quelques instants\u2026';

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rotating_token_nonce?: string }>();
  const { isAuthenticated, isLoading } = useAuth();
  const mode = useAppMode((state: { mode: string }) => state.mode);
  const { client } = useClerk();
  const { signUp } = useSignUp();

  const nonce = typeof params.rotating_token_nonce === 'string' ? params.rotating_token_nonce : null;
  const hasAttempted = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [slow, setSlow] = useState(false);

  // Etat reseau : hors ligne / instable / fonctionnel.
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const offline = !isConnected;
  const weakNetwork = isConnected && isInternetReachable === false;
  const offlineRef = useRef(offline);
  offlineRef.current = offline;
  const prevConnected = useRef(isConnected);
  const busy = isLoading || completing;

  // Finalise le flux SSO directement (meme logique que useSSO experimental)
  const completeSso = useCallback(async () => {
    if (!nonce || hasAttempted.current) return;
    hasAttempted.current = true;
    setCompleting(true);
    setError(null);

    try {
      const currentSignIn = (await client.signIn.reload({ rotatingTokenNonce: nonce }))
        .__internal_future;

      if (currentSignIn.firstFactorVerification.status === 'transferable') {
        await signUp.create({ transfer: true });
      }

      const resource = currentSignIn.firstFactorVerification.status === 'transferable'
        ? signUp
        : currentSignIn;

      if (resource.createdSessionId) {
        await resource.finalize();
        // La session est active : useAuth va rediriger vers l'accueil.
        return;
      }

      if (resource.existingSession) {
        // Session existante : rien a finaliser, la redirection se fera.
        return;
      }

      setError('La connexion sociale n\u2019a pas pu aboutir. Réessayez.');
    } catch (err) {
      logger.debug('SSO callback error:', err);
      setError(
        offlineRef.current
          ? OFFLINE_MESSAGE
          : 'La connexion sociale n\u2019a pas pu aboutir. Réessayez.'
      );
    } finally {
      setCompleting(false);
    }
  }, [nonce, client, signUp]);

  // Redirection des que la session est active
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace(mode === 'seller' ? '/(seller)/home' : '/(client)/home');
    }
  }, [isLoading, isAuthenticated, mode, router]);

  // Tentative de finalisation autonome (une seule fois, si nonce present)
  useEffect(() => {
    if (isLoading || isAuthenticated || !nonce) return;
    completeSso();
  }, [isLoading, isAuthenticated, nonce, completeSso]);

  // Retente automatiquement des que le reseau revient apres un echec.
  useEffect(() => {
    const justReconnected = prevConnected.current === false && isConnected && error !== null;
    prevConnected.current = isConnected;
    if (justReconnected) {
      hasAttempted.current = false;
      completeSso();
    }
  }, [isConnected, error, completeSso]);

  // Si la finalisation depasse 12s, on informe l'utilisateur de la lenteur.
  useEffect(() => {
    if (!busy || error) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), 12000);
    return () => clearTimeout(timer);
  }, [busy, error]);

  const goToLogin = useCallback(() => {
    router.replace('/(auth)/login');
  }, [router]);

  const retry = useCallback(() => {
    hasAttempted.current = false;
    setSlow(false);
    completeSso();
  }, [completeSso]);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        {busy && !offline ? (
          <ActivityIndicator size="large" color={colors.terracotta} />
        ) : (
          <Text style={styles.stateIcon}>!</Text>
        )}
      </View>
      <Text style={styles.title}>Connexion</Text>

      {error ? (
        <>
          <Text style={styles.subtitle}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={retry} accessibilityRole="button">
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </Pressable>
          <Pressable onPress={goToLogin} hitSlop={12} style={styles.backLink}>
            <Text style={styles.backLinkText}>Retour à la connexion</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>
            {busy
              ? offline
                ? OFFLINE_MESSAGE
                : weakNetwork
                  ? WEAK_NETWORK_MESSAGE
                  : 'Finalisation de l\u2019authentification...'
              : 'En attente de l\u2019authentification...'}
          </Text>
          {slow ? <Text style={styles.slowText}>{SLOW_MESSAGE}</Text> : null}
          {offline ? (
            <Pressable style={styles.retryButton} onPress={retry} accessibilityRole="button">
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={goToLogin} hitSlop={12} style={styles.backLink}>
            <Text style={styles.backLinkText}>Retour à la connexion</Text>
          </Pressable>
        </>
      )}
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
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${colors.gold}15`,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    alignItems: 'center',
    justifyContent: 'center',
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
  stateIcon: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 34,
    lineHeight: 40,
    color: colors.terracotta,
  },
  slowText: {
    ...typography.bodySmall,
    color: colors.stone,
    marginTop: spacing.xs,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  retryButton: {
    backgroundColor: colors.terracotta,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  retryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.sand,
    letterSpacing: 0.2,
  },
  backLink: {
    marginTop: spacing.lg,
  },
  backLinkText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.terracotta,
    textDecorationLine: 'underline',
  },
});
