/**
 * Hook pour les animations de scroll (parallax, header collapse, sticky tabs).
 *
 * Utilise useAnimatedScrollHandler de Reanimated v3 (UI thread, 120fps iOS).
 * Jamais de Animated.event ou de JS-thread scroll handler.
 */

import { useAnimatedScrollHandler, useSharedValue, type SharedValue } from 'react-native-reanimated';

interface ScrollAnimationOptions {
  readonly onScroll?: (offsetY: number) => void;
  readonly threshold?: number;
}


/**
 * Retourne un scrollHandler compatible avec Animated.ScrollView / FlashList.
 * Le handler tourne 100% sur le UI thread.
 *
 * @example
 * const { scrollHandler, scrollY } = useScrollAnimation();
 * <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
 */
export function useScrollAnimation(_options?: ScrollAnimationOptions) {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return { scrollHandler, scrollY };
}

// Re-export pour usage externe
export type { SharedValue };