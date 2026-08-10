/**
 * Parametres — notifications, securite et informations.
 *
 * Design :
 * - Header partage via components/profile/ScreenHeader
 * - Interrupteurs personnalises (motif or/foret) avec haptics
 * - Reset de mot de passe fonctionnel (email envoye via authService)
 * - Carte A propos avec version de l'application
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
import { colors, typography, spacing, radius } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';

// ============================================================
// Types & données statiques
// ============================================================

interface SettingToggle {
  readonly id: string;
  readonly label: string;
  readonly helper: string;
  readonly icon: ReactNode;
  readonly accent: string;
  readonly defaultValue: boolean;
}

const NOTIFICATION_SETTINGS: readonly SettingToggle[] = [
  {
    id: 'push',
    label: 'Notifications push',
    helper: 'Alertes importantes de l\'application',
    icon: <Bell size={19} color={colors.terracotta} strokeWidth={1.75} />,
    accent: `${colors.terracotta}12`,
    defaultValue: true,
  },
  {
    id: 'reminders',
    label: 'Rappels evenements',
    helper: 'Avant vos evenements reserves',
    icon: <CalendarClock size={19} color={colors.forest} strokeWidth={1.75} />,
    accent: `${colors.forest}12`,
    defaultValue: true,
  },
  {
    id: 'offers',
    label: 'Offres et nouveautes',
    helper: 'Recommandations et avant-premieres',
    icon: <Sparkles size={19} color={colors.goldDark} strokeWidth={1.75} />,
    accent: `${colors.goldDark}12`,
    defaultValue: false,
  },
];

// ============================================================
// Sous-composants
// ============================================================

function RowIcon({
  icon,
  accent,
}: {
  readonly icon: ReactNode;
  readonly accent: string;
}) {
  return (
    <View style={[styles.rowIcon, { backgroundColor: accent }]}>
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
          { backgroundColor: value ? colors.forest : `${colors.stone}2E` },
        ]}
      >
        {value ? (
          <View style={styles.toggleOnMark}>
            <Check size={12} color={colors.sand} strokeWidth={3} />
          </View>
        ) : null}
        <View style={[styles.toggleThumb, value ? { right: 2 } : { left: 2 }]} />
      </View>
    </Pressable>
  );
}

// ============================================================
// Ecran
// ============================================================

export default function ProfileSettingsScreen() {
  const { user } = useAuth();
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
  }, [user, notification, impact]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Parametres"
          subtitle="Notifications, securite et informations"
        />

        {resetMessage ? (
          <View style={styles.successBanner}>
            <ShieldCheck size={16} color={colors.forest} strokeWidth={1.75} />
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
                <RowIcon icon={setting.icon} accent={setting.accent} />
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
                accent={`${colors.terracotta}12`}
              />
              <View style={styles.rowTextBlock}>
                <Text style={styles.rowLabel}>Reinitialiser le mot de passe</Text>
                <Text style={styles.rowHelper}>Recevez un email de reinitialisation</Text>
              </View>
              <ChevronRight size={18} color={`${colors.stone}70`} strokeWidth={1.5} />
            </Pressable>

            <View style={styles.row}>
              <RowIcon
                icon={<ShieldCheck size={19} color={colors.forest} strokeWidth={1.75} />}
                accent={`${colors.forest}12`}
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
                icon={<Info size={19} color={colors.goldDark} strokeWidth={1.75} />}
                accent={`${colors.goldDark}12`}
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

            <Pressable
              style={styles.modalConfirmButton}
              onPress={handleResetPassword}
              disabled={isResettingPassword}
              accessibilityRole="button"
              accessibilityLabel="Envoyer le lien"
            >
              <Text style={styles.modalConfirmText}>
                {isResettingPassword ? 'Envoi en cours...' : 'Envoyer le lien'}
              </Text>
            </Pressable>

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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: `${colors.stone}18`,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextBlock: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  rowLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 21,
    color: colors.onyx,
  },
  rowHelper: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.stone,
    marginTop: 1,
  },
  securityBadge: {
    backgroundColor: `${colors.forest}12`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  securityBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 9,
    lineHeight: 12,
    color: colors.forest,
    letterSpacing: 1.2,
  },
  versionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
  },

  // Toggle
  toggleTrack: {
    width: 46,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  toggleThumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
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
    backgroundColor: `${colors.forest}10`,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.forest}25`,
  },
  successText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.forest,
    marginLeft: spacing.sm,
  },

  // Modal
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
    backgroundColor: `${colors.terracotta}12`,
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
    fontSize: 14,
    lineHeight: 22,
    color: colors.stone,
    textAlign: 'center',
    marginBottom: spacing.xl,
    letterSpacing: 0.2,
  },
  modalEmail: {
    fontFamily: 'Inter-SemiBold',
    color: colors.onyx,
  },
  modalConfirmButton: {
    backgroundColor: colors.terracotta,
    borderRadius: radius.lg,
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