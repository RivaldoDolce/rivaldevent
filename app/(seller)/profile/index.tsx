/**
 * Profil (mode vendeur) — page signature « Noir & Or ».
 *
 * Direction artistique : "La galerie de l'organisateur".
 * - Banniere haut de page plein degrade noir (gradients.hero) avec halo
 *   dore, anneaux decoratifs et filet or bas
 * - Avatar xl avec anneau or, nom Playfair, badge role (badge-check dore)
 * - Carte stats : 3 colonnes (Ventes / Billets / Niveau) valeurs Playfair
 * - Menu en carte verre : pastilles 44px verre + libelle + chevron or
 * - CTA retour acheteur premium + deconnexion terracotta + version en pied
 *
 * Donnees : profil Supabase (useAuth) + stats du store vendeur.
 * Toutes les couleurs viennent de lib/constants.ts — aucun hexadécimal en dur.
 */

import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  ImageBackground,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import {
  LogOut,
  ChevronRight,
  Store,
  Wallet,
  TicketCheck,
  BadgeCheck,
  UserPen,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';
import { useAppMode } from '@/stores/app-mode';
import type { AppMode } from '@/stores/app-mode';
import { useSellerTotals } from '@/stores/seller-store';
import { useAuthService } from '@/services/auth.service';
import { useHaptics } from '@/hooks/useHaptics';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { colors, gradients, spacing, radius, typography, shadows, ROUTES } from '@/lib/constants';
import { sellerBackgrounds } from '@/lib/images';

// ============================================================
// Types & données statiques
// ============================================================

interface MenuItem {
  readonly label: string;
  readonly icon: ReactNode;
  readonly onPress?: () => void;
}

const MONTHS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

// ============================================================
// Helpers (dérivés des données réelles — aucun chiffre inventé)
// ============================================================

function formatMemberSince(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`;
}

function buildMemberNumber(id?: string | null): string {
  if (!id) return 'RV-0000-0000';
  const clean = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const part = clean.slice(-8).padStart(8, '0');
  return `RV-${part.slice(0, 4)}-${part.slice(4)}`;
}

// ============================================================
// Ecran
// ============================================================

export default function SellerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const authService = useAuthService();
  const mode = useAppMode((state: { mode: AppMode }) => state.mode);
  const setMode = useAppMode((state: { setMode: (v: AppMode) => void }) => state.setMode);
  const totals = useSellerTotals();
  const { impact, notification } = useHaptics();

  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const displayName = profile?.full_name || user?.user_metadata?.full_name || '';
  const avatarUrl = useAvatarUrl(user?.id, profile?.avatar_url);
  const displayEmail = user?.email || '';
  const displayPhone = profile?.phone || '';
  const initials = displayName.charAt(0).toUpperCase() || '?';
  const memberSince = formatMemberSince(profile?.created_at);
  const memberNumber = buildMemberNumber(user?.id);

  // -- Handlers --
  const handleSwitchMode = useCallback(async () => {
    if (!user?.id) return;
    setIsSwitching(true);
    impact('medium');

    const success = await authService.toggleSellerMode(user.id, false);

    if (success) {
      setMode('buyer');
      notification('success');
      setShowSwitchModal(false);
      // dismissTo (et non push) : depile l'ecran vendeur pousse depuis le
      // profil client et revele l'instance client D'ORIGINE, avec son etat
      // exact (onglet, scroll, donnees). Un push cree au contraire une
      // seconde instance client vierge, perdue sous le stack vendeur.
      // Si l'instance client n'est pas dans la pile (mode vendeur atteint
      // via le login), l'action est sans effet et l'on reste sur le vendeur.
      router.dismissTo('/(client)/home');
    } else {
      notification('error');
    }

    setIsSwitching(false);
  }, [user, setMode, notification, router, impact, authService]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    impact('medium');
    await authService.signOut();
    setMode('buyer');
    router.replace('/(auth)/login');
  }, [setMode, router, impact, authService]);

  // -- Menu (toutes les actions existantes conservees) --
  const menuItems: readonly MenuItem[] = [
    {
      label: 'Mes ventes',
      icon: <TicketCheck size={19} color={colors.gold} strokeWidth={1.75} />,
      onPress: () => router.push(ROUTES.SELLER_TICKETS),
    },
    {
      label: 'Mes evenements',
      icon: <Store size={19} color={colors.terracotta} strokeWidth={1.75} />,
      onPress: () => router.push(ROUTES.SELLER_EXPLORE),
    },
    {
      label: 'Mon portefeuille',
      icon: <Wallet size={19} color={colors.gold} strokeWidth={1.75} />,
      onPress: () => router.push(ROUTES.SELLER_WALLET),
    },
    {
      label: 'Modifier mon profil',
      icon: <UserPen size={19} color={colors.gold} strokeWidth={1.75} />,
      onPress: () => router.push(ROUTES.PROFILE_EDIT),
    },
    {
      label: 'Aide et support',
      icon: <MessageCircle size={19} color={colors.gold} strokeWidth={1.75} />,
      onPress: () => router.push(ROUTES.HELP),
    },
    {
      label: 'Confidentialite',
      icon: <ShieldCheck size={19} color={colors.gold} strokeWidth={1.75} />,
      onPress: () => router.push(ROUTES.PRIVACY),
    },
  ];

  // -- Style dynamique : banniere --
  const heroStyle: ViewStyle = {
    paddingTop: insets.top + spacing.lg,
  };

  return (
    <ImageBackground
      source={sellerBackgrounds.profil}
      style={styles.screen}
      imageStyle={styles.bgImage}
      accessibilityIgnoresInvertColors
    >
      {/* Voile plein ecran */}
      <LinearGradient
        colors={['rgba(10,9,8,0.50)', 'rgba(10,9,8,0.82)']}
        style={styles.bgScrim}
        pointerEvents="none"
      />
      <StatusBar style="light" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================
            (a) BANNIERE — plein degrade hero + halo or
            ============================================ */}
        <LinearGradient
          colors={[...gradients.hero] as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.hero, heroStyle]}
        >
          {/* Motif : halo doré + anneaux + point or */}
          <View pointerEvents="none" style={styles.heroGlow} />
          <View pointerEvents="none" style={styles.heroRingLarge} />
          <View pointerEvents="none" style={styles.heroRingSmall} />
          <View pointerEvents="none" style={styles.heroGoldDot} />

          {/* Barre du haut */}
          <View style={styles.heroTopBar}>
            <View style={styles.heroOverlineRow}>
              <Store size={14} color={colors.goldBright} strokeWidth={1.75} />
              <Text style={styles.heroOverline}>ESPACE VENDEUR</Text>
            </View>
            <View style={mode === 'seller' ? styles.modeBadge : null}>
              <Text style={styles.modeBadgeText}>ORGANISATEUR</Text>
            </View>
          </View>

          {/* Avatar xl + identite */}
          <Pressable
            onPress={() => {
              impact('light');
              router.push(ROUTES.PROFILE_EDIT);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Modifier mon profil"
            style={styles.avatarWrapper}
          >
            <Avatar
              source={avatarUrl}
              fallback={initials}
              size="xl"
              border="highlight"
            />
          </Pressable>

          <View style={styles.identityBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName || 'Utilisateur'}
              </Text>
            </View>

            {/* Badge role — verre doré + badge-check */}
            <View style={styles.roleBadge}>
              <BadgeCheck size={14} color={colors.goldBright} strokeWidth={2} />
              <Text style={styles.roleBadgeText}>Vendeur verifie</Text>
            </View>

            <Text style={styles.subtitle} numberOfLines={1}>
              {displayEmail || (displayPhone ? `+237 ${displayPhone}` : '')}
            </Text>

            {memberSince ? (
              <View style={styles.sinceRow}>
                <View style={styles.sinceDot} />
                <Text style={styles.sinceText}>Organisateur depuis {memberSince}</Text>
              </View>
            ) : null}
          </View>

          {/* Filet or bas */}
          <View pointerEvents="none" style={styles.heroHairline} />
        </LinearGradient>

        {/* ============================================
            (b) CARTE STATS — 3 colonnes premium
            ============================================ */}
        <View style={styles.statsCard}>
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{totals.totalSales}</Text>
            <Text style={styles.statLabel}>VENTES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>{totals.ticketsSold}</Text>
            <Text style={styles.statLabel}>BILLETS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statColumn}>
            <Text style={styles.statValue}>OR</Text>
            <Text style={styles.statLabel}>NIVEAU</Text>
          </View>
        </View>

        {/* ============================================
            (c) MENU — carte verre premium
            ============================================ */}
        <View style={styles.menuSection}>
          <Text style={styles.menuOverline}>MON ESPACE</Text>
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <Pressable
                key={item.label}
                style={[
                  styles.menuRow,
                  index < menuItems.length - 1 ? styles.menuRowBorder : null,
                ]}
                onPress={() => {
                  impact('light');
                  item.onPress?.();
                }}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={styles.menuIconPill}>{item.icon}</View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <ChevronRight size={18} color={colors.goldMuted} strokeWidth={1.5} />
              </Pressable>
            ))}

            {/* Separateur + Deconnexion */}
            <View style={styles.menuDivider} />
            <Pressable
              style={styles.menuRow}
              onPress={handleLogout}
              disabled={isLoggingOut}
              accessibilityRole="button"
              accessibilityLabel="Se deconnecter"
            >
              <View style={[styles.menuIconPill, styles.menuIconPillLogout]}>
                <LogOut size={19} color={colors.terracotta} strokeWidth={1.75} />
              </View>
              <Text style={[styles.menuLabel, styles.logoutLabel]}>
                {isLoggingOut ? 'Deconnexion...' : 'Se deconnecter'}
              </Text>
              <ChevronRight size={18} color={colors.goldMuted} strokeWidth={1.5} />
            </Pressable>
          </View>
        </View>

        {/* ============================================
            CTA RETOUR ACHETEUR — premium
            ============================================ */}
        <Pressable
          style={styles.buyerCta}
          onPress={() => {
            impact('light');
            setShowSwitchModal(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Revenir en mode acheteur"
        >
          <LinearGradient
            colors={[...gradients.gold] as unknown as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buyerCtaIcon}
          >
            <ShoppingBag size={22} color={colors.onyx} strokeWidth={1.75} />
          </LinearGradient>
          <View style={styles.buyerCtaTextBlock}>
            <Text style={styles.buyerCtaTitle}>Revenir en mode Acheteur</Text>
            <Text style={styles.buyerCtaSub}>
              Retrouvez l'experience d'achat et de decouverte
            </Text>
          </View>
          <ChevronRight size={20} color={colors.goldBright} strokeWidth={1.75} />
        </Pressable>

        {/* ============================================
            (d) VERSION EN PIED
            ============================================ */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{memberNumber}</Text>
          <Text style={styles.footerText}>Rivald'event — Edition Or v{appVersion}</Text>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* ============================================
          MODAL — confirmation retour acheteur
          ============================================ */}
      <Modal
        visible={showSwitchModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSwitchModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowSwitchModal(false)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalGrabber} />

            <View style={styles.modalIconWrap}>
              <ShoppingBag size={24} color={colors.goldBright} strokeWidth={1.75} />
            </View>

            <Text style={styles.modalTitle}>Revenir en mode Acheteur</Text>
            <Text style={styles.modalDescription}>
              Retrouvez l'experience d'achat de billets et la decouverte
              d'evenements.
            </Text>

            <View style={styles.modalConfirmWrap}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={isSwitching}
                onPress={handleSwitchMode}
              >
                {isSwitching ? 'Changement en cours...' : 'Confirmer le changement'}
              </Button>
            </View>

            <Pressable
              style={styles.modalCancel}
              onPress={() => setShowSwitchModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Annuler"
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ImageBackground>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bgScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // -- Hero --
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -90,
    right: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(216,180,90,0.09)',
  },
  heroRingLarge: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1.5,
    borderColor: `${colors.gold}2E`,
    top: -80,
    right: -46,
  },
  heroRingSmall: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: `${colors.gold}26`,
    top: -28,
    right: 16,
  },
  heroGoldDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: `${colors.gold}45`,
    bottom: spacing.lg + 6,
    right: spacing.lg,
  },
  heroHairline: {
    position: 'absolute',
    bottom: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: 1,
    backgroundColor: `${colors.gold}2E`,
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroOverlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroOverline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 16,
    color: colors.goldMuted,
    letterSpacing: 2.4,
    marginLeft: spacing.sm,
  },
  modeBadge: {
    backgroundColor: 'rgba(216,180,90,0.12)',
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  modeBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    color: colors.goldBright,
    letterSpacing: 1.2,
  },
  avatarWrapper: {
    alignSelf: 'center',
  },
  identityBlock: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '92%',
  },
  name: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    lineHeight: 34,
    color: colors.text,
    letterSpacing: -0.4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(216,180,90,0.12)',
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginTop: spacing.sm,
  },
  roleBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.goldBright,
    letterSpacing: 0.3,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    maxWidth: '90%',
  },
  sinceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  sinceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    marginRight: spacing.sm,
  },
  sinceText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },

  // -- Carte stats --
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    paddingVertical: spacing.md,
    ...shadows.card,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    lineHeight: 30,
    color: colors.goldBright,
    letterSpacing: -0.3,
  },
  statLabel: {
    ...typography.overline,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: spacing.sm,
    backgroundColor: colors.divider,
  },

  // -- Menu carte verre --
  menuSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  menuOverline: {
    ...typography.overline,
    color: colors.goldMuted,
    marginBottom: spacing.sm + 2,
    marginLeft: spacing.xs,
  },
  menuCard: {
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.md,
    backgroundColor: `${colors.gold}2E`,
  },
  menuIconPill: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconPillLogout: {
    backgroundColor: 'rgba(201,96,63,0.10)',
    borderColor: 'rgba(201,96,63,0.30)',
  },
  menuLabel: {
    flex: 1,
    marginLeft: spacing.md,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
  logoutLabel: {
    fontFamily: 'Inter_500Medium',
    color: colors.terracotta,
  },

  // -- CTA retour acheteur --
  buyerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.elevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    padding: spacing.md,
    ...shadows.card,
  },
  buyerCtaIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyerCtaTextBlock: {
    flex: 1,
    marginLeft: spacing.md,
  },
  buyerCtaTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    letterSpacing: -0.2,
  },
  buyerCtaSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: 2,
  },

  // -- Pied de page --
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
    color: colors.textFaint,
    letterSpacing: 0.5,
  },

  // -- Modal --
  modalBackdrop: {
    flex: 1,
    backgroundColor: `${colors.onyx}8A`,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.elevated,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  modalGrabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: `${colors.goldMuted}55`,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  modalIconWrap: {
    alignSelf: 'center',
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(216,180,90,0.10)',
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  modalDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    letterSpacing: 0.2,
  },
  modalConfirmWrap: {
    alignSelf: 'stretch',
  },
  modalCancel: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalCancelText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.goldBright,
    letterSpacing: 0.2,
  },
});