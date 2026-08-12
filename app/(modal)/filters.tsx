/**
 * Modal Filtres - Filtres avances pour evenements.
 *
 * Structure (bottom sheet modal) :
 * 1. Header : titre serif + bouton Reset ghost + Fermer pastille verre
 * 2. Section Categories : chips selectionnables (Concerts, Festivals...)
 * 3. Section Ville : chips selectionnables (Yaounde, Douala, Buea)
 * 4. Section Date : chip "Aujourd'hui" / "Cette semaine" / "Ce mois"
 * 5. Section Prix : tranches en liste radio (Tous, Gratuit, < 5 000...)
 * 6. Barre basse : bouton "Appliquer les filtres" degrade or fullWidth
 *
 * Design "Noir & Or" :
 * - Fond colors.background, halo dore haut, poignee doree
 * - Chips pill verre / degrade or actif
 * - Radio cercle 24px, coche degrade or
 * - CTA inline degrade gradients.gold + ombre goldGlow
 *
 * Conventions :
 * - lucide-react-native pour les icones
 * - Design tokens depuis lib/constants.ts
 * - Pas de type any, pas d'emojis, commentaires en francais
 */

import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Tag,
  MapPin,
  CalendarDays,
  CircleDollarSign,
  Check,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { colors, spacing, radius, gradients, shadows } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useHaptics } from '@/hooks/useHaptics';
import { CATEGORIES } from '@/data/mock';
import { useExploreStore } from '@/stores/explore-store';

// ============================================================
// Options de filtres
// ============================================================

const CITY_OPTIONS: readonly { readonly id: string; readonly label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'Yaounde', label: 'Yaounde' },
  { id: 'Douala', label: 'Douala' },
  { id: 'Buea', label: 'Buea' },
] as const;

const DATE_OPTIONS: readonly { readonly id: string; readonly label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'today', label: 'Aujourd\'hui' },
  { id: 'week', label: 'Cette semaine' },
  { id: 'month', label: 'Ce mois' },
] as const;

const PRICE_RANGES: readonly { readonly id: string; readonly label: string; readonly min: number; readonly max: number | null }[] = [
  { id: 'all', label: 'Tous', min: 0, max: null },
  { id: 'free', label: 'Gratuit', min: 0, max: 0 },
  { id: 'low', label: '< 5 000', min: 0, max: 5000 },
  { id: 'mid', label: '5 000 - 15 000', min: 5000, max: 15000 },
  { id: 'high', label: '15 000 - 50 000', min: 15000, max: 50000 },
  { id: 'vip', label: '> 50 000', min: 50000, max: null },
] as const;

// ============================================================
// Ecran principal
// ============================================================

export default function FiltersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact } = useHaptics();

  // -- Store global --
  const { activeCategory: storeCategory, setActiveCategory, advancedFilters, setAdvancedFilters } = useExploreStore();

  // -- State local --
  const [localCategory, setLocalCategory] = useState<string>(storeCategory);
  const [activeCity, setActiveCity] = useState<string>(advancedFilters.city);
  const [activeDate, setActiveDate] = useState<string>(advancedFilters.date);
  const [activePriceRange, setActivePriceRange] = useState<string>(advancedFilters.priceRange);

  // -- Handlers --
  const handleClose = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  const handleApply = useCallback(() => {
    impact('medium');
    // Sauvegarder les filtres et la categorie dans le store global
    setAdvancedFilters({
      city: activeCity,
      priceRange: activePriceRange,
      date: activeDate,
    });
    // Mettre a jour la categorie dans le store
    setActiveCategory(localCategory);
    router.back();
  }, [impact, router, activeCity, activePriceRange, activeDate, localCategory, setAdvancedFilters, setActiveCategory]);

  const handleClear = useCallback(() => {
    impact('light');
    setLocalCategory('all');
    setActiveCity('all');
    setActiveDate('all');
    setActivePriceRange('all');
  }, [impact]);

  // -- Composant chip reutilisable --
  const renderChips = (
    options: readonly { readonly id: string; readonly label: string }[],
    activeId: string,
    onPress: (id: string) => void,
  ) => (
    <View style={chipsRowStyle}>
      {options.map((option) => {
        const isActive = activeId === option.id;
        return (
          <Pressable
            key={option.id}
            onPress={() => {
              impact('light');
              onPress(option.id);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            {isActive ? (
              <LinearGradient
                colors={[...gradients.gold] as unknown as readonly [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={chipActiveStyle}
              >
                <Text style={chipActiveTextStyle}>{option.label}</Text>
              </LinearGradient>
            ) : (
              <View style={chipInactiveStyle}>
                <Text style={chipInactiveTextStyle}>{option.label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={screenStyle}>
      {/* Halo dore haut */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(216,180,90,0.10)', 'rgba(216,180,90,0.02)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={haloStyle}
      />

      {/* Poignee doree */}
      <View style={[handleStyle, { marginTop: insets.top + spacing.sm }]} />

      {/* ============================================
          1. HEADER : Titre + Reset + Fermer
          ============================================ */}
      <View style={headerStyle}>
        <View style={titleBlockStyle}>
          <Text style={overlineStyle}>CATALOGUE</Text>
          <Text style={titleStyle}>Filtres</Text>
        </View>

        <View style={headerActionsStyle}>
          <Pressable
            onPress={handleClear}
            hitSlop={8}
            style={resetButtonStyle}
            accessibilityRole="button"
            accessibilityLabel="Effacer tous les filtres"
          >
            <Text style={resetTextStyle}>Reinitialiser</Text>
          </Pressable>

          <Pressable
            onPress={handleClose}
            hitSlop={8}
            style={closeButtonStyle}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
            <X size={22} color={colors.goldMuted} strokeWidth={1.75} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={screenStyle}
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================
            2. SECTION CATEGORIES
            ============================================ */}
        <View style={sectionWrapperStyle}>
          <Card variant="elevated" padding="md">
            <Text style={sectionOverlineStyle}>SELECTION</Text>
            <View style={sectionTitleRowStyle}>
              <Tag size={17} color={colors.gold} strokeWidth={1.5} />
              <Text style={sectionTitleStyle}>Categories</Text>
            </View>
            {renderChips(CATEGORIES, localCategory, setLocalCategory)}
          </Card>
        </View>

        {/* ============================================
            3. SECTION VILLE
            ============================================ */}
        <View style={sectionWrapperStyle}>
          <Card variant="elevated" padding="md">
            <Text style={sectionOverlineStyle}>LOCALISATION</Text>
            <View style={sectionTitleRowStyle}>
              <MapPin size={17} color={colors.gold} strokeWidth={1.5} />
              <Text style={sectionTitleStyle}>Ville</Text>
            </View>
            {renderChips(CITY_OPTIONS, activeCity, setActiveCity)}
          </Card>
        </View>

        {/* ============================================
            4. SECTION DATE
            ============================================ */}
        <View style={sectionWrapperStyle}>
          <Card variant="elevated" padding="md">
            <Text style={sectionOverlineStyle}>CALENDRIER</Text>
            <View style={sectionTitleRowStyle}>
              <CalendarDays size={17} color={colors.gold} strokeWidth={1.5} />
              <Text style={sectionTitleStyle}>Date</Text>
            </View>
            {renderChips(DATE_OPTIONS, activeDate, setActiveDate)}
          </Card>
        </View>

        {/* ============================================
            5. SECTION PRIX (liste radio)
            ============================================ */}
        <View style={sectionWrapperStyle}>
          <Card variant="elevated" padding="md">
            <Text style={sectionOverlineStyle}>BUDGET</Text>
            <View style={sectionTitleRowStyle}>
              <CircleDollarSign size={17} color={colors.gold} strokeWidth={1.5} />
              <Text style={sectionTitleStyle}>Prix (FCFA)</Text>
            </View>
            <View style={radioListStyle}>
              {PRICE_RANGES.map((range) => {
                const isActive = activePriceRange === range.id;
                return (
                  <Pressable
                    key={range.id}
                    onPress={() => {
                      impact('light');
                      setActivePriceRange(range.id);
                    }}
                    style={isActive ? radioRowActiveStyle : radioRowStyle}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isActive }}
                  >
                    {isActive ? (
                      <LinearGradient
                        colors={[...gradients.gold] as unknown as readonly [string, string, ...string[]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={radioCircleCheckedStyle}
                      >
                        <Check size={14} color={colors.onyx} strokeWidth={2.5} />
                      </LinearGradient>
                    ) : (
                      <View style={radioCircleStyle} />
                    )}
                    <Text style={isActive ? radioLabelActiveStyle : radioLabelStyle}>
                      {range.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </View>

        {/* Espacement final */}
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* ============================================
          BARRE BASSE : Appliquer les filtres
          ============================================ */}
      <View style={[bottomBarStyle, { paddingBottom: insets.bottom || spacing.md }]}>
        <Button variant="primary" size="md" fullWidth onPress={handleApply}>
          Appliquer les filtres
        </Button>
      </View>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const screenStyle: ViewStyle = {
  flex: 1,
  backgroundColor: colors.background,
};

const haloStyle: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 190,
};

const handleStyle: ViewStyle = {
  width: 48,
  height: 5,
  borderRadius: 3,
  backgroundColor: colors.goldMuted,
  alignSelf: 'center',
};

const headerStyle: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.md,
  paddingBottom: spacing.md,
};

const titleBlockStyle: ViewStyle = {
  flex: 1,
};

const overlineStyle: TextStyle = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 11,
  lineHeight: 15,
  letterSpacing: 1.4,
  color: colors.goldMuted,
  marginBottom: 2,
};

const titleStyle: TextStyle = {
  fontFamily: 'PlayfairDisplay_700Bold',
  fontSize: 26,
  lineHeight: 34,
  color: colors.text,
  letterSpacing: -0.3,
};

const headerActionsStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.sm,
  marginBottom: 3,
};

const resetButtonStyle: ViewStyle = {
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
};

const resetTextStyle: TextStyle = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 13,
  lineHeight: 18,
  color: colors.goldBright,
  letterSpacing: 0.2,
};

const closeButtonStyle: ViewStyle = {
  width: 44,
  height: 44,
  borderRadius: radius.full,
  backgroundColor: colors.glass,
  borderWidth: 1,
  borderColor: colors.border,
  alignItems: 'center',
  justifyContent: 'center',
};

const scrollContentStyle: ViewStyle = {
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.xs,
  paddingBottom: 140,
};

const sectionWrapperStyle: ViewStyle = {
  marginBottom: spacing.md,
};

const sectionOverlineStyle: TextStyle = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 11,
  lineHeight: 15,
  letterSpacing: 1.4,
  color: colors.goldMuted,
  marginBottom: spacing.xs,
};

const sectionTitleRowStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: spacing.md,
};

const sectionTitleStyle: TextStyle = {
  fontFamily: 'PlayfairDisplay_600SemiBold',
  fontSize: 17,
  lineHeight: 23,
  color: colors.text,
  marginLeft: spacing.sm,
  letterSpacing: -0.2,
};

// -- Chips pill verre / degrade or actif --
const chipsRowStyle: ViewStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: spacing.sm,
};

const chipInactiveStyle: ViewStyle = {
  backgroundColor: colors.glass,
  borderRadius: radius.full,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
};

const chipActiveStyle: ViewStyle = {
  borderRadius: radius.full,
  borderWidth: 1,
  borderColor: `${colors.goldBright}66`,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  ...shadows.goldGlowSoft,
};

const chipInactiveTextStyle: TextStyle = {
  fontFamily: 'Inter_500Medium',
  fontSize: 14,
  lineHeight: 20,
  color: colors.textSecondary,
  letterSpacing: 0.1,
};

const chipActiveTextStyle: TextStyle = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 14,
  lineHeight: 20,
  color: colors.onyx,
  letterSpacing: 0.1,
};

// -- Liste radio prix --
const radioListStyle: ViewStyle = {
  gap: spacing.sm,
};

const radioRowStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.md,
  backgroundColor: colors.glass,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: spacing.md,
  paddingVertical: 12,
};

const radioRowActiveStyle: ViewStyle = {
  ...radioRowStyle,
  backgroundColor: colors.glassGold,
  borderColor: `${colors.gold}66`,
};

const radioCircleStyle: ViewStyle = {
  width: 24,
  height: 24,
  borderRadius: 12,
  borderWidth: 1.5,
  borderColor: colors.border,
  backgroundColor: 'transparent',
};

const radioCircleCheckedStyle: ViewStyle = {
  width: 24,
  height: 24,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
  ...shadows.goldGlowSoft,
};

const radioLabelStyle: TextStyle = {
  fontFamily: 'Inter_400Regular',
  fontSize: 14,
  lineHeight: 20,
  color: colors.textSecondary,
};

const radioLabelActiveStyle: TextStyle = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 14,
  lineHeight: 20,
  color: colors.text,
};

// -- Barre basse --
const bottomBarStyle: ViewStyle = {
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.md,
  backgroundColor: colors.background,
  borderTopWidth: 1,
  borderTopColor: `${colors.gold}1F`,
};