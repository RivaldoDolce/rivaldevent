import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform, StyleSheet, Animated, Easing, InteractionManager } from 'react-native';
import { useNavigation, usePathname } from 'expo-router';

import { LoadingScreen } from './LoadingScreen';

interface RouteTransitionContextValue {
  readonly startLoading: () => number;
  readonly finishLoadingWhenReady: (token: number) => void;
}

interface RouteTransitionProviderProps {
  readonly children: ReactNode;
}

type TransitionEventName = 'transitionStart' | 'transitionEnd' | 'focus';

interface TransitionNavigation {
  readonly addListener: (
    eventName: TransitionEventName,
    listener: () => void,
  ) => () => void;
}

const RouteTransitionContext = createContext<RouteTransitionContextValue | null>(null);

export function RouteTransitionProvider({ children }: RouteTransitionProviderProps) {
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const nextToken = useRef(1);
  const activeTokens = useRef(new Set<number>());

  const isWeb = Platform.OS === 'web';

  const hideIfIdle = useCallback(() => {
    if (isWeb || activeTokens.current.size > 0) return;

    Animated.timing(opacity, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && activeTokens.current.size === 0) {
        setVisible(false);
      }
    });
  }, [opacity]);

  const finishLoading = useCallback((token: number) => {
    activeTokens.current.delete(token);
    hideIfIdle();
  }, [hideIfIdle]);

  const finishLoadingWhenReady = useCallback((token: number) => {
    InteractionManager.runAfterInteractions(() => finishLoading(token));
  }, [finishLoading]);

  const startLoading = useCallback(() => {
    if (isWeb) return 0;
    const token = nextToken.current;
    nextToken.current += 1;
    activeTokens.current.add(token);

    setVisible(true);
    opacity.stopAnimation();
    Animated.timing(opacity, {
      toValue: 1,
      duration: 120,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    return token;
  }, [opacity]);

  const value = useMemo(
    () => ({ startLoading, finishLoadingWhenReady }),
    [finishLoadingWhenReady, startLoading],
  );

  return (
    <RouteTransitionContext.Provider value={value}>
      {children}
      {!isWeb && visible ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.overlay, { opacity }]}>
          <LoadingScreen />
        </Animated.View>
      ) : null}
    </RouteTransitionContext.Provider>
  );
}

function useRouteTransitionLoaderControls() {
  const context = useContext(RouteTransitionContext);

  if (!context) {
    throw new Error('RouteTransitionProvider est requis autour de RouteTransitionLoader.');
  }

  return context;
}

export function RouteTransitionEvents() {
  const navigation = useNavigation<TransitionNavigation>();
  const { finishLoadingWhenReady } = useRouteTransitionLoaderControls();
  const transitionToken = useRef<number | null>(null);

  useEffect(() => {
    const handleEnd = () => {
      if (transitionToken.current === null) return;
      const token = transitionToken.current;
      transitionToken.current = null;
      finishLoadingWhenReady(token);
    };
    const unsubscribeEnd = navigation.addListener('transitionEnd', handleEnd);
    return () => unsubscribeEnd();
  }, [finishLoadingWhenReady, navigation]);

  return null;
}

export function useRouteTransitionScreenListeners() {
  const { startLoading, finishLoadingWhenReady } = useRouteTransitionLoaderControls();
  const transitionToken = useRef<number | null>(null);

  return useMemo(() => ({
    transitionStart: () => {
      if (transitionToken.current !== null) return;
      transitionToken.current = startLoading();
    },
    transitionEnd: () => {
      if (transitionToken.current === null) return;
      const token = transitionToken.current;
      transitionToken.current = null;
      finishLoadingWhenReady(token);
    },
    gestureCancel: () => {
      if (transitionToken.current === null) return;
      const token = transitionToken.current;
      transitionToken.current = null;
      finishLoadingWhenReady(token);
    },
  }), [finishLoadingWhenReady, startLoading]);
}

export function RouteTransitionLoader() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const { startLoading, finishLoadingWhenReady } = useRouteTransitionLoaderControls();

  useEffect(() => {
    if (previousPathname.current === pathname) return;

    const from = previousPathname.current;
    previousPathname.current = pathname;
    // Les ecrans d'attente (splash anime, retour OAuth) ne doivent jamais
    // etre recouverts : ils sont eux-memes des loaders plein ecran.
    if (from.includes('splash') || pathname.includes('splash') || pathname.includes('oauth-callback')) return;

    const token = startLoading();
    finishLoadingWhenReady(token);
  }, [finishLoadingWhenReady, pathname, startLoading]);

  return null;
}

const styles = {
  overlay: {
    zIndex: 90,
    elevation: 90,
  },
};
