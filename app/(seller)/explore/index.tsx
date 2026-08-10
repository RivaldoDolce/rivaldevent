/**
 * Mes evenements (mode vendeur) — portefeuille de billetterie.
 *
 * Structure :
 * 1. Header : logo + avatar + titre + bouton "Nouveau"
 * 2. Filtres par statut (Tous / En ligne / Brouillons / Termines)
 * 3. Cartes evenement : image, statut, date, ville, jauge de remplissage,
 *    revenus et billets vendus
 * 4. Etat vide quand aucun evenement ne correspond au filtre
 *
 * Donnees : store vendeur (mock en attendant Supabase).
 * La creation passe par l'onglet "Vendre" (wizard).
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  Plus,
  MapPin,
  CalendarDays,
  Ticket,
  ChevronRight,
  LayoutGrid,
  List,
} from 'lucide-react-native';

import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, spacing, radius, ROUTES } from '@/lib/constants';
import { formatFCFA, formatShortDate } from '@/lib/format';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuth } from '@/hooks/useAuth';
import { useSellerStore } from '@/stores/seller-store';
import type { MockSellerEvent } from '@/data/mock';

// ============================================================
// Metadonnees de statut
// ============================================================

const STATUS_META = {
  published: { label: 'En ligne', color: colors.forest, bg: `${colors.forest}12` },
  draft: { label: 'Brouillon', color: colors.goldDark, bg: `${colors.goldDark}12` },
  completed: { label: 'Termine', color: colors.stone, bg: `${colors.stone}12` },
} as const;

type EventFilter = 'all' | 'published' | 'draft' | 'completed';
type EventViewMode = 'grid' | 'list';

const FILTERS: readonly { id: EventFilter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'published', label: 'En ligne' },
  { id: 'draft', label: 'Brouillons' },
  { id: 'completed', label: 'Termines' },
];

// ============================================================
// Ecran
// ============================================================

export default function SellerExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { impact } = useHaptics();

  const events = useSellerStore((state) => state.events);
  const [filter, setFilter] = useState<EventFilter>('all');
  const [viewMode, setViewMode] = useState<EventViewMode>('grid');

  const filteredEvents =
    filter === 'all' ? events : events.filter((event) => event.status === filter);

  const handleCreate = useCallback(() => {
    impact('light');
    router.push(ROUTES.SELL);
  }, [impact, router]);

  // -- Styles dynamiques --
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
    paddingBottom: spacing.sm,
  };

  const headerTitleStyle: TextStyle = {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    lineHeight: 32,
    color: colors.onyx,
    letterSpacing: -0.4,
  };

  return (
    <View style={screenStyle}>
      <ScrollView
        style={screenStyle}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================
            1. HEADER
            ============================================ */}
        <View style={headerStyle}>
          <View style={styles.headerTitleBlock}>
            <Text style={headerTitleStyle} numberOfLines={1}>
              Mes evenements
            </Text>
            <Text style={styles.headerCount}>
              {events.length} evenement{events.length > 1 ? 's' : ''} dans votre espace
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              onPress={handleCreate}
              style={styles.newButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Nouvel evenement"
            >
              <Plus size={20} color={colors.sand} strokeWidth={2} />
            </Pressable>
            <Avatar
              source={profile?.avatar_url ?? null}
              fallback={profile?.full_name ?? 'U'}
              size="sm"
              border="highlight"
            />
          </View>
        </View>

        {/* ============================================
            2. BARRE D'OUTILS : mode d'affichage + compteur
            ============================================ */}
        <View style={styles.toolbarRow}>
          <View style={styles.viewToggle}>
            <Pressable
              onPress={() => {
                impact('light');
                setViewMode('grid');
              }}
              style={[styles.viewToggleButton, viewMode === 'grid' ? styles.viewToggleActive : null]}
              accessibilityRole="button"
              accessibilityLabel="Vue grille"
              accessibilityState={{ selected: viewMode === 'grid' }}
            >
              <LayoutGrid
                size={18}
                color={viewMode === 'grid' ? colors.sand : colors.stone}
                strokeWidth={1.75}
              />
            </Pressable>
            <Pressable
              onPress={() => {
                impact('light');
                setViewMode('list');
              }}
              style={[styles.viewToggleButton, viewMode === 'list' ? styles.viewToggleActive : null]}
              accessibilityRole="button"
              accessibilityLabel="Vue liste"
              accessibilityState={{ selected: viewMode === 'list' }}
            >
              <List
                size={19}
                color={viewMode === 'list' ? colors.sand : colors.stone}
                strokeWidth={1.75}
              />
            </Pressable>
          </View>
          <Text style={styles.resultCount}>
            {filteredEvents.length} evenement{filteredEvents.length > 1 ? 's' : ''}
          </Text>
        </View>

        {/* ============================================
            3. FILTRES PAR STATUT (scroll horizontal)
            ============================================ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersRow}
        >
          {FILTERS.map((item) => {
            const isActive = filter === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  impact('light');
                  setFilter(item.id);
                }}
                style={[styles.filterChip, isActive ? styles.filterChipActive : null]}
                accessibilityRole="button"
                accessibilityLabel={`Filtrer: ${item.label}`}
              >
                <Text
                  style={[styles.filterText, isActive ? styles.filterTextActive : null]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ============================================
            4. CONTENU (grille ou liste)
            ============================================ */}
        {filteredEvents.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={34} color={colors.terracotta} strokeWidth={1.25} />}
            title="Aucun evenement ici"
            description="Creez votre premier evenement pour lancer votre billetterie."
            actionLabel="Creer un evenement"
            onAction={handleCreate}
          />
        ) : viewMode === 'grid' ? (
          <View style={styles.grid}>
            {filteredEvents.map((event) => (
              <EventGridCard key={event.id} event={event} />
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            {filteredEvents.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================
// Sous-composant : carte evenement
// ============================================================

function EventRow({ event }: { readonly event: MockSellerEvent }) {
  const { impact } = useHaptics();
  const statusMeta = STATUS_META[event.status];

  const fillRate =
    event.capacity > 0
      ? Math.min(Math.round((event.tickets_sold / event.capacity) * 100), 100)
      : 0;

  return (
    <Pressable
      onPress={() => impact('light')}
      style={styles.eventCard}
      accessibilityRole="button"
      accessibilityLabel={event.title}
    >
      {/* Image hero paysage + badges superposes */}
      <View style={styles.eventImageWrap}>
        <Image
          source={{ uri: event.image }}
          style={styles.eventImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        <View pointerEvents="none" style={styles.imageShade} />

        <View style={[styles.statusChip, { backgroundColor: statusMeta.bg }]}>
          <Text style={[styles.statusChipText, { color: statusMeta.color }]}>
            {statusMeta.label}
          </Text>
        </View>

        <View style={styles.revenueChip}>
          <Text style={styles.revenueChipText}>{formatFCFA(event.revenue)}</Text>
        </View>
      </View>

      {/* Corps de la carte */}
      <View style={styles.eventBody}>
        <Text style={styles.eventTitle} numberOfLines={1}>
          {event.title}
        </Text>

        <View style={styles.eventMetaRow}>
          <CalendarDays size={13} color={colors.stone} strokeWidth={1.75} />
          <Text style={styles.eventMetaText}>{formatShortDate(event.start_date)}</Text>
          <View style={styles.metaDot} />
          <MapPin size={13} color={colors.stone} strokeWidth={1.75} />
          <Text style={styles.eventMetaText} numberOfLines={1}>
            {event.city} · {event.venue}
          </Text>
        </View>

        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {event.tickets_sold}/{event.capacity} billets vendus
          </Text>
          <Text style={styles.progressValue}>{fillRate}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${fillRate}%`,
                backgroundColor:
                  fillRate >= 80 ? colors.terracotta : colors.forest,
              },
            ]}
          />
        </View>

        <View style={styles.eventFooter}>
          <View style={styles.eventFooterItem}>
            <Ticket size={14} color={colors.forest} strokeWidth={1.75} />
            <Text style={styles.eventFooterText}>{event.tickets_sold} billets</Text>
          </View>
          <ChevronRight size={18} color={`${colors.stone}70`} strokeWidth={1.5} />
        </View>
      </View>
    </Pressable>
  );
}

// ============================================================
// Sous-composant : carte evenement (vue grille)
// ============================================================

function EventGridCard({ event }: { readonly event: MockSellerEvent }) {
  const { impact } = useHaptics();
  const statusMeta = STATUS_META[event.status];

  const fillRate =
    event.capacity > 0
      ? Math.min(Math.round((event.tickets_sold / event.capacity) * 100), 100)
      : 0;

  return (
    <Pressable
      onPress={() => impact('light')}
      style={styles.gridCard}
      accessibilityRole="button"
      accessibilityLabel={event.title}
    >
      <View style={styles.gridImageWrap}>
        <Image
          source={{ uri: event.image }}
          style={styles.gridImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        <View style={[styles.gridStatusChip, { backgroundColor: statusMeta.color }]}>
          <Text style={styles.gridStatusText}>{statusMeta.label}</Text>
        </View>
      </View>

      <View style={styles.gridBody}>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.gridMetaRow}>
          <CalendarDays size={11} color={colors.stone} strokeWidth={1.75} />
          <Text style={styles.gridMetaText} numberOfLines={1}>
            {formatShortDate(event.start_date)}
          </Text>
        </View>
        <View style={styles.gridMetaRow}>
          <MapPin size={11} color={colors.stone} strokeWidth={1.75} />
          <Text style={styles.gridMetaText} numberOfLines={1}>
            {event.city}
          </Text>
        </View>

        <View style={styles.gridProgressTrack}>
          <View
            style={[
              styles.gridProgressFill,
              {
                width: `${fillRate}%`,
                backgroundColor:
                  fillRate >= 80 ? colors.terracotta : colors.forest,
              },
            ]}
          />
        </View>

        <View style={styles.gridFooter}>
          <Text style={styles.gridRevenue}>{formatFCFA(event.revenue)}</Text>
          <View style={styles.gridTicketsRow}>
            <Ticket size={12} color={colors.stone} strokeWidth={1.75} />
            <Text style={styles.gridTicketsText}>{event.tickets_sold}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  headerTitleBlock: {
    flex: 1,
    marginRight: spacing.md,
  },
  headerCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  newButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },

  // -- Barre d'outils (mode d'affichage) --
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.ivory,
    borderRadius: radius.full,
    padding: 3,
  },
  viewToggleButton: {
    width: 40,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleActive: {
    backgroundColor: colors.forest,
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  resultCount: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
  },

  // -- Filtres --
  filtersScroll: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    flexGrow: 0,
  },
  filtersRow: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg + 8,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.stone}30`,
    backgroundColor: colors.white,
  },
  filterChipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  filterText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 17,
    color: colors.stone,
  },
  filterTextActive: {
    color: colors.sand,
    fontFamily: 'Inter-SemiBold',
  },

  // -- Liste --
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  // -- Grille --
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.border}60`,
    overflow: 'hidden',
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  gridImageWrap: {
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: 96,
  },
  gridStatusChip: {
    position: 'absolute',
    top: spacing.xs + 2,
    left: spacing.xs + 2,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm - 2,
    paddingVertical: 2,
  },
  gridStatusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 9,
    lineHeight: 12,
    color: colors.white,
    letterSpacing: 0.3,
  },
  gridBody: {
    padding: spacing.sm + 2,
  },
  gridTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.onyx,
    letterSpacing: -0.2,
    minHeight: 36,
  },
  gridMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  gridMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    lineHeight: 14,
    color: colors.stone,
    flexShrink: 1,
  },
  gridProgressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: `${colors.forest}10`,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  gridProgressFill: {
    height: 4,
    borderRadius: 2,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  gridRevenue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 15,
    color: colors.onyx,
    flexShrink: 1,
  },
  gridTicketsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gridTicketsText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    lineHeight: 15,
    color: colors.stone,
  },
  eventCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.border}60`,
    overflow: 'hidden',
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  eventImageWrap: {
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: 150,
  },
  imageShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 46,
    backgroundColor: `${colors.onyx}33`,
  },
  statusChip: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  statusChipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.4,
  },
  revenueChip: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: `${colors.onyx}59`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  revenueChipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    lineHeight: 14,
    color: colors.white,
    letterSpacing: 0.3,
  },
  eventBody: {
    padding: spacing.md,
  },
  eventTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.onyx,
    letterSpacing: -0.2,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 4,
  },
  eventMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: colors.stone,
    flexShrink: 1,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: `${colors.stone}60`,
    marginHorizontal: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm + 2,
  },
  progressLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: colors.stone,
  },
  progressValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 15,
    color: colors.onyx,
  },
  progressTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: `${colors.forest}10`,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: 5,
    borderRadius: 2.5,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm + 2,
  },
  eventFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eventFooterText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    lineHeight: 15,
    color: colors.forest,
  },
});