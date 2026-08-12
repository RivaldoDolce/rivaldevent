/**
 * Retour OAuth (Google / Apple) — route `oauth-callback`.
 *
 * Design « Noir & Or » : ecran d'attente premium — fond noir profond,
 * medaillon or, anneau de chargement dore, message tamisé.
 *
 * Logique (inchangée) :
 * - complete la session navigateur (WebBrowser.maybeCompleteAuthSession)
 * - finalise elle-meme le flux SSO a partir du rotating_token_nonce
 * - redirige vers l'accueil (acheteur ou vendeur) une fois connecte
 * - n'abandonne jamais silencieusement : erreur claire + bouton reessayer
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useClerk, useSignUp } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';
import { CircleAlert } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/icons/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAppMode } from '@/stores/app-mode';
import { colors, gradients, spacing, typography, shadows } from '@/lib/constants';
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
    <LinearGradient
      colors={[...gradients.noir] as unknown as readonly [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      {/* Halos dorés décoratifs */}
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.ringDeco} />

      <View style={styles.iconCircle}>
        {busy && !offline ? (
          <ActivityIndicator size="small" color={colors.goldBright} />
        ) : error ? (
          <CircleAlert size={28} color={colors.goldBright} strokeWidth={1.5} />
        ) : (
          <Logo size="sm" withBackground />
        )}
      </View>

      <Text style={styles.title}>Connexion</Text>

      {error ? (
        <>
          <Text style={styles.subtitle}>{error}</Text>
          <View style={styles.actionWrap}>
            <Button variant="primary" size="md" onPress={retry}>
              Réessayer
            </Button>
          </View>
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
            <View style={styles.actionWrap}>
              <Button variant="primary" size="md" onPress={retry}>
                Réessayer
              </Button>
            </View>
          ) : null}
          <Pressable onPress={goToLogin} hitSlop={12} style={styles.backLink}>
            <Text style={styles.backLinkText}>Retour à la connexion</Text>
          </Pressable>
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -140,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(216,180,90,0.09)',
  },
  ringDeco: {
    position: 'absolute',
    top: 60,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(216,180,90,0.15)',
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.goldGlowSoft,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.xl,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
    maxWidth: 300,
  },
  slowText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionWrap: {
    marginTop: spacing.xl,
  },
  backLink: {
    marginTop: spacing.xl,
  },
  backLinkText: {
    ...typography.bodySmallMedium,
    color: colors.goldBright,
    textDecorationLine: 'underline',
  },
});