import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function EventCard({ title }: { title: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.image} />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  image: { height: 140, backgroundColor: '#ddd', borderRadius: 8 },
  title: { marginTop: 8, fontWeight: '600' },
});
