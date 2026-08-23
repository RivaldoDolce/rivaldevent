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
 * Design system « Noir & Or » : cartes elevees, statuts colores, or pour les CTA.
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ImageBackground,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
import { colors, spacing, radius, shadows, gradients, ROUTES } from '@/lib/constants';
import { sellerBackgrounds } from '@/lib/images';
import { formatFCFA, formatShortDate } from '@/lib/format';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuth } from '@/hooks/useAuth';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';
import { useSellerStore } from '@/stores/seller-store';
import type { MockSellerEvent } from '@/data/mock';

// ============================================================
// Metadonnees de statut
// ============================================================

const STATUS_META = {
  published: { label: 'En ligne', color: colors.success, bg: `${colors.success}1A` },
  draft: { label: 'Brouillon', color: colors.warning, bg: `${colors.warning}1A` },
  completed: { label: 'Termine', color: colors.textMuted, bg: 'rgba(124,116,102,0.14)' },
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
  const { user, profile } = useAuth();
  const avatarUrl = useAvatarUrl(user?.id, profile?.avatar_url);
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
    backgroundColor: colors.background,
  };

  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: insets.top + spacing.md,
    paddingBottom: spacing.sm,
    overflow: 'hidden',
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
  };

  const headerTitleStyle: TextStyle = {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    lineHeight: 32,
    color: colors.text,
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
          {/* Fond hero header + voile */}
          <ImageBackground
            source={sellerBackgrounds.headerGeneric}
            style={styles.headerBg}
            imageStyle={styles.headerBgImage}
            accessibilityIgnoresInvertColors
          />
          <LinearGradient
            colors={['rgba(10,9,8,0.45)', 'rgba(10,9,8,0.78)', 'rgba(10,9,8,0.96)']}
            style={styles.headerScrim}
            pointerEvents="none"
          />
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
              <LinearGradient
                colors={[...gradients.gold] as unknown as readonly [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.newButtonGradient}
              >
                <Plus size={20} color={colors.onyx} strokeWidth={2} />
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => {
                impact('light');
                router.push(ROUTES.SELLER_PROFILE);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Voir mon profil"
            >
              <Avatar
                source={avatarUrl}
                fallback={profile?.full_name ?? 'U'}
                size="sm"
                border="highlight"
              />
            </Pressable>
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
                color={viewMode === 'grid' ? colors.onyx : colors.textMuted}
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
                color={viewMode === 'list' ? colors.onyx : colors.textMuted}
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
          <View style={styles.emptyStateWrap}>
            {/* Fond etat vide + voile */}
            <ImageBackground
              source={sellerBackgrounds.emptyState}
              style={styles.emptyStateBg}
              imageStyle={styles.emptyStateBgImage}
              accessibilityIgnoresInvertColors
            />
            <LinearGradient
              colors={['rgba(10,9,8,0.50)', 'rgba(10,9,8,0.82)']}
              style={styles.emptyStateScrim}
              pointerEvents="none"
            />
            <EmptyState
              icon={<CalendarDays size={34} color={colors.gold} strokeWidth={1.25} />}
              title="Aucun evenement ici"
              description="Creez votre premier evenement pour lancer votre billetterie."
              actionLabel="Creer un evenement"
              onAction={handleCreate}
            />
          </View>
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

        <View style={[styles.statusChip, { backgroundColor: 'rgba(10,9,8,0.62)' }]}>
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
          <CalendarDays size={13} color={colors.goldMuted} strokeWidth={1.75} />
          <Text style={styles.eventMetaText}>{formatShortDate(event.start_date)}</Text>
          <View style={styles.metaDot} />
          <MapPin size={13} color={colors.goldMuted} strokeWidth={1.75} />
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
          <LinearGradient
            colors={
              fillRate >= 80
                ? ([...gradients.terracotta] as unknown as readonly [string, string, ...string[]])
                : ([...gradients.gold] as unknown as readonly [string, string, ...string[]])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${fillRate}%` }]}
          />
        </View>

        <View style={styles.eventFooter}>
          <View style={styles.eventFooterItem}>
            <Ticket size={14} color={colors.goldBright} strokeWidth={1.75} />
            <Text style={styles.eventFooterText}>{event.tickets_sold} billets</Text>
          </View>
          <ChevronRight size={18} color={colors.textFaint} strokeWidth={1.5} />
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
        <View
          style={[
            styles.gridStatusChip,
            { backgroundColor: 'rgba(10,9,8,0.62)', borderColor: `${statusMeta.color}55` },
          ]}
        >
          <Text style={[styles.gridStatusText, { color: statusMeta.color }]}>
            {statusMeta.label}
          </Text>
        </View>
      </View>

      <View style={styles.gridBody}>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.gridMetaRow}>
          <CalendarDays size={11} color={colors.goldMuted} strokeWidth={1.75} />
          <Text style={styles.gridMetaText} numberOfLines={1}>
            {formatShortDate(event.start_date)}
          </Text>
        </View>
        <View style={styles.gridMetaRow}>
          <MapPin size={11} color={colors.goldMuted} strokeWidth={1.75} />
          <Text style={styles.gridMetaText} numberOfLines={1}>
            {event.city}
          </Text>
        </View>

        <View style={styles.gridProgressTrack}>
          <LinearGradient
            colors={
              fillRate >= 80
                ? ([...gradients.terracotta] as unknown as readonly [string, string, ...string[]])
                : ([...gradients.gold] as unknown as readonly [string, string, ...string[]])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gridProgressFill, { width: `${fillRate}%` }]}
          />
        </View>

        <View style={styles.gridFooter}>
          <Text style={styles.gridRevenue}>{formatFCFA(event.revenue)}</Text>
          <View style={styles.gridTicketsRow}>
            <Ticket size={12} color={colors.goldMuted} strokeWidth={1.75} />
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
  headerBg: {
    ...StyleSheet.absoluteFillObject,
  },
  headerBgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  headerScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  emptyStateWrap: {
    position: 'relative',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  emptyStateBg: {
    ...StyleSheet.absoluteFillObject,
  },
  emptyStateBgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  emptyStateScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  headerTitleBlock: {
    flex: 1,
    marginRight: spacing.md,
  },
  headerCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
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
    overflow: 'hidden',
    ...shadows.goldGlowSoft,
  },
  newButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: `${colors.gold}26`,
  },
  viewToggleButton: {
    width: 40,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleActive: {
    backgroundColor: colors.gold,
    ...shadows.goldGlowSoft,
  },
  resultCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
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
    borderColor: colors.border,
    backgroundColor: colors.glass,
  },
  filterChipActive: {
    backgroundColor: 'rgba(216,180,90,0.14)',
    borderColor: `${colors.gold}55`,
  },
  filterText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.goldBright,
    fontFamily: 'Inter_600SemiBold',
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
    backgroundColor: colors.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    overflow: 'hidden',
    ...shadows.card,
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
    paddingVertical: 3,
    borderWidth: 1,
  },
  gridStatusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.3,
  },
  gridBody: {
    padding: spacing.sm + 2,
  },
  gridTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
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
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 14,
    color: colors.textMuted,
    flexShrink: 1,
  },
  gridProgressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: `${colors.gold}14`,
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
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    color: colors.goldBright,
    flexShrink: 1,
  },
  gridTicketsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gridTicketsText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
  },
  eventCard: {
    backgroundColor: colors.elevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    overflow: 'hidden',
    ...shadows.card,
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
    backgroundColor: 'rgba(10,9,8,0.45)',
  },
  statusChip: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
  },
  statusChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.4,
  },
  revenueChip: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(10,9,8,0.62)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  revenueChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    color: colors.goldBright,
    letterSpacing: 0.3,
  },
  eventBody: {
    padding: spacing.md,
  },
  eventTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    letterSpacing: -0.2,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 4,
  },
  eventMetaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
    flexShrink: 1,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textFaint,
    marginHorizontal: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm + 2,
  },
  progressLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
  },
  progressValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    color: colors.text,
  },
  progressTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: `${colors.gold}14`,
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
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 15,
    color: colors.goldBright,
  },
});