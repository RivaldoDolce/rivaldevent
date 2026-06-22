import { View, Text, StyleSheet } from 'react-native';

export default function VenueCard({ name }: { name: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.image} />
      <Text style={styles.name}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  image: { height: 100, backgroundColor: '#eee', borderRadius: 8 },
  name: { marginTop: 8 },
});
