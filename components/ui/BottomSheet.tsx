/**
 * Bottom Sheet du design system.
 *
 * Implementation native sans @gorhom/bottom-sheet (qui depend de
 * react-native-reanimated, cause de l'erreur TurboModule au lancement).
 *
 * Utilise Modal + Animated de react-native pour des animations fluides.
 * Conformement au handoff section 8.6 : "ne PAS en ajouter de nouveau"
 * (reanimated).
 *
 * API proche de @gorhom/bottom-sheet pour faciliter la migration :
 *   - snapPoints : pourcentages ('25%', '50%', '90%')
 *   - index : -1 = ferme, 0 = premier snap, 1 = deuxieme, etc.
 *   - onChange : callback quand l'index change
 *   - ref + expand()/close() : controle imperatif
 *
 * Pour des animations 60fps+ a l'avenir (development build),
 * on pourra reintroduire reanimated proprement.
 */

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import {
  Modal,
  Pressable,
  View,
  Animated,
  Dimensions,
  type ViewStyle,
  type GestureResponderEvent,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, zIndex } from '@/lib/constants';

// ============================================================
// Types
// ============================================================

interface BottomSheetProps {
  /** Snap points en pourcentage : ['25%', '50%', '90%'] */
  readonly snapPoints?: readonly string[];
  /** Index actif : -1 = ferme, 0 = premier snap */
  readonly index?: number;
  /** Callback quand l'index change */
  readonly onChange?: (index: number) => void;
  readonly children: React.ReactNode;
  /** Fermer sur tap du backdrop */
  readonly enableCloseOnBackdrop?: boolean;
  /** Fermer sur swipe vers le bas */
  readonly enablePanDownToClose?: boolean;
  /** Style supplementaire pour le conteneur */
  readonly containerStyle?: ViewStyle;
  /** Test ID */
  readonly testID?: string;
}

export interface BottomSheetRef {
  expand: (snapIndex?: number) => void;
  close: () => void;
  snapTo: (snapIndex: number) => void;
}

// ============================================================
// Constantes
// ============================================================

const SCREEN_HEIGHT = Dimensions.get('window').height;
const ANIMATION_DURATION = 300;
const DRAG_THRESHOLD = 80;

// ============================================================
// Composant
// ============================================================

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  function BottomSheet(
    {
      snapPoints: snapPointsProp = ['50%'],
      index: indexProp = -1,
      onChange,
      children,
      enableCloseOnBackdrop = true,
      enablePanDownToClose = true,
      containerStyle,
      testID,
    },
    ref,
  ) {
    const insets = useSafeAreaInsets();

    // Snap points en pixels
    const snapPixels = snapPointsProp.map(
      (sp) => SCREEN_HEIGHT * (parseFloat(sp) / 100),
    );

    // Etat interne
    const currentIndex = useRef(indexProp);
    const visible = useRef(indexProp >= 0);
    const [showModal, setShowModal] = React.useState(indexProp >= 0);

    const slideAnimRef = useRef<Animated.Value | null>(null);
    if (!slideAnimRef.current) slideAnimRef.current = new Animated.Value(indexProp >= 0 ? 0 : SCREEN_HEIGHT);
    const slideAnim = slideAnimRef.current;
    const backdropOpacityRef = useRef<Animated.Value | null>(null);
    if (!backdropOpacityRef.current) backdropOpacityRef.current = new Animated.Value(indexProp >= 0 ? 0.5 : 0);
    const backdropOpacity = backdropOpacityRef.current;

    // Drag gesture
    const dragStartY = useRef(0);
    const lastDragY = useRef(0);

    // Controle imperatif
    useImperativeHandle(ref, () => ({
      expand(snapIndex = 0) {
        snapToInternal(snapIndex);
      },
      close() {
        closeInternal();
      },
      snapTo(snapIndex: number) {
        snapToInternal(snapIndex);
      },
    }));

    // Animation d'ouverture
    const animateToSnap = useCallback(
      (snapIndex: number) => {
        const targetY = SCREEN_HEIGHT - snapPixels[snapIndex];
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: targetY,
            damping: 30,
            stiffness: 200,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 0.5,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
        ]).start();
      },
      [slideAnim, backdropOpacity, snapPixels],
    );

    // Animation de fermeture
    const animateClose = useCallback(() => {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: SCREEN_HEIGHT,
          damping: 30,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setShowModal(false);
          visible.current = false;
        }
      });
    }, [slideAnim, backdropOpacity]);

    // Ouvrir a un snap point
    const snapToInternal = useCallback(
      (snapIndex: number) => {
        if (snapIndex < 0 || snapIndex >= snapPixels.length) return;

        if (!visible.current) {
          visible.current = true;
          currentIndex.current = snapIndex;
          setShowModal(true);
        } else {
          currentIndex.current = snapIndex;
          animateToSnap(snapIndex);
        }
        onChange?.(snapIndex);
      },
      [snapPixels, onChange, animateToSnap],
    );

    // Fermer
    const closeInternal = useCallback(() => {
      currentIndex.current = -1;
      animateClose();
      onChange?.(-1);
    }, [animateClose, onChange]);

    // React to showModal change
    useEffect(() => {
      if (showModal && visible.current) {
        requestAnimationFrame(() => {
          animateToSnap(currentIndex.current);
        });
      }
    }, [showModal, animateToSnap]);

    // React to indexProp change (controle declaratif)
    useEffect(() => {
      if (indexProp !== currentIndex.current) {
        if (indexProp < 0) {
          closeInternal();
        } else {
          snapToInternal(indexProp);
        }
      }
    }, [indexProp, closeInternal, snapToInternal]);

    // Handlers du drag
    const handleDragStart = useCallback((e: GestureResponderEvent) => {
      dragStartY.current = e.nativeEvent.pageY;
      lastDragY.current = e.nativeEvent.pageY;
    }, []);

    const handleDragMove = useCallback(
      (e: GestureResponderEvent) => {
        const dy = e.nativeEvent.pageY - dragStartY.current;
        if (dy > 0) {
          const currentSnap = snapPixels[currentIndex.current] ?? snapPixels[0];
          const baseY = SCREEN_HEIGHT - currentSnap;
          slideAnim.setValue(baseY + dy);
        }
        lastDragY.current = e.nativeEvent.pageY;
      },
      [slideAnim, snapPixels],
    );

    const handleDragEnd = useCallback(
      (e: GestureResponderEvent) => {
        const totalDrag = e.nativeEvent.pageY - dragStartY.current;

        if (enablePanDownToClose && totalDrag > DRAG_THRESHOLD) {
          closeInternal();
        } else {
          animateToSnap(currentIndex.current);
        }
      },
      [enablePanDownToClose, closeInternal, animateToSnap],
    );

    // Styles
    const sheetStyle: Animated.WithAnimatedValue<ViewStyle> = {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: snapPixels[Math.max(currentIndex.current, 0)] ?? snapPixels[0],
      transform: [{ translateY: slideAnim }],
      backgroundColor: colors.elevated,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: `${colors.gold}30`,
      shadowColor: colors.onyx,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 12,
    };

    const handleBarStyle: ViewStyle = {
      width: 48,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.goldMuted,
      alignSelf: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    };

    const contentStyle: ViewStyle = {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl + insets.bottom,
      flex: 1,
    };

    if (!showModal) return null;

    return (
      <Modal
        visible={showModal}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeInternal}
        testID={testID}
      >
        <View style={{ flex: 1 }}>
          {/* Backdrop */}
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: colors.onyx,
              opacity: backdropOpacity,
              zIndex: zIndex.bottomSheet,
            }}
          >
            <Pressable
              style={{ flex: 1 }}
              onPress={enableCloseOnBackdrop ? closeInternal : undefined}
            />
          </Animated.View>

          {/* Sheet */}
          <Animated.View
            style={[sheetStyle, containerStyle, { zIndex: zIndex.bottomSheet + 1 }]}
            onStartShouldSetResponder={() => true}
            onResponderStart={handleDragStart}
            onResponderMove={handleDragMove}
            onResponderRelease={handleDragEnd}
          >
            {/* Handle bar */}
            <View style={handleBarStyle} />

            {/* Content */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={contentStyle}
            >
              {children}
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
    );
  },
);