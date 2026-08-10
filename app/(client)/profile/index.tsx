/**
 * Profil (mode acheteur) — carte membre premium.
 *
 * Direction artistique : "La galerie du membre".
 * - Hero en derivee foret avec anneaux decoratifs or (soleil couchant africain)
 * - Avatar cerne d'un anneau degrade or → terracotta
 * - Carte membre "Rivald'event" avec numero, QR et jauge d'achèvement du profil
 * - Menus groupes (Mon espace / Support), CTA vendeur, deconnexion
 *
 * Donnees : profil Supabase (useAuth) + compteur billets (tickets-store).
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
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  LogOut,
  ChevronRight,
  UserPen,
  Settings,
  HelpCircle,
  ShieldCheck,
  Ticket,
  Heart,
  Store,
  BadgeCheck,
  QrCode,
} from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import { useAppMode } from '@/stores/app-mode';
import type { AppMode } from '@/stores/app-mode';
import { useTicketsStore } from '@/stores/tickets-store';
import { authService } from '@/services/auth.service';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, typography, spacing, radius, ROUTES } from '@/lib/constants';

// ============================================================
// Types & données statiques
// ============================================================

interface MenuItem {
  readonly label: string;
  readonly icon: ReactNode;
  readonly accent: string;
  readonly onPress?: () => void;
}

interface MenuSection {
  readonly title: string;
  readonly items: readonly MenuItem[];
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

function computeCompletion(profile?: {
  readonly full_name?: string | null;
  readonly phone?: string | null;
  readonly avatar_url?: string | null;
} | null): number {
  const done = [profile?.full_name, profile?.phone, profile?.avatar_url].filter(
    Boolean
  ).length;
  return Math.round((done / 3) * 100);
}

// ============================================================
// Ecran
// ============================================================

export default function ClientProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const mode = useAppMode((state: { mode: AppMode }) => state.mode);
  const setMode = useAppMode((state: { setMode: (v: AppMode) => void }) => state.setMode);
  const ticketCount = useTicketsStore((state) => state.tickets.length);
  const { impact, notification } = useHaptics();

  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || '';
  const displayEmail = user?.email || '';
  const displayPhone = profile?.phone || '';
  const initials = displayName.charAt(0).toUpperCase() || '?';
  const memberSince = formatMemberSince(profile?.created_at);
  const memberNumber = buildMemberNumber(user?.id);
  const completion = computeCompletion(profile);

  // -- Handlers --
  const handleSwitchMode = useCallback(async () => {
    if (!user?.id) return;
    setIsSwitching(true);
    impact('medium');

    const success = await authService.toggleSellerMode(user.id, true);

    if (success) {
      setMode('seller');
      notification('success');
      setShowSwitchModal(false);
      router.replace('/(seller)/home');
    } else {
      notification('error');
    }

    setIsSwitching(false);
  }, [user, setMode, notification, router, impact]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    impact('medium');
    await authService.signOut();
    setMode('buyer');
    router.replace('/(auth)/login');
  }, [setMode, router, impact]);

  const menuSections: readonly MenuSection[] = [
    {
      title: 'Mon espace',
      items: [
        {
          label: 'Mes billets',
          icon: <Ticket size={19} color={colors.forest} strokeWidth={1.75} />,
          accent: `${colors.forest}12`,
          onPress: () => router.push(ROUTES.TICKETS),
        },
        {
          label: 'Favoris',
          icon: <Heart size={19} color={colors.terracotta} strokeWidth={1.75} />,
          accent: `${colors.terracotta}12`,
          onPress: () => router.push(ROUTES.FAVORITES),
        },
        {
          label: 'Parametres',
          icon: <Settings size={19} color={colors.stone} strokeWidth={1.75} />,
          accent: `${colors.stone}12`,
          onPress: () => router.push(ROUTES.PROFILE_SETTINGS),
        },
      ],
    },
    {
      title: 'Support & compte',
      items: [
        {
          label: 'Modifier mon profil',
          icon: <UserPen size={19} color={colors.terracotta} strokeWidth={1.75} />,
          accent: `${colors.terracotta}12`,
          onPress: () => router.push(ROUTES.PROFILE_EDIT),
        },
        {
          label: 'Aide et support',
          icon: <HelpCircle size={19} color={colors.goldDark} strokeWidth={1.75} />,
          accent: `${colors.goldDark}12`,
        },
        {
          label: 'Confidentialite',
          icon: <ShieldCheck size={19} color={colors.forest} strokeWidth={1.75} />,
          accent: `${colors.forest}12`,
        },
      ],
    },
  ];

  // -- Styles dynamiques --
  const heroStyle: ViewStyle = {
    paddingTop: insets.top + spacing.lg,
  };

  const avatarRingStyle: ViewStyle = {
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" backgroundColor={colors.forestDeep} />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.scrollContent, heroStyle]}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================
            1. HERO — derivee foret + anneaux or
            ============================================ */}
        <LinearGradient
          colors={[colors.forestDeep, colors.forestMid, colors.forest]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.hero}
        >
          {/* Motif : anneaux "soleil couchant" */}
          <View pointerEvents="none" style={styles.ringLarge} />
          <View pointerEvents="none" style={styles.ringSmall} />
          <View pointerEvents="none" style={styles.ringDot} />

          {/* Barre du haut */}
          <View style={styles.heroTopBar}>
            <Text style={styles.heroOverline}>MON ESPACE</Text>
            <Pressable
              onPress={() => impact('light')}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Parametres"
              style={styles.heroSettingsButton}
            >
              <Settings size={20} color={colors.sand} strokeWidth={1.75} />
            </Pressable>
          </View>

          {/* Avatar + identite */}
          <LinearGradient
            colors={[colors.goldSoft, colors.gold, colors.terracotta]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.avatarRing, avatarRingStyle]}
          >
            <View style={styles.avatarInner}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                  accessibilityLabel={displayName || 'Avatar'}
                />
              ) : (
                <Text style={styles.avatarInitial}>{initials}</Text>
              )}
            </View>
          </LinearGradient>

          <View style={styles.identityBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName || 'Utilisateur'}
              </Text>
              <BadgeCheck
                size={22}
                color={colors.goldSoft}
                strokeWidth={1.75}
                style={styles.verifiedIcon}
              />
            </View>
            <Text style={styles.email} numberOfLines={1}>
              {displayEmail || (displayPhone ? `+237 ${displayPhone}` : '')}
            </Text>
            {memberSince ? (
              <View style={styles.sinceRow}>
                <View style={styles.sinceDot} />
                <Text style={styles.sinceText}>Membre depuis {memberSince}</Text>
              </View>
            ) : null}
          </View>

          {/* Chips vitrines */}
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Ticket size={17} color={colors.goldSoft} strokeWidth={1.75} />
              <Text style={styles.chipValue}>{ticketCount}</Text>
              <Text style={styles.chipLabel}>Billets</Text>
            </View>
            <View style={styles.chip}>
              <BadgeCheck size={17} color={colors.goldSoft} strokeWidth={1.75} />
              <Text style={styles.chipValue}>{completion}%</Text>
              <Text style={styles.chipLabel}>Profil</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ============================================
            2. CARTE MEMBRE — chevauche le hero
            ============================================ */}
        <View style={styles.memberCard}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardOverline}>CARTE MEMBRE</Text>
            <View style={styles.tierChip}>
              <Text style={styles.tierChipText}>OR</Text>
            </View>
          </View>

          <View style={styles.cardMainRow}>
            <View style={styles.cardIdentity}>
              <Text style={styles.memberNumber}>{memberNumber}</Text>
              <Text style={styles.cardSub}>Membre Rivald'event</Text>
            </View>
            <View style={styles.qrChip}>
              <QrCode size={26} color={colors.forest} strokeWidth={1.5} />
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.cardFooterRow}>
            <Text style={styles.completionLabel}>Profil complete</Text>
            <Text style={styles.completionValue}>{completion}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[colors.gold, colors.goldBright]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${completion}%` }]}
            />
          </View>
        </View>

        {/* ============================================
            3. MENUS GROUPES
            ============================================ */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.title.toUpperCase()}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, index) => (
                <Pressable
                  key={item.label}
                  style={[
                    styles.menuRow,
                    index < section.items.length - 1 ? styles.menuRowBorder : null,
                  ]}
                  onPress={() => {
                    impact('light');
                    item.onPress?.();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <View style={[styles.menuIconChip, { backgroundColor: item.accent }]}>
                    {item.icon}
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <ChevronRight size={18} color={`${colors.stone}70`} strokeWidth={1.5} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* ============================================
            4. CTA MODE VENDEUR
            ============================================ */}
        <Pressable
          style={styles.sellerCta}
          onPress={() => {
            impact('light');
            setShowSwitchModal(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Passer en mode vendeur"
        >
          <LinearGradient
            colors={[colors.forestDeep, colors.forestMid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sellerCtaGradient}
          >
            <View style={styles.sellerCtaIcon}>
              <Store size={22} color={colors.forestDeep} strokeWidth={1.75} />
            </View>
            <View style={styles.sellerCtaTextBlock}>
              <Text style={styles.sellerCtaTitle}>Passer en mode vendeur</Text>
              <Text style={styles.sellerCtaSub}>
                {mode === 'seller' ? 'Mode vendeur actif' : 'Creez des evenements, vendez vos billets'}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.sand} strokeWidth={1.75} />
          </LinearGradient>
        </Pressable>

        {/* ============================================
            5. DECONNEXION
            ============================================ */}
        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
          accessibilityRole="button"
          accessibilityLabel="Se deconnecter"
        >
          <LogOut color={colors.terracotta} size={20} strokeWidth={1.75} />
          <Text style={styles.logoutText}>
            {isLoggingOut ? 'Deconnexion...' : 'Se deconnecter'}
          </Text>
        </Pressable>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* ============================================
          MODAL — confirmation switch vendeur
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
              <Store size={24} color={colors.forestDeep} strokeWidth={1.75} />
            </View>

            <Text style={styles.modalTitle}>Passer en mode Vendeur</Text>
            <Text style={styles.modalDescription}>
              Accedez a vos outils de creation d'evenements, gestion des
              billets et suivi de vos ventes.
            </Text>

            <LinearGradient
              colors={[colors.terracotta, colors.terracottaSoft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalConfirmButton}
            >
              <Pressable
                onPress={handleSwitchMode}
                disabled={isSwitching}
                style={styles.modalConfirmPressable}
                accessibilityRole="button"
                accessibilityLabel="Confirmer le changement"
              >
                <Text style={styles.modalConfirmText}>
                  {isSwitching ? 'Changement en cours...' : 'Confirmer le changement'}
                </Text>
              </Pressable>
            </LinearGradient>

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
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // -- Hero --
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: 'hidden',
  },
  ringLarge: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: `${colors.goldSoft}35`,
    top: -92,
    right: -64,
  },
  ringSmall: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 1.5,
    borderColor: `${colors.goldSoft}30`,
    top: -38,
    right: -18,
  },
  ringDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: `${colors.goldSoft}50`,
    top: 148,
    right: 36,
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroOverline: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 16,
    color: colors.goldSoft,
    letterSpacing: 2.4,
  },
  heroSettingsButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: `${colors.sand}14`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    alignSelf: 'center',
    padding: 3,
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  avatarInner: {
    width: 86,
    height: 86,
    borderRadius: 43,
    overflow: 'hidden',
    backgroundColor: `${colors.sand}1F`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 86,
    height: 86,
  },
  avatarInitial: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 36,
    lineHeight: 44,
    color: colors.sand,
  },
  identityBlock: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 26,
    lineHeight: 34,
    color: colors.sand,
    letterSpacing: -0.4,
    maxWidth: '78%',
  },
  verifiedIcon: {
    marginLeft: spacing.sm,
  },
  email: {
    marginTop: spacing.xs,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: `${colors.sand}B3`,
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
    backgroundColor: colors.goldSoft,
    marginRight: spacing.sm,
  },
  sinceText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: `${colors.sand}A8`,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.sand}14`,
    borderWidth: 1,
    borderColor: `${colors.sand}24`,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
  },
  chipValue: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 19,
    lineHeight: 24,
    color: colors.sand,
    marginLeft: spacing.sm,
  },
  chipLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: `${colors.sand}B3`,
    marginLeft: spacing.xs,
    marginTop: 3,
  },

  // -- Carte membre --
  memberCard: {
    marginHorizontal: spacing.lg,
    marginTop: -spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    padding: spacing.lg,
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardOverline: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 16,
    color: colors.gold,
    letterSpacing: 2,
  },
  tierChip: {
    backgroundColor: `${colors.gold}22`,
    borderWidth: 1,
    borderColor: `${colors.gold}55`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: (spacing.xs as number) - 2,
  },
  tierChipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 14,
    color: colors.onyx,
    letterSpacing: 1.2,
  },
  cardMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  cardIdentity: {
    flex: 1,
  },
  memberNumber: {
    fontFamily: 'Inter-Medium',
    fontSize: 17,
    lineHeight: 22,
    color: colors.onyx,
    letterSpacing: 1.6,
  },
  cardSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
    marginTop: 2,
  },
  qrChip: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.forest}25`,
    backgroundColor: `${colors.forest}0A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: `${colors.stone}22`,
    marginVertical: spacing.md,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  completionLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
  },
  completionValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.goldDark,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: `${colors.forest}10`,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },

  // -- Menus --
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 16,
    color: colors.stone,
    letterSpacing: 1.6,
    marginBottom: spacing.sm + 2,
    marginLeft: spacing.xs,
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.border}60`,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
  },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: `${colors.stone}18`,
  },
  menuIconChip: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    marginLeft: spacing.md,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 21,
    color: colors.onyx,
  },

  // -- CTA vendeur --
  sellerCta: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  sellerCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  sellerCtaIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerCtaTextBlock: {
    flex: 1,
    marginLeft: spacing.md,
  },
  sellerCtaTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.sand,
    letterSpacing: -0.2,
  },
  sellerCtaSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: `${colors.sand}A8`,
    marginTop: 2,
  },

  // -- Deconnexion --
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  logoutText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    lineHeight: 21,
    color: colors.terracotta,
    marginLeft: spacing.sm,
  },

  // -- Modal --
  modalBackdrop: {
    flex: 1,
    backgroundColor: `${colors.onyx}66`,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.sand,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalGrabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: `${colors.stone}30`,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  modalIconWrap: {
    alignSelf: 'center',
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: `${colors.forest}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.onyx,
    marginBottom: spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  modalDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 24,
    color: colors.stone,
    textAlign: 'center',
    marginBottom: spacing.xl,
    letterSpacing: 0.2,
  },
  modalConfirmButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  modalConfirmPressable: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    ...typography.button,
    color: colors.sand,
  },
  modalCancel: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalCancelText: {
    ...typography.body,
    color: colors.stone,
  },
});