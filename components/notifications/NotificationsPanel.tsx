/**
 * NotificationsPanel - Panneau de notifications glissant depuis le haut.
 *
 * Design "Minimalisme Africain Camerounais" :
 * - Fond sable avec overlay semi-transparent
 * - Entete "Notifications" en PlayfairDisplay-Bold
 * - Items avec icone, titre, description, date
 * - Badge non lu (point terracotta)
 * - Fermeture par tap sur overlay ou bouton
 * - Bouton "Tout marquer comme lu"
 *
 * Conventions :
 * - expo-image pour les images
 * - lucide-react-native pour les icones
 * - Animated natif (pas reanimated)
 * - Pas de type any, pas d'emojis
 * - Design tokens depuis lib/constants.ts
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

import { colors, spacing, radii, shadows, typography } from '@/lib/constants';

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
// Icone par type
// ============================================================

function getNotificationIcon(type: NotificationType): React.ReactNode {
  const iconSize = 16;
  const iconColor = colors.white;
  switch (type) {
    case 'favorite':
      return <Heart size={iconSize} color={iconColor} fill={colors.terracotta} strokeWidth={2} />;
    case 'event_reminder':
      return <CalendarDays size={iconSize} color={iconColor} strokeWidth={2} />;
    case 'ticket':
      return <Ticket size={iconSize} color={iconColor} strokeWidth={2} />;
    case 'trending':
      return <TrendingUp size={iconSize} color={iconColor} strokeWidth={2} />;
    case 'price_drop':
      return <TrendingUp size={iconSize} color={colors.white} style={{ transform: [{ rotate: '180deg' }] }} strokeWidth={2} />;
    case 'event_update':
      return <CalendarDays size={iconSize} color={iconColor} strokeWidth={2} />;
    default:
      return <Bell size={iconSize} color={iconColor} strokeWidth={2} />;
  }
}

function getNotificationIconBg(type: NotificationType): string {
  switch (type) {
    case 'favorite':
      return colors.terracotta;
    case 'event_reminder':
      return colors.forest;
    case 'ticket':
      return colors.indigo;
    case 'trending':
      return colors.gold;
    case 'price_drop':
      return colors.mango;
    case 'event_update':
      return colors.forest;
    default:
      return colors.stone;
  }
}

// ============================================================
// Constantes
// ============================================================

const SCREEN_HEIGHT = Dimensions.get('window').height;
const PANEL_HEIGHT = SCREEN_HEIGHT * 0.75;
const ITEM_IMAGE_SIZE = 48;
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
          toValue: 0.4,
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

  const headerTitleStyle: TextStyle = {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    color: colors.onyx,
    letterSpacing: -0.5,
  };

  const markAllButtonStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  };

  const markAllTextStyle: TextStyle = {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.terracotta,
    fontStyle: 'italic',
  };

  const closeButtonStyle: ViewStyle = {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ivory,
    justifyContent: 'center',
    alignItems: 'center',
  };

  const scrollContentStyle: ViewStyle = {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  };

  const emptyStateStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
  };

  const emptyTitleStyle: TextStyle = {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 18,
    color: colors.onyx,
    marginTop: spacing.lg,
  };

  const emptyDescStyle: TextStyle = {
    ...typography.bodySmall,
    color: colors.stone,
    textAlign: 'center',
    marginTop: spacing.sm,
  };

  const notificationItemStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  };

  const unreadItemStyle: ViewStyle = {
    borderLeftWidth: 3,
    borderLeftColor: colors.terracotta,
  };

  const imageStyle: ImageStyle = {
    width: ITEM_IMAGE_SIZE,
    height: ITEM_IMAGE_SIZE,
    borderRadius: radii.md,
    overflow: 'hidden',
  };

  const iconContainerStyle = (type: NotificationType): ViewStyle => ({
    width: ICON_CONTAINER_SIZE,
    height: ICON_CONTAINER_SIZE,
    borderRadius: ICON_CONTAINER_SIZE / 2,
    backgroundColor: getNotificationIconBg(type),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  });

  const contentStyle: ViewStyle = {
    flex: 1,
    marginLeft: spacing.md,
  };

  const titleStyle: TextStyle = {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onyx,
    marginBottom: spacing.xs / 2,
  };

  const descriptionStyle: TextStyle = {
    ...typography.caption,
    color: colors.stone,
    lineHeight: 18,
    marginBottom: spacing.xs,
  };

  const dateStyle: TextStyle = {
    ...typography.overline,
    color: colors.muted,
    fontSize: 10,
  };

  const unreadDotStyle: ViewStyle = {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.terracotta,
    position: 'absolute',
    top: 12,
    right: 12,
  };

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 999, elevation: 999 }]} testID={testID}>
      {/* Overlay */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.onyx, opacity: overlayAnim }]} pointerEvents={visible ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      {/* Panel */}
      <Animated.View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: PANEL_HEIGHT,
        backgroundColor: colors.sand,
        borderBottomLeftRadius: radii.xxl,
        borderBottomRightRadius: radii.xxl,
        shadowColor: colors.onyx,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        transform: [{ translateY: slideAnim }],
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: insets.top + spacing.md,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: `${colors.stone}15`,
        }}>
          <Text style={headerTitleStyle}>Notifications</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            {/* Bouton tout marquer comme lu */}
            {unreadCount > 0 && (
              <Pressable
                onPress={handleMarkAllRead}
                style={markAllButtonStyle}
                accessibilityRole="button"
                accessibilityLabel="Tout marquer comme lu"
              >
                <CheckCheck size={15} color={colors.terracotta} strokeWidth={2} />
                <Text style={markAllTextStyle}>Tout lire</Text>
              </Pressable>
            )}

            <Pressable
              style={closeButtonStyle}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer les notifications"
            >
              <X size={18} color={colors.onyx} strokeWidth={1.5} />
            </Pressable>
          </View>
        </View>

        {/* Scroll */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={scrollContentStyle}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length === 0 ? (
            <View style={emptyStateStyle}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${colors.terracotta}10`, justifyContent: 'center', alignItems: 'center' }}>
                <Bell size={28} color={colors.terracotta} strokeWidth={1.5} />
              </View>
              <Text style={emptyTitleStyle}>Aucune notification</Text>
              <Text style={emptyDescStyle}>
                Vos alertes pour les evenements favoris, rappels et mises a jour apparaitront ici.
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <Pressable
                key={notification.id}
                style={[
                  notificationItemStyle,
                  !notification.isRead ? unreadItemStyle : undefined,
                ]}
                onPress={() => handleNotificationPress(notification)}
              >
                {/* Image */}
                {notification.image ? (
                  <View style={iconContainerStyle(notification.type)}>
                    <Image
                      source={{ uri: notification.image }}
                      style={imageStyle}
                      contentFit="cover"
                      transition={300}
                      cachePolicy="memory-disk"
                    />
                    <View style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: getNotificationIconBg(notification.type),
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor: colors.white,
                    }}>
                      {getNotificationIcon(notification.type)}
                    </View>
                  </View>
                ) : (
                  <View style={iconContainerStyle(notification.type)}>
                    {getNotificationIcon(notification.type)}
                  </View>
                )}

                {/* Contenu */}
                <View style={contentStyle}>
                  <Text style={titleStyle} numberOfLines={2}>{notification.title}</Text>
                  <Text style={descriptionStyle} numberOfLines={2}>{notification.description}</Text>
                  <Text style={dateStyle}>{notification.date}</Text>
                </View>

                {/* Point non lu */}
                {!notification.isRead && <View style={unreadDotStyle} pointerEvents="none" />}
              </Pressable>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
});