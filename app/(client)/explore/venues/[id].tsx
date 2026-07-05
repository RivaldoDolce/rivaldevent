import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/lib/constants';

export default function VenueDetail() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.sand }}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: Math.max(insets.bottom, spacing.lg),
        paddingHorizontal: spacing.lg,
      }}
    >
      <View style={{ paddingVertical: spacing.lg }}>
        <Text style={[typography.h2, { color: colors.onyx }]}>Venue Detail</Text>
      </View>
    </ScrollView>
  );
}
