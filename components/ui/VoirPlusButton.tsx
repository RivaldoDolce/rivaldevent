import { memo } from 'react';
import { Pressable, Text, View, type ViewStyle, type TextStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing, radius } from '@/lib/constants';

type Props = {
  readonly remaining: number;
  readonly onPress: () => void;
  readonly label?: string;
  readonly testID?: string;
};

export const VoirPlusButton = memo(function VoirPlusButton({ remaining, onPress, label = 'Voir plus', testID }: Props) {
  if (remaining <= 0) return null;
  const text = `${label} (${remaining} restant${remaining > 1 ? 's' : ''})`;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={text}
      style={({ pressed }) => [containerStyle, { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      <Text numberOfLines={1} ellipsizeMode="tail" style={labelStyle}>
        {text}
      </Text>
      <View style={chevronWrapStyle}>
        <ChevronRight size={14} color={colors.gold} strokeWidth={2.25} />
      </View>
    </Pressable>
  );
});

const containerStyle: ViewStyle = {
  alignSelf: 'center',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
  paddingLeft: spacing.xl,
  paddingRight: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: radius.full,
  backgroundColor: colors.glass,
  borderWidth: 1,
  borderColor: `${colors.gold}40`,
  maxWidth: '90%',
  minWidth: 148,
  flexShrink: 1,
  shadowColor: 'rgba(216,180,90,0.18)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.35,
  shadowRadius: 6,
  elevation: 2,
};

const labelStyle: TextStyle = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 13,
  lineHeight: 18,
  color: colors.goldBright,
  letterSpacing: 0.2,
  flexShrink: 1,
  minWidth: 0 as unknown as number,
  textAlign: 'center',
};

const chevronWrapStyle: ViewStyle = {
  width: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: 'rgba(216,180,90,0.12)',
  borderWidth: 1,
  borderColor: `${colors.gold}26`,
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};
