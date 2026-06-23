import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/lib/constants';

export default function ExploreScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.sand }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
        <Text style={[typography.h2, { color: colors.onyx }]}>Explorer</Text>
      </View>
    </SafeAreaView>
  );
}