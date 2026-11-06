/**
 * NotificationsPanel — panneau de notifications « Noir & Or ».
 *
 * - Panneau glissant sombre : surface ornée, coins arrondis bas, filet doré
 * - Entête Playfair avec « Tout lire » ghost doré + fermeture pastille verre
 * - Items : médaillon icône verre + titre ivoire + description tamisée + heure
 * - Non-lu : filet latéral or + point doré
 * - Fermeture par tap sur overlay ou bouton
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Heart,
  CalendarDays,
  Ticket,
  TrendingUp,
  Bell,
  CheckCheck,
} from 'lucide-react-native';

import { colors, spacing, radius, shadows, typography } from '@/lib/constants';
import { LinearGradient } from 'expo-linear-gradient';

// ============================================================
// Types
// ============================================================

type NotificationType = 'favorite' | 'event_reminder' | 'ticket' | 'trending' | 'price_drop' | 'event_update';

interface NotificationItem {
  readonly id: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly description: string;
  readonly date: string;
  isRead: boolean;
  readonly image?: string;
  readonly eventId?: string;
}

interface NotificationsPanelProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onNotificationPress?: (notification: NotificationItem) => void;
  readonly onReadCountChange?: (unreadCount: number) => void;
  readonly testID?: string;
}

// ============================================================
// Donnees mock (en attendant le branchement Supabase)
// ============================================================

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'favorite',
    title: 'Soiree Afrobeats demain !',
    description: 'L\'evenement que vous avez mis en favori commence demain a 20h00.',
    date: 'Il y a 2h',
    isRead: false,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    eventId: '1',
  },
  {
    id: 'notif-2',
    type: 'price_drop',
    title: 'Baisse de prix',
    description: 'Le prix de "Conference Tech Douala" a baisse ! Profitez-en.',
    date: 'Il y a 5h',
    isRead: false,
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
    eventId: '3',
  },
  {
    id: 'notif-3',
    type: 'event_reminder',
    title: 'Rappel : Festival Nguon',
    description: 'Le Festival Culturel Nguon 2026 commence dans 3 jours. Preparez-vous !',
    date: 'Il y a 1j',
    isRead: false,
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400',
    eventId: '2',
  },
  {
    id: 'notif-4',
    type: 'trending',
    title: 'Tendance en ce moment',
    description: 'Le Gala de Charite 2026 est en pleine tendance ! Ne manquez pas cet evenement exclusif.',
    date: 'Il y a 2j',
    isRead: true,
    image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400',
    eventId: '6',
  },
  {
    id: 'notif-5',
    type: 'ticket',
    title: 'Votre billet est pret',
    description: 'Votre billet pour "Match Football Classique" est disponible dans l\'application.',
    date: 'Il y a 3j',
    isRead: true,
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
    eventId: '4',
  },
];

// ============================================================
// Icone par type — couleurs sémantiques sur fond sombre
// ============================================================

const TYPE_ICON_COLOR: Record<NotificationType, string> = {
  favorite: colors.terracotta,
  event_reminder: colors.info,
  ticket: colors.goldBright,
  trending: colors.goldBright,
  price_drop: colors.warning,
  event_update: colors.info,
};

function getNotificationIcon(type: NotificationType): React.ReactNode {
  const iconSize = 15;
  const iconColor = TYPE_ICON_COLOR[type];
  switch (type) {
    case 'favorite':
      return <Heart size={iconSize} color={iconColor} fill={iconColor} strokeWidth={2} />;
    case 'event_reminder':
      return <CalendarDays size={iconSize} color={iconColor} strokeWidth={2} />;
    case 'ticket':
      return <Ticket size={iconSize} color={iconColor} strokeWidth={2} />;
    case 'trending':
      return <TrendingUp size={iconSize} color={iconColor} strokeWidth={2} />;
    case 'price_drop':
      return <TrendingUp size={iconSize} color={iconColor} style={{ transform: [{ rotate: '180deg' }] }} strokeWidth={2} />;
    case 'event_update':
      return <CalendarDays size={iconSize} color={iconColor} strokeWidth={2} />;
    default:
      return <Bell size={iconSize} color={iconColor} strokeWidth={2} />;
  }
}

function getNotificationIconBg(type: NotificationType): string {
  switch (type) {
    case 'favorite':
      return 'rgba(201,96,63,0.16)';
    case 'event_reminder':
      return 'rgba(127,167,206,0.14)';
    case 'ticket':
      return 'rgba(216,180,90,0.14)';
    case 'trending':
      return 'rgba(216,180,90,0.14)';
    case 'price_drop':
      return 'rgba(232,182,76,0.14)';
    case 'event_update':
      return 'rgba(127,167,206,0.14)';
    default:
      return 'rgba(255,255,255,0.06)';
  }
}

// ============================================================
// Constantes
// ============================================================

const SCREEN_HEIGHT = Dimensions.get('window').height;
const PANEL_HEIGHT = SCREEN_HEIGHT * 0.75;
const ITEM_IMAGE_SIZE = 42;
const ICON_CONTAINER_SIZE = 40;

// ============================================================
// Composant
// ============================================================

export const NotificationsPanel = React.memo(function NotificationsPanel({
  visible,
  onClose,
  onNotificationPress,
  onReadCountChange,
  testID,
}: NotificationsPanelProps) {
  const slideAnim = useRef(new Animated.Value(-PANEL_HEIGHT)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // Etat local des notifications (pour gerer le marquage comme lu)
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    () => [...INITIAL_NOTIFICATIONS],
  );

  // Compter les non lues et notifier le parent
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    onReadCountChange?.(unreadCount);
  }, [unreadCount, onReadCountChange]);

  // Reinitialiser quand le panneau s'ouvre
  useEffect(() => {
    if (visible) {
      setNotifications([...INITIAL_NOTIFICATIONS]);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 120,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: -PANEL_HEIGHT,
          damping: 20,
          stiffness: 120,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, overlayAnim]);

  // -- Marquer une notification comme lue --
  const handleNotificationPress = useCallback(
    (notification: NotificationItem) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n,
        ),
      );
      onNotificationPress?.(notification);
    },
    [onNotificationPress],
  );

  // -- Tout marquer comme lu --
  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true })),
    );
  }, []);

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 999, elevation: 999 }]} testID={testID}>
      {/* Overlay */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.onyx, opacity: overlayAnim }]} pointerEvents={visible ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      {/* Panel */}
      <Animated.View style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient
          colors={[colors.elevated, colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.panelGradient}
          pointerEvents="none"
        />
        <View pointerEvents="none" style={styles.panelGlow} />
        <View pointerEvents="none" style={styles.panelRing} />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerOverline}>CENTRE DE NOTIFICATIONS</Text>
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            {/* Bouton tout marquer comme lu */}
            {unreadCount > 0 && (
              <Pressable
                onPress={handleMarkAllRead}
                style={styles.markAllButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Tout marquer comme lu"
              >
                <CheckCheck size={14} color={colors.goldBright} strokeWidth={2} />
                <Text style={styles.markAllText}>Tout lire</Text>
              </Pressable>
            )}

            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Fermer les notifications"
            >
              <X size={18} color={colors.goldBright} strokeWidth={1.75} />
            </Pressable>
          </View>
        </View>

        {/* Scroll */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyMedallion}>
                <Bell size={26} color={colors.goldMuted} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>Aucune notification</Text>
              <Text style={styles.emptyDesc}>
                Vos alertes pour les evenements favoris, rappels et mises a jour apparaitront ici.
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <Pressable
                key={notification.id}
                style={[
                  styles.item,
                  !notification.isRead ? styles.itemUnread : undefined,
                ]}
                onPress={() => handleNotificationPress(notification)}
              >
                {/* Médaillon icône verre */}
                <View style={[styles.iconContainer, { backgroundColor: getNotificationIconBg(notification.type) }]}>
                  {notification.image ? (
                    <>
                      <Image
                        source={{ uri: notification.image }}
                        style={styles.itemImage}
                        contentFit="cover"
                        transition={300}
                        cachePolicy="memory-disk"
                      />
                      <View
                        style={[
                          styles.iconMini,
                          { backgroundColor: 'rgba(14,12,10,0.92)' },
                        ]}
                      >
                        {getNotificationIcon(notification.type)}
                      </View>
                    </>
                  ) : (
                    getNotificationIcon(notification.type)
                  )}
                </View>

                {/* Contenu */}
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle} numberOfLines={2}>{notification.title}</Text>
                  <Text style={styles.itemDescription} numberOfLines={2}>{notification.description}</Text>
                  <Text style={styles.itemDate}>{notification.date}</Text>
                </View>

                {/* Point non lu */}
                {!notification.isRead && <View style={styles.unreadDot} pointerEvents="none" />}
              </Pressable>
            ))
          )}

          {/* Espace bas */}
          <View style={{ height: insets.bottom + spacing.lg }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
});

// ============================================================
// Styles
// ============================================================

const styles = {
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    backgroundColor: colors.elevated,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: `${colors.gold}30`,
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  } as ViewStyle,
  panelGradient: {
    ...StyleSheet.absoluteFillObject,
  } as ViewStyle,
  panelGlow: {
    position: 'absolute',
    top: -110,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(216,180,90,0.07)',
  } as ViewStyle,
  panelRing: {
    position: 'absolute',
    top: -80,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1.5,
    borderColor: `${colors.gold}26`,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.gold}1F`,
  } as ViewStyle,
  headerTitleBlock: {
    flex: 1,
  } as ViewStyle,
  headerOverline: {
    ...typography.overline,
    color: colors.goldMuted,
    marginBottom: 2,
  } as TextStyle,
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    letterSpacing: -0.3,
  } as TextStyle,
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    backgroundColor: 'rgba(216,180,90,0.08)',
  } as ViewStyle,
  markAllText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.goldBright,
  } as TextStyle,
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  } as ViewStyle,
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
  } as ViewStyle,
  emptyMedallion: {
    width: 72,
    height: 72,
    borderRadius: radius.xxl,
    backgroundColor: colors.glassGold,
    borderWidth: 1,
    borderColor: colors.borderGold,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.goldGlowSoft,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    marginTop: spacing.lg,
  } as TextStyle,
  emptyDesc: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  } as TextStyle,
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  } as ViewStyle,
  itemUnread: {
    backgroundColor: 'rgba(216,180,90,0.06)',
    borderColor: `${colors.gold}30`,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  } as ViewStyle,
  itemImage: {
    width: ITEM_IMAGE_SIZE,
    height: ITEM_IMAGE_SIZE,
    borderRadius: radius.md,
    overflow: 'hidden',
  } as ImageStyle,
  iconContainer: {
    width: ICON_CONTAINER_SIZE,
    height: ICON_CONTAINER_SIZE,
    borderRadius: ICON_CONTAINER_SIZE / 2,
    borderWidth: 1,
    borderColor: `${colors.gold}26`,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  } as ViewStyle,
  iconMini: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${colors.gold}26`,
  } as ViewStyle,
  itemContent: {
    flex: 1,
    marginLeft: spacing.md,
  } as ViewStyle,
  itemTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    marginBottom: 2,
  } as TextStyle,
  itemDescription: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.xs,
  } as TextStyle,
  itemDate: {
    ...typography.overline,
    fontSize: 10,
    lineHeight: 14,
    color: colors.goldMuted,
  } as TextStyle,
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  } as ViewStyle,
} as const;