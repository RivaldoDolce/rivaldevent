import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function Skeleton({ style }: { style?: any }) {
  return <View style={[styles.skel, style]} />;
}

const styles = StyleSheet.create({
  skel: {
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    height: 12,
  },
});
