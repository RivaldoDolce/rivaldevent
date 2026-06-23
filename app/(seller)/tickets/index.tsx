import { View, Text } from 'react-native';
import { colors, typography, spacing } from '@/lib/constants';

export default function Screen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.sand, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
      <Text style={[typography.h2, { color: colors.onyx }]}>Ecran a implementer</Text>
    </View>
  );
}
