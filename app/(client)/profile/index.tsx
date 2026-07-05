/**
 * Profil (mode acheteur) - segmented control + switch vendeur.
 *
 * Design :
 * - Segmented control en haut (Acheteur | Vendeur)
 * - Avatar + informations utilisateur
 * - Menu : modifier profil, parametres, aide, deconnexion
 * - Tap sur "Vendeur" → modal de confirmation → switch
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LogOut,
  ChevronRight,
  User,
  Settings,
  HelpCircle,
  Shield,
} from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import { useAppMode } from '@/stores/app-mode';
import type { AppMode } from '@/stores/app-mode';
import { authService } from '@/services/auth.service';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, typography, spacing, radius } from '@/lib/constants';



interface MenuItem {
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly onPress?: () => void;
  readonly color?: string;
}

export default function ClientProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const { mode } = useAppMode();
  const setMode = useAppMode((state: { setMode: (v: AppMode) => void }) => state.setMode);
  const { impact, notification } = useHaptics();

  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || '';
  const displayEmail = user?.email || '';
  const displayPhone = profile?.phone ? `+237 ${profile.phone}` : '';

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

  const menuItems: readonly MenuItem[] = [
    { label: 'Modifier mon profil', icon: <User color={colors.stone} size={20} strokeWidth={1.5} /> },
    { label: 'Parametres', icon: <Settings color={colors.stone} size={20} strokeWidth={1.5} /> },
    { label: 'Aide et support', icon: <HelpCircle color={colors.stone} size={20} strokeWidth={1.5} /> },
    { label: 'Confidentialite', icon: <Shield color={colors.stone} size={20} strokeWidth={1.5} /> },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.sand }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Segmented Control */}
        <View style={styles.segmentedWrapper}>
          <View style={styles.segmentedContainer}>
            <Pressable
              style={[styles.segment, mode === 'buyer' ? styles.segmentActive : null]}
              onPress={() => impact('light')}
            >
              <Text style={[styles.segmentText, mode === 'buyer' ? styles.segmentTextActive : null]}>
                Acheteur
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segment, mode === 'seller' ? styles.segmentActiveSeller : null]}
              onPress={() => {
                impact('light');
                setShowSwitchModal(true);
              }}
            >
              <Text style={[styles.segmentText, mode === 'seller' ? styles.segmentTextActiveSeller : null]}>
                Vendeur
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Avatar + Infos */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {displayName ? displayName.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.profileName}>{displayName || 'Utilisateur'}</Text>
          <Text style={styles.profileEmail}>{displayEmail}</Text>
          {displayPhone ? (
            <Text style={styles.profilePhone}>{displayPhone}</Text>
          ) : null}
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item) => (
            <Pressable
              key={item.label}
              style={styles.menuItem}
              onPress={() => {
                impact('light');
                item.onPress?.();
              }}
            >
              {item.icon}
              <Text style={styles.menuLabel}>{item.label}</Text>
              <ChevronRight color={`${colors.stone}60`} size={18} strokeWidth={1.5} />
            </Pressable>
          ))}
        </View>

        {/* Deconnexion */}
        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut color={colors.terracotta} size={20} strokeWidth={1.5} />
          <Text style={styles.logoutText}>
            {isLoggingOut ? 'Deconnexion...' : 'Se deconnecter'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Modal de confirmation switch vendeur */}
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
            <Text style={styles.modalTitle}>Passer en mode Vendeur</Text>
            <Text style={styles.modalDescription}>
              Accedez a vos outils de creation d'evenements, gestion des billets et suivi de vos ventes.
            </Text>

            <Pressable
              style={styles.modalConfirmButton}
              onPress={handleSwitchMode}
              disabled={isSwitching}
            >
              {isSwitching ? (
                <Text style={styles.modalConfirmText}>Changement en cours...</Text>
              ) : (
                <Text style={styles.modalConfirmText}>Confirmer le changement</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.modalCancel}
              onPress={() => setShowSwitchModal(false)}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },

  // Segmented Control
  segmentedWrapper: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: colors.ivory,
    borderRadius: radius.lg,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.sand,
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentActiveSeller: {
    backgroundColor: colors.sand,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    ...typography.bodySmall,
    color: colors.stone,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: colors.terracotta,
    fontWeight: '600',
  },
  segmentTextActiveSeller: {
    color: colors.forest,
    fontWeight: '600',
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${colors.terracotta}15`,
    borderWidth: 2,
    borderColor: `${colors.terracotta}30`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarInitial: {
    ...typography.h2,
    color: colors.terracotta,
    fontWeight: '700',
  },
  profileName: {
    ...typography.h3,
    color: colors.onyx,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    ...typography.bodySmall,
    color: colors.stone,
  },
  profilePhone: {
    ...typography.caption,
    color: colors.stone,
    marginTop: 2,
  },

  // Menu
  menu: {
    backgroundColor: colors.ivory,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: `${colors.stone}20`,
  },
  menuLabel: {
    ...typography.body,
    color: colors.onyx,
    flex: 1,
    marginLeft: spacing.md,
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  logoutText: {
    ...typography.body,
    color: colors.terracotta,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 24, 22, 0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.sand,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.onyx,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalDescription: {
    ...typography.body,
    color: colors.stone,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  modalConfirmButton: {
    backgroundColor: colors.forest,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
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