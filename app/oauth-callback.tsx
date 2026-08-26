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
import { Pressable, StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useClerk, useSignUp } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';
import { CircleAlert, WifiOff } from 'lucide-react-native';
import { Image } from 'expo-image';

import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/icons/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAppMode } from '@/stores/app-mode';
import { colors, spacing, typography } from '@/lib/constants';
import { authBackgrounds } from '@/lib/images';
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

  const logoPulse = useRef(new Animated.Value(0)).current;
  const ringSpin = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(logoPulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    const spin = Animated.loop(Animated.timing(ringSpin, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true }));
    const dots = Animated.loop(Animated.timing(dotAnim, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true }));
    if (busy && !offline && !error) { pulse.start(); spin.start(); dots.start(); }
    return () => { pulse.stop(); spin.stop(); dots.stop(); };
  }, [busy, offline, error, logoPulse, ringSpin, dotAnim]);

  const ringRotation = ringSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const logoScale = logoPulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });
  const dot1 = dotAnim.interpolate({ inputRange: [0, 0.33, 0.66, 1], outputRange: [0.3, 1, 0.3, 0.3] });
  const dot2 = dotAnim.interpolate({ inputRange: [0, 0.33, 0.66, 1], outputRange: [0.3, 0.3, 1, 0.3] });
  const dot3 = dotAnim.interpolate({ inputRange: [0, 0.33, 0.66, 1], outputRange: [0.3, 0.3, 0.3, 1] });

  const retry = useCallback(() => {
    hasAttempted.current = false;
    setSlow(false);
    completeSso();
  }, [completeSso]);

  return (
    <View style={styles.bgScreen}>
      <Image source={authBackgrounds.login} style={StyleSheet.absoluteFillObject} contentFit="cover" blurRadius={8} cachePolicy="memory-disk" />
      <LinearGradient colors={['rgba(10,9,8,0.52)', 'rgba(10,9,8,0.88)']} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      <View style={styles.centerWrap}>
        <View pointerEvents="none" style={styles.glowTop} />
        <View pointerEvents="none" style={styles.ringDeco} />

        {error ? (
          <View style={styles.errorBadge}>
            <CircleAlert size={26} color={colors.terracotta} strokeWidth={1.75} />
          </View>
        ) : offline ? (
          <View style={styles.errorBadge}>
            <WifiOff size={26} color={colors.warning} strokeWidth={1.75} />
          </View>
        ) : (
          <View style={styles.logoWrap}>
            <Animated.View style={[styles.ring, { transform: [{ rotate: ringRotation }] }]} />
            <Animated.View style={{ transform: [{ scale: logoScale }] }}>
              <Logo size="lg" withBackground />
            </Animated.View>
          </View>
        )}

        <Text style={styles.title}>{error ? 'Oups' : offline ? 'Hors ligne' : 'Connexion en cours'}</Text>
        <Text style={styles.subtitle}>
          {error ? error : offline ? OFFLINE_MESSAGE : weakNetwork ? WEAK_NETWORK_MESSAGE : 'Finalisation de l’authentification…'}
        </Text>

        {!error && !offline && busy && (
          <View style={styles.dotsRow}>
            <Animated.View style={[styles.dot, { opacity: dot1 }]} />
            <Animated.View style={[styles.dot, { opacity: dot2 }]} />
            <Animated.View style={[styles.dot, { opacity: dot3 }]} />
          </View>
        )}

        {slow && !error && !offline ? <Text style={styles.slowText}>{SLOW_MESSAGE}</Text> : null}

        {error ? (
          <>
            <View style={styles.actionWrap}>
              <Button variant="primary" size="lg" fullWidth onPress={retry}>Réessayer</Button>
            </View>
            <Pressable onPress={goToLogin} hitSlop={12} style={styles.backLink}>
              <Text style={styles.backLinkText}>Retour à la connexion</Text>
            </Pressable>
          </>
        ) : offline ? (
          <>
            <View style={styles.actionWrap}>
              <Button variant="primary" size="lg" fullWidth onPress={retry}>Réessayer</Button>
            </View>
            <Pressable onPress={goToLogin} hitSlop={12} style={styles.backLink}>
              <Text style={styles.backLinkText}>Retour à la connexion</Text>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={goToLogin} hitSlop={12} style={styles.backLinkMuted}>
            <Text style={styles.backLinkMutedText}>Annuler</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bgScreen: { flex: 1, backgroundColor: colors.background },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, overflow: 'hidden' },
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
  logoWrap: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  ring: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderTopColor: colors.goldBright,
    borderRightColor: colors.goldMuted,
  },
  errorBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(30,26,22,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.h2, color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center', maxWidth: 300, lineHeight: 20 },
  slowText: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center', fontStyle: 'italic' },
  dotsRow: { flexDirection: 'row', gap: 10, marginTop: spacing.lg, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.goldBright },
  actionWrap: { marginTop: spacing.xl, width: '100%', maxWidth: 320 },
  backLink: { marginTop: spacing.lg },
  backLinkText: { ...typography.bodySmallMedium, color: colors.goldBright, textDecorationLine: 'underline' },
  backLinkMuted: { marginTop: spacing.xl, paddingVertical: spacing.sm },
  backLinkMutedText: { ...typography.bodySmall, color: colors.textMuted },
});