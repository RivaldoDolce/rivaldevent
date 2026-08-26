import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';
import { usePathname } from 'expo-router';

import { LoadingScreen } from './LoadingScreen';

export function RouteTransitionLoader() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    setVisible(true);
    Animated.timing(opacity, { toValue: 1, duration: 120, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        Animated.timing(opacity, { toValue: 0, duration: 160, easing: Easing.in(Easing.ease), useNativeDriver: true }).start(({ finished }) => {
          if (finished) setVisible(false);
        });
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname, opacity]);

  if (!visible) return null;

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { opacity, zIndex: 9999 }]}>
      <LoadingScreen />
    </Animated.View>
  );
}
