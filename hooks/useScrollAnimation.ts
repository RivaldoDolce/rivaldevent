/**
 * Hook pour les animations de scroll (parallax, header collapse, sticky tabs).
 *
 * Utilise Animated natif RN (pas reanimated — cause erreur TurboModule avec Expo Go).
 * Conformement au handoff section 8.6 : "ne PAS en ajouter de nouveau".
 *
 * @example
 * const { scrollY, onScroll } = useScrollAnimation();
 * <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16}>
 */

import { useRef } from 'react';
import { Animated, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

interface ScrollAnimationOptions {
  readonly onScroll?: (offsetY: number) => void;
  readonly threshold?: number;
}

export function useScrollAnimation(_options?: ScrollAnimationOptions) {
  const scrollY = useRef(new Animated.Value(0)).current;

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        _options?.onScroll?.(event.nativeEvent.contentOffset.y);
      },
    }
  );

  return { scrollY, onScroll };
}
