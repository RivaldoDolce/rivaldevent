import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

export default function Badge({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  text: { fontSize: 12, color: '#111' },
});
