import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/lib/constants';

export default function Screen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.sand }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingBottom: 80,
        paddingHorizontal: spacing.lg,
      }}
    >
      <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.lg }}>
        <Text style={[typography.h2, { color: colors.onyx }]}>Ecran a implementer</Text>
      </View>
    </ScrollView>
  );
}
