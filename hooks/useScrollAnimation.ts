import { useRef } from 'react';
import { Animated } from 'react-native';

export default function useScrollAnimation() {
  const scrollY = useRef(new Animated.Value(0)).current;
  return { scrollY };
}
