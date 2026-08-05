/**
 * Modal Filtres Lieux - Filtres avances SPECIFIQUES aux lieux.
 *
 * Different du modal filtre evenements : les lieux ont des criteres
 * dedies (capacite, type d'evenement, tarif par jour, prestige).
 *
 * Structure (bottom sheet modal) :
 * 1. Header : Titre "Filtres lieux" + Bouton fermer (X)
 * 2. Section Ville : Yaounde, Douala, Buea
 * 3. Section Capacite : plages de personnes (max)
 * 4. Section Type d'evenement : Concert, Conference, Gala, Mariage...
 * 5. Section Tarif par jour (FCFA) : plages de prix
 * 6. Section Prestige : Premium, Or Savane, Recommande
 * 7. Barre fixe en bas : "Effacer" + "Appliquer"
 *
 * Design "Minimalisme Africain Camerounais" :
 * - Fond sand, sections blanches
 * - Chips actives forest/terracotta, inactives ivory
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
import { X, MapPin, Users, Music, Receipt, Award } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { colors, spacing, radii, shadows } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useExploreStore } from '@/stores/explore-store';

// ============================================================
// Options de filtres dedies aux lieux
// ============================================================

const CITY_OPTIONS: readonly { readonly id: string; readonly label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'Yaounde', label: 'Yaounde' },
  { id: 'Douala', label: 'Douala' },
  { id: 'Buea', label: 'Buea' },
] as const;

const CAPACITY_OPTIONS: readonly { readonly id: string; readonly label: string }[] = [
  { id: 'all', label: 'Toute capacite' },
  { id: 'small', label: 'Moins de 100' },
  { id: 'medium', label: '100 - 300' },
  { id: 'large', label: '300 - 500' },
  { id: 'xlarge', label: 'Plus de 500' },
] as const;

const EVENT_TYPE_OPTIONS: readonly { readonly id: string; readonly label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'concert', label: 'Concert' },
  { id: 'conference', label: 'Conference' },
  { id: 'gala', label: 'Gala' },
  { id: 'wedding', label: 'Mariage' },
  { id: 'festival', label: 'Festival' },
  { id: 'soiree', label: 'Soiree' },
  { id: 'cocktail', label: 'Cocktail' },
  { id: 'exposition', label: 'Exposition' },
  { id: 'sport', label: 'Sport' },
  { id: 'seminaire', label: 'Seminaire' },
  { id: 'atelier', label: 'Atelier' },
  { id: 'diner', label: 'Diner' },
] as const;

const PRICE_PER_DAY_RANGES: readonly { readonly id: string; readonly label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'budget', label: '< 50 000' },
  { id: 'mid', label: '50 000 - 100 000' },
  { id: 'high', label: '100 000 - 200 000' },
  { id: 'luxury', label: '> 200 000' },
] as const;

const PRESTIGE_OPTIONS: readonly { readonly id: string; readonly label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'Premium', label: 'Premium' },
  { id: 'Or Savane', label: 'Or Savane' },
  { id: 'Recommande', label: 'Recommande' },
] as const;

// ============================================================
// Ecran principal
// ============================================================

export default function VenueFiltersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact } = useHaptics();

  // -- Store global --
  const { venueFilters, setVenueFilters } = useExploreStore();

  // -- State local --
  const [activeCity, setActiveCity] = useState<string>(venueFilters.city);
  const [activeCapacity, setActiveCapacity] = useState<string>(venueFilters.capacityRange);
  const [activeEventType, setActiveEventType] = useState<string>(venueFilters.eventType);
  const [activePrice, setActivePrice] = useState<string>(venueFilters.pricePerDayRange);
  const [activePrestige, setActivePrestige] = useState<string>(venueFilters.prestige);

  // -- Handlers --
  const handleClose = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  const handleApply = useCallback(() => {
    impact('medium');
    setVenueFilters({
      city: activeCity,
      capacityRange: activeCapacity,
      eventType: activeEventType,
      pricePerDayRange: activePrice,
      prestige: activePrestige,
    });
    router.back();
  }, [impact, router, activeCity, activeCapacity, activeEventType, activePrice, activePrestige, setVenueFilters]);

  const handleClear = useCallback(() => {
    impact('light');
    setActiveCity('all');
    setActiveCapacity('all');
    setActiveEventType('all');
    setActivePrice('all');
    setActivePrestige('all');
  }, [impact]);

  // -- Composant chip reutilisable --
  const renderChips = (
    options: readonly { readonly id: string; readonly label: string }[],
    activeId: string,
    onPress: (id: string) => void,
    accentColor: string = colors.forest,
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
        <Text style={headerTitleStyle}>Filtres lieux</Text>
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
            2. SECTION VILLE
            ============================================ */}
        <View style={sectionStyle}>
          <View style={sectionHeaderStyle}>
            <MapPin size={18} color={colors.forest} strokeWidth={1.5} />
            <Text style={sectionTitleStyle}>Ville</Text>
          </View>
          {renderChips(CITY_OPTIONS, activeCity, setActiveCity, colors.forest)}
        </View>

        {/* ============================================
            3. SECTION CAPACITE
            ============================================ */}
        <View style={sectionStyle}>
          <View style={sectionHeaderStyle}>
            <Users size={18} color={colors.terracotta} strokeWidth={1.5} />
            <Text style={sectionTitleStyle}>Capacite (personnes)</Text>
          </View>
          {renderChips(CAPACITY_OPTIONS, activeCapacity, setActiveCapacity, colors.terracotta)}
        </View>

        {/* ============================================
            4. SECTION TYPE D'EVENEMENT
            ============================================ */}
        <View style={sectionStyle}>
          <View style={sectionHeaderStyle}>
            <Music size={18} color={colors.gold} strokeWidth={1.5} />
            <Text style={sectionTitleStyle}>Type d'evenement</Text>
          </View>
          {renderChips(EVENT_TYPE_OPTIONS, activeEventType, setActiveEventType, colors.gold)}
        </View>

        {/* ============================================
            5. SECTION TARIF PAR JOUR
            ============================================ */}
        <View style={sectionStyle}>
          <View style={sectionHeaderStyle}>
            <Receipt size={18} color={colors.forest} strokeWidth={1.5} />
            <Text style={sectionTitleStyle}>Tarif par jour (FCFA)</Text>
          </View>
          {renderChips(PRICE_PER_DAY_RANGES, activePrice, setActivePrice, colors.forest)}
        </View>

        {/* ============================================
            6. SECTION PRESTIGE
            ============================================ */}
        <View style={sectionStyle}>
          <View style={sectionHeaderStyle}>
            <Award size={18} color={colors.goldBright} strokeWidth={1.5} />
            <Text style={sectionTitleStyle}>Prestige</Text>
          </View>
          {renderChips(PRESTIGE_OPTIONS, activePrestige, setActivePrestige, colors.goldBright)}
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