/**
 * Bottom Sheet du design system, wrapper autour de @gorhom/bottom-sheet.
 */

import React, { forwardRef } from 'react';
import { View, type ViewStyle } from 'react-native';
import BottomSheetRaw, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetProps as RawBottomSheetProps,
} from '@gorhom/bottom-sheet';

import { colors, radius, spacing } from '@/lib/constants';

interface BottomSheetProps extends Omit<RawBottomSheetProps, 'backdropComponent'> {
  readonly children: React.ReactNode;
}

export const BottomSheet = forwardRef<BottomSheetRaw, BottomSheetProps>(
  function BottomSheet({ children, snapPoints = ['50%'], index = -1, ...rest }, ref) {
    const renderBackdrop = (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    );

    const containerStyle: ViewStyle = {
      backgroundColor: colors.sand,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      shadowColor: colors.onyx,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    };

    const contentContainerStyle: ViewStyle = {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    };

    return (
      <BottomSheetRaw
        ref={ref}
        {...rest}
        index={index}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={containerStyle}
        handleIndicatorStyle={{ backgroundColor: colors.stone, width: 40 }}
      >
        <View style={contentContainerStyle}>{children}</View>
      </BottomSheetRaw>
    );
  }
);