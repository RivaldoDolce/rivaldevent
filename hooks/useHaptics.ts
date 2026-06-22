/**
 * Hook pour les retours haptiques.
 * Encapsule expo-haptics avec une API simple et typée.
 *
 * Règle : tout bouton doit déclencher un haptic light au press.
 * Les actions importantes (succès/erreur) utilisent notification haptics.
 */

import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

type ImpactStyle = 'light' | 'medium' | 'heavy';
type NotificationType = 'success' | 'warning' | 'error';

const IMPACT_MAP: Record<ImpactStyle, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

const NOTIFICATION_MAP: Record<
  NotificationType,
  Haptics.NotificationFeedbackType
> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
};

/**
 * Retourne des callbacks stables pour déclencher des haptics.
 * Les callbacks sont wrappés dans useCallback pour éviter les re-renders.
 */
export function useHaptics() {
  const impact = useCallback((style: ImpactStyle = 'light') => {
    Haptics.impactAsync(IMPACT_MAP[style]).catch(() => {
      // Silent fail : haptics peut ne pas être disponible (simulator)
    });
  }, []);

  const notification = useCallback((type: NotificationType) => {
    Haptics.notificationAsync(NOTIFICATION_MAP[type]).catch(() => {
      // Silent fail
    });
  }, []);

  const selection = useCallback(() => {
    Haptics.selectionAsync().catch(() => {
      // Silent fail
    });
  }, []);

  return { impact, notification, selection };
}