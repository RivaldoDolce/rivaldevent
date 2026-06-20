import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TicketTierCard({ name }: { name: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 8 },
  name: { fontWeight: '600' },
});
