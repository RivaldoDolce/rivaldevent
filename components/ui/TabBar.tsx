import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function TabBar() {
  const router = useRouter();
  return (
    <View style={styles.bar}>
      <TouchableOpacity onPress={() => router.replace('/') }><Text>Home</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/explore')}><Text>Explore</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/tickets')}><Text>Tickets</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-around', padding: 10, borderTopWidth: 1, borderColor: '#eee' },
});
