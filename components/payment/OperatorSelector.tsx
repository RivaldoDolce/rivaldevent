import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function OperatorSelector() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn}><Text>MTN</Text></TouchableOpacity>
      <TouchableOpacity style={styles.btn}><Text>Orange</Text></TouchableOpacity>
      <TouchableOpacity style={styles.btn}><Text>Moov</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-around' },
  btn: { padding: 10, backgroundColor: '#fff', borderRadius: 8 },
});
