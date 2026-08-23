/**
 * Parametres — notifications, securite et informations.
 *
 * Design « Noir & Or » :
 * - Header partage via components/profile/ScreenHeader (degrade noir + halo)
 * - Sections avec titres overline dorés + cartes verre fumé
 * - Interrupteurs personnalises : piste or champagne quand actif
 * - Reset de mot de passe fonctionnel (email envoye via authService)
 * - Modal sombre premium, Carte A propos avec version de l'application
 *
 * Conventions :
 * - Toutes les couleurs viennent de lib/constants.ts
 * - Pas de type any, pas d'emojis, imports @/
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
} from 'react-native';
import Constants from 'expo-constants';
import {
  Bell,
  CalendarClock,
  Sparkles,
  KeyRound,
  ShieldCheck,
  Info,
  ChevronRight,
  Check,
} from 'lucide-react-native';

import { ScreenHeader } from '@/components/profile/ScreenHeader';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { Button } from '@/components/ui/Button';
import { colors, typography, spacing, radius, shadows } from '@/lib/constants';
import { clientBackgrounds } from '@/lib/images';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuth } from '@/hooks/useAuth';
import { useAuthService } from '@/services/auth.service';

// Types & données statiques
// ============================================================

interface SettingToggle {
  readonly id: string;
  readonly label: string;
  readonly helper: string;
  readonly icon: ReactNode;
  readonly defaultValue: boolean;
}

const NOTIFICATION_SETTINGS: readonly SettingToggle[] = [
  {
    id: 'push',
    label: 'Notifications push',
    helper: 'Alertes importantes de l\'application',
    icon: <Bell size={19} color={colors.terracotta} strokeWidth={1.75} />,
    defaultValue: true,
  },
  {
    id: 'reminders',
    label: 'Rappels evenements',
    helper: 'Avant vos evenements reserves',
    icon: <CalendarClock size={19} color={colors.forest} strokeWidth={1.75} />,
    defaultValue: true,
  },
  {
    id: 'offers',
    label: 'Offres et nouveautes',
    helper: 'Recommandations et avant-premieres',
    icon: <Sparkles size={19} color={colors.gold} strokeWidth={1.75} />,
    defaultValue: false,
  },
];

// ============================================================
// Sous-composants
// ============================================================

function RowIcon({ icon }: { readonly icon: ReactNode }) {
  return (
    <View style={styles.rowIcon}>
      {icon}
    </View>
  );
}

function Toggle({
  value,
  onPress,
  accessibilityLabel,
}: {
  readonly value: boolean;
  readonly onPress: () => void;
  readonly accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
    >
      <View
        style={[
          styles.toggleTrack,
          value
            ? { backgroundColor: colors.gold, borderColor: `${colors.goldBright}66` }
            : { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: colors.borderStrong },
        ]}
      >
        {value ? (
          <View style={styles.toggleOnMark}>
            <Check size={12} color={colors.onyx} strokeWidth={3} />
          </View>
        ) : null}
        <View
          style={[
            styles.toggleThumb,
            value ? { right: 2, backgroundColor: colors.onyx } : { left: 2, backgroundColor: colors.textSecondary },
          ]}
        />
      </View>
    </Pressable>
  );
}

// ============================================================
// Ecran
// ============================================================

export default function ProfileSettingsScreen() {
  const { user } = useAuth();
  const authService = useAuthService();
  const { impact, notification } = useHaptics();

  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      NOTIFICATION_SETTINGS.map((setting) => [setting.id, setting.defaultValue])
    )
  );

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const handleToggle = useCallback(
    (id: string) => {
      impact('light');
      setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
    },
    [impact]
  );

  const handleResetPassword = useCallback(async () => {
    if (!user?.email) return;
    setIsResettingPassword(true);
    impact('medium');

    const result = await authService.resetPassword(user.email);

    if (result.error) {
      notification('error');
    } else {
      notification('success');
      setResetMessage(
        `Un email de reinitialisation a ete envoye a ${user.email}.`
      );
      setShowPasswordModal(false);
    }

    setIsResettingPassword(false);
  }, [user, notification, impact, authService]);

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Parametres"
          subtitle="Notifications, securite et informations"
          background={clientBackgrounds.fallback}
        />

        {resetMessage ? (
          <View style={styles.successBanner}>
            <ShieldCheck size={16} color={colors.success} strokeWidth={1.75} />
            <Text style={styles.successText}>{resetMessage}</Text>
          </View>
        ) : null}

        {/* ============================================
            Notifications
            ============================================ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
          <View style={styles.menuCard}>
            {NOTIFICATION_SETTINGS.map((setting, index) => (
              <View
                key={setting.id}
                style={[
                  styles.row,
                  index < NOTIFICATION_SETTINGS.length - 1 ? styles.rowBorder : null,
                ]}
              >
                <RowIcon icon={setting.icon} />
                <View style={styles.rowTextBlock}>
                  <Text style={styles.rowLabel}>{setting.label}</Text>
                  <Text style={styles.rowHelper}>{setting.helper}</Text>
                </View>
                <Toggle
                  value={toggles[setting.id]}
                  onPress={() => handleToggle(setting.id)}
                  accessibilityLabel={setting.label}
                />
              </View>
            ))}
          </View>
        </View>

        {/* ============================================
            Securite
            ============================================ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SECURITE</Text>
          <View style={styles.menuCard}>
            <Pressable
              style={[styles.row, styles.rowBorder]}
              onPress={() => {
                impact('light');
                setShowPasswordModal(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Reinitialiser le mot de passe"
            >
              <RowIcon
                icon={<KeyRound size={19} color={colors.terracotta} strokeWidth={1.75} />}
              />
              <View style={styles.rowTextBlock}>
                <Text style={styles.rowLabel}>Reinitialiser le mot de passe</Text>
                <Text style={styles.rowHelper}>Recevez un email de reinitialisation</Text>
              </View>
              <ChevronRight size={18} color={colors.goldMuted} strokeWidth={1.5} />
            </Pressable>

            <View style={styles.row}>
              <RowIcon
                icon={<ShieldCheck size={19} color={colors.success} strokeWidth={1.75} />}
              />
              <View style={styles.rowTextBlock}>
                <Text style={styles.rowLabel}>Compte protege</Text>
                <Text style={styles.rowHelper}>
                  Session securisee et donnees chiffrees
                </Text>
              </View>
              <View style={styles.securityBadge}>
                <Text style={styles.securityBadgeText}>ACTIF</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================
            A propos
            ============================================ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>A PROPOS</Text>
          <View style={styles.menuCard}>
            <View style={[styles.row, styles.rowBorder]}>
              <RowIcon
                icon={<Info size={19} color={colors.gold} strokeWidth={1.75} />}
              />
              <View style={styles.rowTextBlock}>
                <Text style={styles.rowLabel}>Version de l'application</Text>
                <Text style={styles.rowHelper}>Rivald'event</Text>
              </View>
              <Text style={styles.versionText}>v{appVersion}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ============================================
          Modal — confirmation reset mot de passe
          ============================================ */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowPasswordModal(false)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalGrabber} />

            <View style={styles.modalIconWrap}>
              <KeyRound size={24} color={colors.terracotta} strokeWidth={1.75} />
            </View>

            <Text style={styles.modalTitle}>Reinitialiser le mot de passe</Text>
            <Text style={styles.modalDescription}>
              Un email avec un lien de reinitialisation sera envoye a{' '}
              <Text style={styles.modalEmail}>{user?.email}</Text>. Veuillez
              verifier votre boite de reception.
            </Text>

            <View style={styles.modalConfirmWrap}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={isResettingPassword}
                onPress={handleResetPassword}
              >
                {isResettingPassword ? 'Envoi en cours...' : 'Envoyer le lien'}
              </Button>
            </View>

            <Pressable
              style={styles.modalCancel}
              onPress={() => setShowPasswordModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Annuler"
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScreenBackground>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionLabel: {
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextBlock: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  rowLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
  rowHelper: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: 1,
  },
  securityBadge: {
    backgroundColor: 'rgba(216,180,90,0.12)',
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  securityBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    lineHeight: 12,
    color: colors.goldBright,
    letterSpacing: 1.2,
  },
  versionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  // Toggle
  toggleTrack: {
    width: 46,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
  },
  toggleThumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.onyx,
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleOnMark: {
    position: 'absolute',
    left: 6,
    top: 7,
    zIndex: 1,
  },

  // Banniere succes
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(91,196,139,0.10)',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(91,196,139,0.35)',
  },
  successText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.success,
    marginLeft: spacing.sm,
  },

  // Modal
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
    backgroundColor: 'rgba(201,96,63,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(201,96,63,0.35)',
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
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    letterSpacing: 0.2,
  },
  modalEmail: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.goldBright,
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