/**
 * Reserver un lieu — demande de reservation de salle.
 *
 * Design "Minimalisme Africain Camerounais" :
 * - Header partage (ScreenHeader) + carte du lieu (image, nom, localisation)
 * - Selection de date (14 prochains jours en chips horizontales)
 * - Selection du type d'evenement (chips)
 * - Recapitulatif : tarif par jour + confirmation
 * - Contact de l'organisateur (WhatsApp)
 *
 * Donnees : venueService.fetchVenueDetail (mock, Supabase a terme).
 * Conventions : couleurs depuis lib/constants.ts, pas d'emojis.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MapPin, CheckCircle2, CalendarDays } from 'lucide-react-native';

import { ScreenHeader } from '@/components/profile/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { colors, typography, spacing, radius, shadows } from '@/lib/constants';
import { formatPrice } from '@/services/event.service';
import { venueService } from '@/services/venue.service';
import type { VenueWithPromotion } from '@/types';
import { useHaptics } from '@/hooks/useHaptics';
import { logger } from '@/lib/logger';

// ============================================================
// Helpers
// ============================================================

const DAYS_FR = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'] as const;
const MONTHS_FR_SHORT = [
  'janv.', 'fevr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'aout', 'sept.', 'oct.', 'nov.', 'dec.',
] as const;

interface DateOption {
  readonly key: string;
  readonly label: string;
  readonly day: string;
  readonly month: string;
}

function buildDateOptions(): readonly DateOption[] {
  const options: DateOption[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    options.push({
      key: date.toISOString().slice(0, 10),
      label: i === 0 ? "Aujourd'hui" : DAYS_FR[date.getDay()],
      day: String(date.getDate()),
      month: MONTHS_FR_SHORT[date.getMonth()],
    });
  }
  return options;
}

function openWhatsApp(phone: string, message: string): void {
  const encoded = encodeURIComponent(message);
  Linking.openURL(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encoded}`).catch(
    () => {
      // Silent fail hors ligne
    }
  );
}

// ============================================================
// Ecran
// ============================================================

export default function VenueReserveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { impact, notification } = useHaptics();

  const [venue, setVenue] = useState<VenueWithPromotion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const dateOptions = useMemo(() => buildDateOptions(), []);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const detail = await venueService.fetchVenueDetail(params.id);
        if (cancelled || !detail) {
          setIsLoading(false);
          return;
        }
        setVenue(detail);
        setSelectedDate(dateOptions[0]?.key ?? null);
        setSelectedType(detail.event_types[0] ?? null);
      } catch (err) {
        logger.error('[VenueReserve] load error:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id, dateOptions]);

  const handleConfirm = useCallback(() => {
    if (!selectedDate || !selectedType || !venue) return;
    impact('medium');
    notification('success');
    setIsConfirmed(true);
  }, [selectedDate, selectedType, venue, impact, notification]);

  const handleContact = useCallback(() => {
    if (!venue) return;
    impact('medium');
    const message = `Bonjour, je souhaite reserver le lieu "${venue.name}" le ${selectedDate ?? ''} (${selectedType ?? ''}) via Rivald'Event.`;
    openWhatsApp('+237699887766', message);
  }, [impact, venue, selectedDate, selectedType]);

  const handleDone = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  const pricePerDay = venue?.price_per_day ?? 0;

  const chipStyle = (active: boolean) => ({
    backgroundColor: active ? colors.forest : colors.white,
    borderColor: active ? colors.forest : `${colors.border}60`,
  });

  const chipTextStyle = (active: boolean) => ({
    color: active ? colors.sand : colors.stone,
  });

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Reserver ce lieu"
          subtitle="Choisissez votre date et le type d'evenement"
        />

        {isLoading || !venue ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.forest} size="large" />
          </View>
        ) : isConfirmed ? (
          /* ============ CONFIRMATION ============ */
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <CheckCircle2 size={34} color={colors.forest} strokeWidth={1.75} />
            </View>
            <Text style={styles.confirmTitle}>Demande envoyee</Text>
            <Text style={styles.confirmText}>
              Votre demande de reservation pour "{venue.name}" le{' '}
              {selectedDate ?? ''} ({selectedType ?? ''}) a bien ete
              enregistree. Contactez l'organisateur pour finaliser.
            </Text>
            <View style={styles.confirmButtonWrap}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleContact}
              >
                Contacter l'organisateur
              </Button>
            </View>
            <Pressable
              onPress={handleDone}
              hitSlop={8}
              style={styles.doneLink}
              accessibilityRole="button"
              accessibilityLabel="Terminer"
            >
              <Text style={styles.doneLinkText}>Terminer</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* ============ CARTE DU LIEU ============ */}
            <View style={styles.venueCard}>
              <Image
                source={{ uri: venue.images[0] ?? '' }}
                style={styles.venueImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
              <View style={styles.venueInfo}>
                <Text style={styles.venueName} numberOfLines={1}>
                  {venue.name}
                </Text>
                <View style={styles.venueLocationRow}>
                  <MapPin size={13} color={colors.stone} strokeWidth={1.5} />
                  <Text style={styles.venueLocation} numberOfLines={1}>
                    {venue.address ?? venue.city ?? 'Adresse non precisee'}
                  </Text>
                </View>
              </View>
            </View>

            {/* ============ DATE ============ */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>DATE SOUHAITEE</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg }}
              >
                {dateOptions.map((option) => {
                  const active = selectedDate === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      onPress={() => {
                        impact('light');
                        setSelectedDate(option.key);
                      }}
                      style={[styles.dateChip, chipStyle(active)]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.dateLabel, chipTextStyle(active)]}>
                        {option.label}
                      </Text>
                      <Text style={[styles.dateDay, chipTextStyle(active)]}>
                        {option.day}
                      </Text>
                      <Text style={[styles.dateMonth, chipTextStyle(active)]}>
                        {option.month}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* ============ TYPE D'EVENEMENT ============ */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TYPE D'EVENEMENT</Text>
              <View style={styles.typeWrap}>
                {venue.event_types.map((type) => {
                  const active = selectedType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => {
                        impact('light');
                        setSelectedType(type);
                      }}
                      style={[styles.typeChip, chipStyle(active)]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.typeText, chipTextStyle(active)]}>
                        {type}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ============ RECAPITULATIF ============ */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <CalendarDays size={17} color={colors.goldDark} strokeWidth={1.75} />
                <Text style={styles.summaryLabel}>Tarif par jour</Text>
                <Text style={styles.summaryValue}>
                  {pricePerDay > 0 ? formatPrice(pricePerDay) : 'Sur demande'}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <CalendarDays size={17} color={colors.goldDark} strokeWidth={1.75} />
                <Text style={styles.summaryLabel}>Total (1 jour)</Text>
                <Text style={[styles.summaryValue, styles.summaryTotal]}>
                  {pricePerDay > 0 ? formatPrice(pricePerDay) : 'A definir'}
                </Text>
              </View>
            </View>

            <View style={styles.reserveButtonWrap}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleConfirm}
              >
                Envoyer la demande
              </Button>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  loadingWrap: {
    paddingVertical: spacing.xxl * 2,
    alignItems: 'center',
  },

  // -- Carte lieu --
  venueCard: {
    marginTop: -spacing.md,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.border}60`,
    overflow: 'hidden',
    ...shadows.card,
  },
  venueImage: {
    height: 140,
    width: '100%',
  },
  venueInfo: {
    padding: spacing.md,
  },
  venueName: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 17,
    lineHeight: 23,
    color: colors.onyx,
    letterSpacing: -0.2,
  },
  venueLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs / 2,
  },
  venueLocation: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.stone,
    marginLeft: spacing.xs / 2,
  },

  // -- Sections --
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 16,
    color: colors.stone,
    letterSpacing: 1.6,
    marginBottom: spacing.sm + 2,
    marginLeft: spacing.xs,
  },
  dateChip: {
    width: 62,
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.sm,
  },
  dateLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    lineHeight: 14,
  },
  dateDay: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    lineHeight: 24,
    marginTop: 2,
  },
  dateMonth: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    lineHeight: 13,
  },
  typeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
  },
  typeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 17,
  },

  // -- Recapitulatif --
  summaryCard: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.border}60`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    flex: 1,
    marginLeft: spacing.md,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onyx,
  },
  summaryValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onyx,
  },
  summaryTotal: {
    color: colors.terracotta,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: `${colors.stone}18`,
  },
  reserveButtonWrap: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
  },

  // -- Confirmation --
  confirmCard: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.border}60`,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.card,
  },
  confirmIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.forest}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  confirmTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 19,
    lineHeight: 26,
    color: colors.onyx,
  },
  confirmText: {
    ...typography.body,
    color: colors.stone,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  confirmButtonWrap: {
    alignSelf: 'stretch',
  },
  doneLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  doneLinkText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone,
  },
});