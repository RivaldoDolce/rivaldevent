import { memo } from 'react';
import { Pressable, Text, View, type ViewStyle, type TextStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing } from '@/lib/constants';

type Props = {
  readonly onPress: () => void;
  readonly label?: string;
};

export const VoirToutButton = memo(function VoirToutButton({ onPress, label = 'Voir tout' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={containerStyle}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text numberOfLines={1} ellipsizeMode="tail" style={labelStyle}>
        {label}
      </Text>
      <View style={chevronWrapStyle}>
        <ChevronRight size={12} color={colors.gold} strokeWidth={2.25} />
      </View>
    </Pressable>
  );
});

const containerStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  paddingVertical: spacing.xs,
  flexShrink: 1,
  maxWidth: '45%',
};

const labelStyle: TextStyle = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 12,
  lineHeight: 16,
  color: colors.goldBright,
  letterSpacing: 0.3,
  flexShrink: 1,
  minWidth: 0 as unknown as number,
};

const chevronWrapStyle: ViewStyle = {
  width: 18,
  height: 18,
  borderRadius: 9,
  backgroundColor: 'rgba(216,180,90,0.12)',
  borderWidth: 1,
  borderColor: `${colors.gold}26`,
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};
