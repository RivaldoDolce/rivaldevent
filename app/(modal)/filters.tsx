/**
 * Modal Filtres - Filtres avances pour evenements et lieux.
 *
 * Structure (bottom sheet modal) :
 * 1. Header : Titre "Filtres" + Bouton fermer (X)
 * 2. Section Categories : chips selectionnables (Concerts, Festivals...)
 * 3. Section Ville : chips selectionnables (Yaounde, Douala, Buea)
 * 4. Section Prix : plage min/max avec inputs
 * 5. Section Date : chip "Aujourd'hui" / "Cette semaine" / "Ce mois"
 * 6. Barre fixe en bas : Bouton "Effacer" + Bouton "Appliquer"
 *
 * Design "Minimalisme Africain Camerounais" :
 * - Fond sand, sections blanches
 * - Chips actives terracotta/forest, inactives ivory
 * - CTA terracotta "Appliquer"
 *
 * Conventions :
 * - lucide-react-native pour les icones
 * - Design tokens depuis lib/constants.ts
 * - Pas de type any, pas d'emojis
 * - Imports @/, commentaires en francais
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
import { X, CalendarDays, MapPin, Tag, Receipt } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { colors, spacing, radii, shadows } from '@/lib/constants';
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
    accentColor: string = colors.terracotta,
  ) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {options.map((option) => {
        const isActive = activeId === option.id;
        return (
          <Pressable
            key={option.id}
            onPress={() => {
              impact('light');
              onPress(option.id);
            }}
            style={{
              backgroundColor: isActive ? accentColor : colors.ivory,
              borderRadius: radii.full,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderWidth: isActive ? 0 : 1,
              borderColor: `${colors.stone}30`,
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={{
              fontFamily: isActive ? 'Inter-SemiBold' : 'Inter-Medium',
              fontSize: 14,
              lineHeight: 20,
              color: isActive ? colors.white : colors.onyx,
            }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  // -- Styles --
  const screenStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.sand,
  };

  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: insets.top + spacing.md,
    paddingBottom: spacing.md,
  };

  const headerTitleStyle: TextStyle = {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    lineHeight: 32,
    color: colors.onyx,
    letterSpacing: -0.3,
  };

  const sectionStyle: ViewStyle = {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  };

  const sectionHeaderStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  };

  const sectionTitleStyle: TextStyle = {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.onyx,
    marginLeft: spacing.sm,
  };

  const bottomBarStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: insets.bottom || spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  };

  return (
    <View style={screenStyle}>
      {/* ============================================
          1. HEADER : Titre + Fermer
          ============================================ */}
      <View style={headerStyle}>
        <Text style={headerTitleStyle}>Filtres</Text>
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
        >
          <X size={24} color={colors.onyx} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        style={screenStyle}
        contentContainerStyle={{
          paddingBottom: 100, // Espace pour la barre fixe
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================
            2. SECTION CATEGORIES
            ============================================ */}
        <View style={sectionStyle}>
          <View style={sectionHeaderStyle}>
            <Tag size={18} color={colors.terracotta} strokeWidth={1.5} />
            <Text style={sectionTitleStyle}>Categories</Text>
          </View>
          {renderChips(CATEGORIES, localCategory, setLocalCategory, colors.terracotta)}
        </View>

        {/* ============================================
            3. SECTION VILLE
            ============================================ */}
        <View style={sectionStyle}>
          <View style={sectionHeaderStyle}>
            <MapPin size={18} color={colors.forest} strokeWidth={1.5} />
            <Text style={sectionTitleStyle}>Ville</Text>
          </View>
          {renderChips(CITY_OPTIONS, activeCity, setActiveCity, colors.forest)}
        </View>

        {/* ============================================
            4. SECTION DATE
            ============================================ */}
        <View style={sectionStyle}>
          <View style={sectionHeaderStyle}>
            <CalendarDays size={18} color={colors.gold} strokeWidth={1.5} />
            <Text style={sectionTitleStyle}>Date</Text>
          </View>
          {renderChips(DATE_OPTIONS, activeDate, setActiveDate, colors.gold)}
        </View>

        {/* ============================================
            5. SECTION PRIX
            ============================================ */}
        <View style={sectionStyle}>
          <View style={sectionHeaderStyle}>
            <Receipt size={18} color={colors.terracotta} strokeWidth={1.5} />
            <Text style={sectionTitleStyle}>Prix (FCFA)</Text>
          </View>
          {renderChips(PRICE_RANGES, activePriceRange, setActivePriceRange, colors.terracotta)}
        </View>

        {/* Espacement final */}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* ============================================
          BARRE FIXE EN BAS : Effacer + Appliquer
          ============================================ */}
      <View style={bottomBarStyle}>
        <Pressable
          onPress={handleClear}
          style={{
            backgroundColor: colors.ivory,
            borderRadius: radii.lg,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          accessibilityRole="button"
          accessibilityLabel="Effacer tous les filtres"
        >
          <Text style={{
            fontFamily: 'Inter-SemiBold',
            fontSize: 14,
            lineHeight: 20,
            color: colors.stone,
          }}>
            Effacer
          </Text>
        </Pressable>

        <Pressable
          onPress={handleApply}
          style={{
            backgroundColor: colors.terracotta,
            borderRadius: radii.lg,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
          }}
          accessibilityRole="button"
          accessibilityLabel="Appliquer les filtres"
        >
          <Text style={{
            fontFamily: 'Inter-SemiBold',
            fontSize: 14,
            lineHeight: 20,
            color: colors.white,
          }}>
            Appliquer
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
