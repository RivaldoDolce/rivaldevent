/**
 * Page detail d'un evenement - Ecran client.
 *
 * Design premium « Noir & Or » :
 * - Image hero 320px pleine largeur avec dégradé sombre du bas vers le haut
 * - Bouton retour pastille verre + favori/partage pastilles verre
 * - Badge catégorie verre doré, prix sur l'image
 * - Titre Playfair, infos date/heure/lieu en carte verre
 * - Galerie d'images horizontale avec indicateur dots
 * - Description riche avec « Lire la suite »
 * - Section billets avec cartes ornées par tier
 * - Section organisateur premium avec Avatar + badge vérifié
 * - Section « Evenements similaires » en carousel horizontal
 * - Barre fixe en bas : verre fumé avec filet doré + bouton « Réserver » dégradé or
 *
 * Conventions :
 * - lucide-react-native pour les icones
 * - Design tokens depuis lib/constants.ts
 * - expo-image pour les images, Animated natif (pas reanimated)
 * - Pas de type any, pas d'emojis, commentaires en francais
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  StyleSheet,
  PanResponder,
  Share,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, usePathname } from 'expo-router';
import {
  ChevronLeft,
  CalendarDays,
  MapPin,
  Clock,
  Heart,
  Share2,
  Users,
  ChevronRight,
  Star,
  BadgeCheck,
  Phone,
  Ticket,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import WhatsAppIcon from '@/assets/icons/WhatsApp.svg';

import { colors, spacing, radius, shadows, typography, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useOffline } from '@/hooks/useOffline';
import { eventService, formatPrice, formatDate, formatTime } from '@/services/event.service';
import { useFavoritesStore } from '@/stores/favorites-store';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import type { EventWithAvailability, TicketTierWithAvailability } from '@/types';

// ============================================================
// Constantes
// ============================================================

const HERO_HEIGHT = 320;
const GALLERY_ITEM_WIDTH = 110;
const GALLERY_ITEM_HEIGHT = 78;
const BOTTOM_BAR_HEIGHT = 108;

// ============================================================
// Helper : ouvrir WhatsApp
// ============================================================

function openWhatsApp(phone: string, message: string): void {
  const cleanPhone = phone.replace(/^\+?237/, '');
  const fullPhone = `237${cleanPhone}`;
  const encodedMessage = encodeURIComponent(message);
  const appUrl = `whatsapp://send?phone=${fullPhone}&text=${encodedMessage}`;
  const webUrl = `https://wa.me/${fullPhone}?text=${encodedMessage}`;

  Linking.canOpenURL(appUrl)
    .then((canOpen) => {
      if (canOpen) {
        Linking.openURL(appUrl);
      } else {
        Linking.openURL(webUrl).catch(() => {
          Alert.alert(
            'Impossible d\'ouvrir WhatsApp',
            'Verifiez que WhatsApp est installe sur votre appareil.',
          );
        });
      }
    })
    .catch(() => {
      Linking.openURL(webUrl).catch(() => {
        Alert.alert(
          'Impossible d\'ouvrir WhatsApp',
          'Verifiez que WhatsApp est installe sur votre appareil.',
        );
      });
    });
}

// ============================================================
// Helper : couleur de tier pour les cartes billets (palette sombre)
// ============================================================

function getTierAccent(tierName: string): { bg: string; border: string; text: string; icon: string } {
  const name = tierName.toUpperCase();
  if (name.includes('PREMIUM')) {
    return {
      bg: 'rgba(216,180,90,0.1)',
      border: `${colors.gold}40`,
      text: colors.goldBright,
      icon: colors.gold,
    };
  }
  if (name.includes('VIP')) {
    return {
      bg: 'rgba(127,167,206,0.1)',
      border: 'rgba(127,167,206,0.4)',
      text: colors.info,
      icon: colors.info,
    };
  }
  // Standard
  return {
    bg: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.12)',
    text: colors.textSecondary,
    icon: colors.goldMuted,
  };
}

// ============================================================
// Composant
// ============================================================

export default function EventDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ id: string }>();
  const { impact } = useHaptics();
  const isOffline = useOffline();

  const eventId = params.id;

  // -- State --
  const [event, setEvent] = useState<EventWithAvailability | null>(null);
  const [similarEvents, setSimilarEvents] = useState<{
    id: string;
    title: string;
    cover_image: string | null;
    start_date: string;
    city: string | null;
    min_price: number | null;
    category: string | null;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const galleryAutoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const panResponderRef = useRef<ReturnType<typeof PanResponder.create> | null>(null);

  // -- Favoris (etat global partage) --
  const eventIds = useFavoritesStore((s) => s.eventIds);
  const toggleEvent = useFavoritesStore((s) => s.toggleEvent);
  const isFavorited = eventIds.includes(eventId ?? '');

  // -- Auto-scroll du carrousel d'images --
  const resetAutoScroll = useCallback(() => {
    if (galleryAutoScrollRef.current) {
      clearTimeout(galleryAutoScrollRef.current);
    }
    if (!event || event.images === undefined || (Array.isArray(event.images) && event.images.length === 0 && !event.cover_image)) {
      return;
    }
    const imgs = event.cover_image
      ? event.images && event.images.length > 0 && !event.images.includes(event.cover_image)
        ? [event.cover_image, ...event.images]
        : event.images ?? (event.cover_image ? [event.cover_image] : [])
      : event.images ?? [];

    if (imgs.length <= 1) return;

    galleryAutoScrollRef.current = setTimeout(() => {
      setActiveGalleryIndex((prev) => (prev < imgs.length - 1 ? prev + 1 : 0));
      resetAutoScroll();
    }, 4000);
  }, [event]);

  // -- Gestion PanResponder pour swipe horizontal sur les images --
  useEffect(() => {
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx }) => Math.abs(dx) > 10,
      onPanResponderRelease: (_, { dx }) => {
        const imgs = event?.cover_image
          ? event.images && event.images.length > 0 && !event.images.includes(event.cover_image)
            ? [event.cover_image, ...event.images]
            : event.images ?? (event.cover_image ? [event.cover_image] : [])
          : event?.images ?? [];

        if (imgs.length <= 1) return;

        if (dx > 50) {
          setActiveGalleryIndex((prev) => (prev > 0 ? prev - 1 : imgs.length - 1));
          resetAutoScroll();
        } else if (dx < -50) {
          setActiveGalleryIndex((prev) => (prev < imgs.length - 1 ? prev + 1 : 0));
          resetAutoScroll();
        }
      },
    });
  }, [event, resetAutoScroll]);

  // -- Lancer l'auto-scroll au montage et quand l'event change --
  useEffect(() => {
    resetAutoScroll();
    return () => {
      if (galleryAutoScrollRef.current) {
        clearTimeout(galleryAutoScrollRef.current);
      }
    };
  }, [resetAutoScroll]);

  // -- Chargement des donnees --
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const detail = await eventService.fetchEventDetail(eventId);

        if (cancelled || !detail) {
          setIsLoading(false);
          return;
        }

        setEvent(detail);

        // Charger les evenements similaires avec la categorie
        const similarData = await eventService.fetchSimilarEvents(
          eventId,
          detail.category,
        );
        if (!cancelled) {
          setSimilarEvents(similarData);
        }
      } catch (err) {
        logger.error('[EventDetail] load error:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [eventId]);

  // -- Handlers --
  const handleBack = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  const handleToggleFavorite = useCallback(() => {
    impact('light');
    if (eventId) {
      toggleEvent(eventId);
    }
  }, [impact, toggleEvent, eventId]);

  const handleReserve = useCallback(() => {
    if (isOffline) {
      Alert.alert('Hors ligne', 'Pas de connexion internet. Verifiez votre reseau.');
      return;
    }
    impact('medium');
    router.push({
      pathname: ROUTES.PURCHASE_TICKETS,
      params: { id: eventId },
    });
  }, [impact, router, eventId, isOffline]);

  const handleContactWhatsApp = useCallback(() => {
    if (!event?.organizer?.phone) return;
    impact('medium');
    openWhatsApp(
      event.organizer.phone,
      `Bonjour, j'ai une question concernant l'evenement "${event.title}" du ${formatDate(event.start_date)} sur Rivald'Event.`,
    );
  }, [impact, event]);

  const handleCall = useCallback(() => {
    if (!event?.organizer?.phone) return;
    impact('light');
    Linking.openURL(`tel:${event.organizer.phone}`);
  }, [impact, event]);

  const handleSimilarPress = useCallback((similarId: string) => {
    impact('light');
    // Navigation contextuelle : on pousse le detail sur la stack de
    // l'onglet d'origine (Explorer, Favoris ou Home) pour que le
    // retour revienne toujours a la page de depart.
    const detailRoute = pathname.includes('/explore/')
      ? ROUTES.EXPLORE_EVENT_DETAIL
      : pathname.includes('/favorites/')
        ? ROUTES.FAVORITES_EVENT_DETAIL
        : ROUTES.EVENT_DETAIL;
    router.push({
      pathname: detailRoute,
      params: { id: similarId },
    });
  }, [impact, router, pathname]);

  // -- Donnees derivees --
  const minPrice = useMemo(() => {
    if (!event) return null;
    const prices = event.ticket_tiers.map((t) => t.price).filter((p) => p > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  }, [event]);

  const totalAvailable = useMemo(() => {
    if (!event) return 0;
    return event.tiers_with_availability.reduce((sum, t) => sum + t.available_quantity, 0);
  }, [event]);

  const handleShare = useCallback(async () => {
    if (!event) return;
    impact('light');
    const location = event.address ?? event.venue?.name ?? event.city ?? 'Lieu non precise';
    const priceText =
      minPrice !== null
        ? `Billets a partir de ${formatPrice(minPrice)}.`
        : 'Entree gratuite.';
    try {
      await Share.share({
        title: event.title,
        message: `Decouvrez "${event.title}" le ${formatDate(event.start_date)} a ${location} sur Rivald'Event. ${priceText}`,
      });
    } catch (err) {
      logger.debug('[EventDetail] share error:', err);
    }
  }, [impact, event, minPrice]);

  const displayImages = useMemo(() => {
    if (!event) return [];
    const cover = event.cover_image;
    const gallery = event.images ?? [];
    if (cover && !gallery.includes(cover)) {
      return [cover, ...gallery];
    }
    return gallery.length > 0 ? gallery : (cover ? [cover] : []);
  }, [event]);

  // Description tronquee a 180 caracteres
  const shouldTruncateDescription = useMemo(() => {
    return (event?.description?.length ?? 0) > 180;
  }, [event]);

  const displayDescription = useMemo(() => {
    if (!event?.description) return '';
    if (!shouldTruncateDescription || descriptionExpanded) return event.description;
    return event.description.slice(0, 180) + '...';
  }, [event, shouldTruncateDescription, descriptionExpanded]);

  // ============================================================
  // Loading state
  // ============================================================

  if (isLoading) {
    return <LoadingScreen message="Chargement de l'evenement..." />;
  }

  if (!event) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorTitle}>Evenement introuvable</Text>
        <Text style={styles.errorText}>Cet evenement n'existe pas ou a ete supprime.</Text>
        <View style={{ marginTop: spacing.lg, width: 200 }}>
          <Button variant="primary" size="md" onPress={handleBack}>
            Retour
          </Button>
        </View>
      </View>
    );
  }

  // ============================================================
  // Render
  // ============================================================

  const locationDisplay = event.address ?? event.venue?.name ?? event.city ?? 'Lieu non precise';

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingBottom: BOTTOM_BAR_HEIGHT + insets.bottom + spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* =============================================
            IMAGE HERO AVEC SWIPE — HAUTEUR PREMIUM
            ============================================= */}
        <View style={styles.heroContainer}>
          {/* Zone swipeable : uniquement l'image (les boutons restent cliquables) */}
          <View
            style={styles.heroSwipeArea}
            {...(panResponderRef.current ? panResponderRef.current.panHandlers : {})}
          >
            {displayImages.length > 0 ? (
              <Image
                source={{ uri: displayImages[activeGalleryIndex] ?? '' }}
                style={styles.heroImage}
                contentFit="cover"
                transition={400}
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.heroImage, styles.heroPlaceholder]}>
                <Text style={styles.heroPlaceholderText}>{event.title.charAt(0)}</Text>
              </View>
            )}
          </View>

          {/* Dégradé sombre du bas vers le haut */}
          <LinearGradient
            colors={['rgba(10,9,8,0)', 'rgba(10,9,8,0.4)', 'rgba(10,9,8,0.85)']}
            locations={[0, 0.5, 1]}
            style={StyleAbsoluteFill}
            pointerEvents="none"
          />

          {/* Filet doré haut */}
          <View pointerEvents="none" style={styles.goldEdge} />

          {/* Badge categorie — pastille verre doré */}
          {event.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{event.category.toUpperCase()}</Text>
            </View>
          )}

          {/* Bouton retour — pastille verre */}
          <Pressable
            onPress={handleBack}
            style={[styles.glassButton, { left: spacing.md, top: insets.top + spacing.sm }]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ChevronLeft size={22} color={colors.goldBright} strokeWidth={1.75} />
          </Pressable>

          {/* Boutons droite : Partage + Favori */}
          <View style={[styles.floatingButtonsContainer, { top: insets.top + spacing.sm }]}>
            <Pressable
              onPress={handleShare}
              style={styles.glassButton}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Partager"
            >
              <Share2 size={18} color={colors.goldBright} strokeWidth={1.75} />
            </Pressable>
            <Pressable
              onPress={handleToggleFavorite}
              style={styles.glassButton}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart
                size={18}
                color={isFavorited ? colors.terracotta : colors.goldBright}
                fill={isFavorited ? colors.terracotta : 'none'}
                strokeWidth={1.75}
              />
            </Pressable>
          </View>

          {/* Compteur d'images style dots */}
          {displayImages.length > 1 && (
            <View style={styles.imageDotsContainer}>
              {displayImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.imageDot,
                    activeGalleryIndex === index && styles.imageDotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Prix hero en bas a droite */}
          {minPrice !== null && (
            <View style={styles.heroPriceBadge}>
              <Text style={styles.heroPriceFrom}>A partir de</Text>
              <Text style={styles.heroPriceValue}>{formatPrice(minPrice)}</Text>
            </View>
          )}
        </View>

        {/* =============================================
            GALERIE MINIATURES
            ============================================= */}
        {displayImages.length > 1 && (
          <View style={styles.galleryContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {displayImages.map((img, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    impact('light');
                    setActiveGalleryIndex(index);
                  }}
                  style={[
                    styles.galleryItem,
                    activeGalleryIndex === index && styles.galleryItemActive,
                  ]}
                >
                  <Image
                    source={{ uri: img }}
                    style={styles.galleryItemImage}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                  {activeGalleryIndex === index && (
                    <View style={styles.galleryItemOverlay} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* =============================================
            CONTENU PRINCIPAL
            ============================================= */}
        <View style={styles.content}>
          {/* Titre premium */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Infos rapides : date + heure + lieu dans une carte verre */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <CalendarDays size={15} color={colors.goldMuted} strokeWidth={1.75} />
              <Text style={styles.infoText}>{formatDate(event.start_date)}</Text>
              <View style={styles.infoDot} />
              <Clock size={15} color={colors.goldMuted} strokeWidth={1.75} />
              <Text style={styles.infoText}>{formatTime(event.start_date)}</Text>
            </View>
            <View style={styles.infoRow}>
              <MapPin size={15} color={colors.goldMuted} strokeWidth={1.75} />
              <Text style={[styles.infoText, { flex: 1 }]} numberOfLines={1}>
                {locationDisplay}
              </Text>
              {event.city && (
                <View style={styles.cityBadge}>
                  <Text style={styles.cityBadgeText}>{event.city}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Separateur or premium */}
          <View style={styles.goldSeparator}>
            <View style={styles.goldSeparatorLine} />
            <View style={styles.goldSeparatorDiamond} />
            <View style={styles.goldSeparatorLine} />
          </View>

          {/* Description avec "Lire la suite" */}
          {event.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionOverline}>L'EVENEMENT</Text>
              <Text style={styles.sectionTitle}>A propos</Text>
              <Text style={styles.descriptionText}>{displayDescription}</Text>
              {shouldTruncateDescription && (
                <Pressable
                  onPress={() => setDescriptionExpanded((prev) => !prev)}
                  hitSlop={8}
                >
                  <Text style={styles.readMoreText}>
                    {descriptionExpanded ? 'Voir moins' : 'Lire la suite'}
                  </Text>
                </Pressable>
              )}
            </View>
          ) : null}

          {/* =============================================
              BILLETS DISPONIBLES — CARTES ORNEES PREMIUM
              ============================================= */}
          {event.ticket_tiers.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionOverline}>PLACES & TARIFS</Text>
                  <Text style={styles.sectionTitle}>Billets</Text>
                </View>
                <View style={styles.availabilityChip}>
                  <Users size={12} color={colors.success} strokeWidth={2} />
                  <Text style={styles.availabilityText}>
                    {totalAvailable > 0
                      ? `${totalAvailable} disponible${totalAvailable > 1 ? 's' : ''}`
                      : 'Complet'
                    }
                  </Text>
                </View>
              </View>

              <View style={styles.tiersList}>
                {event.ticket_tiers.map((tier) => (
                  <TierPreviewCard key={tier.id} tier={tier} />
                ))}
              </View>

              <View style={styles.reserveInlineSection}>
                <Text style={styles.reserveInlineLabel}>Reservation rapide</Text>
                <View style={{ width: 180 }}>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={totalAvailable === 0}
                    onPress={handleReserve}
                  >
                    {totalAvailable === 0 ? 'Complet' : 'Reserver'}
                  </Button>
                </View>
              </View>
            </View>
          ) : null}

          {/* =============================================
              ORGANISATEUR — CARTE PREMIUM
              ============================================= */}
          <View style={styles.section}>
            <Text style={styles.sectionOverline}>ORGANISATEUR</Text>
            <View style={styles.organizerCard}>
              <View style={styles.organizerBody}>
                <View style={styles.organizerAvatarWrapper}>
                  <Avatar
                    source={event.organizer?.avatar_url ?? null}
                    fallback={event.organizer?.full_name ?? 'O'}
                    size="md"
                    border="highlight"
                  />
                </View>

                <View style={styles.organizerIdentity}>
                  <Text style={styles.organizerName}>
                    {event.organizer?.full_name ?? 'Organisateur'}
                  </Text>
                  <View style={{ marginTop: spacing.sm }}>
                    <Badge variant="pro">
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <BadgeCheck size={12} color={colors.goldBright} strokeWidth={2} />
                        <Text style={styles.verifiedText}>Organisateur verifie</Text>
                      </View>
                    </Badge>
                  </View>
                </View>
              </View>

              {/* Boutons de contact */}
              <View style={styles.contactButtons}>
                <Pressable
                  onPress={handleContactWhatsApp}
                  style={styles.whatsappButton}
                  accessibilityRole="button"
                  accessibilityLabel="Contacter via WhatsApp"
                >
                  <WhatsAppIcon width={22} height={22} />
                  <Text style={styles.contactButtonText}>WhatsApp</Text>
                </Pressable>
                <Pressable
                  onPress={handleCall}
                  style={styles.callButton}
                  accessibilityRole="button"
                  accessibilityLabel="Appeler l'organisateur"
                >
                  <Phone size={18} color={colors.goldBright} strokeWidth={1.75} />
                  <Text style={styles.contactButtonText}>Appeler</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* =============================================
              EVENEMENTS SIMILAIRES
              ============================================= */}
          {similarEvents.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionOverline}>POUR CONTINUER</Text>
                  <Text style={styles.sectionTitle}>Evenements similaires</Text>
                </View>
                <Pressable
                  onPress={() => {
                    impact('light');
                    router.push('/(client)/explore');
                  }}
                  hitSlop={12}
                >
                  <View style={styles.seeAllRow}>
                    <Text style={styles.seeAllText}>Voir tout</Text>
                    <ChevronRight size={15} color={colors.gold} strokeWidth={2} />
                  </View>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.lg }}
              >
                {similarEvents.map((similar) => (
                  <Pressable
                    key={similar.id}
                    onPress={() => handleSimilarPress(similar.id)}
                    style={styles.similarCard}
                  >
                    <View style={styles.similarImageContainer}>
                      {similar.cover_image ? (
                        <Image
                          source={{ uri: similar.cover_image }}
                          style={styles.similarImage}
                          contentFit="cover"
                          transition={300}
                          cachePolicy="memory-disk"
                        />
                      ) : (
                        <View style={[styles.similarImage, styles.heroPlaceholder]}>
                          <Text style={styles.heroPlaceholderText}>
                            {similar.title.charAt(0)}
                          </Text>
                        </View>
                      )}
                      <LinearGradient
                        colors={['rgba(10,9,8,0.02)', 'rgba(10,9,8,0.6)']}
                        style={StyleAbsoluteFill}
                        pointerEvents="none"
                      />
                      {similar.category && (
                        <View style={styles.similarBadge}>
                          <Text style={styles.similarBadgeText}>{similar.category}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.similarTitle} numberOfLines={2}>
                      {similar.title}
                    </Text>
                    <View style={styles.similarMeta}>
                      <CalendarDays size={12} color={colors.goldMuted} strokeWidth={1.5} />
                      <Text style={styles.similarDateText}>
                        {formatDate(similar.start_date)}
                      </Text>
                    </View>
                    {similar.min_price !== null && similar.min_price > 0 && (
                      <Text style={styles.similarPrice}>
                        {formatPrice(similar.min_price)}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* =============================================
          BARRE FIXE EN BAS — VERRE FUME AVEC FILET DORE
          ============================================= */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom || spacing.md, paddingHorizontal: spacing.md },
        ]}
      >
        <View pointerEvents="none" style={styles.bottomBarHairline} />
        <View style={styles.bottomBarContent}>
          <View style={styles.bottomBarPriceContainer}>
            <Text style={styles.bottomBarPriceLabel}>A partir de</Text>
            <Text style={styles.bottomBarPriceValue}>
              {minPrice !== null ? formatPrice(minPrice) : 'Gratuit'}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Button
              variant="primary"
              size="md"
              fullWidth
              disabled={totalAvailable === 0}
              onPress={handleReserve}
              icon={<Ticket size={18} strokeWidth={1.9} />}
              iconPosition="right"
            >
              {totalAvailable === 0 ? 'Complet' : 'Reserver'}
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}

// ============================================================
// Sous-composant : Carte premium d'un tier de billet
// ============================================================

function TierPreviewCard({ tier }: { readonly tier: TicketTierWithAvailability }) {
  const accent = getTierAccent(tier.name);

  return (
    <View
      style={[
        styles.tierCard,
        { backgroundColor: accent.bg, borderColor: accent.border },
        tier.is_sold_out && styles.tierCardSoldOut,
      ]}
    >
      {/* Indicateur lateral colore */}
      <View style={[styles.tierSideIndicator, { backgroundColor: accent.icon }]} />

      <View style={styles.tierInfo}>
        <View style={styles.tierNameRow}>
          <Star size={13} color={accent.icon} strokeWidth={2} />
          <Text
            style={[
              styles.tierName,
              { color: accent.text },
              tier.is_sold_out && styles.tierNameSoldOut,
            ]}
          >
            {tier.name}
          </Text>
        </View>
        {tier.description ? (
          <Text style={styles.tierDescription} numberOfLines={1}>
            {tier.description}
          </Text>
        ) : null}
        {tier.is_low_stock && !tier.is_sold_out ? (
          <Text style={styles.tierLowStock}>Plus que {tier.available_quantity} disponibles</Text>
        ) : null}
      </View>
      <View style={styles.tierPriceSection}>
        <Text style={[styles.tierPrice, { color: accent.text }]}>{formatPrice(tier.price)}</Text>
        <Text style={styles.tierAvailability}>
          {tier.is_sold_out
            ? 'Complet'
            : `${tier.available_quantity} / ${tier.quantity_total}`
          }
        </Text>
      </View>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const StyleAbsoluteFill: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const styles = {
  // -- Ecran --
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  scrollView: {
    flex: 1,
  } as ViewStyle,

  // -- Erreur --
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  } as ViewStyle,
  errorTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    textAlign: 'center',
  } as TextStyle,
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
  } as TextStyle,

  // -- Hero premium --
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  } as ViewStyle,
  heroSwipeArea: {
    ...StyleSheet.absoluteFillObject,
  } as ViewStyle,
  heroImage: {
    width: '100%',
    height: HERO_HEIGHT,
  } as ImageStyle,
  heroPlaceholder: {
    backgroundColor: colors.raised,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  heroPlaceholderText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 72,
    lineHeight: 80,
    color: `${colors.gold}33`,
  } as TextStyle,
  goldEdge: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
    right: spacing.md,
    height: 1,
    backgroundColor: `${colors.goldBright}4D`,
  } as ViewStyle,

  // -- Pastilles verre --
  glassButton: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: 'rgba(10,9,8,0.62)',
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  } as ViewStyle,
  floatingButtonsContainer: {
    position: 'absolute',
    right: spacing.md,
    flexDirection: 'column',
    gap: spacing.sm,
  } as ViewStyle,

  // -- Badge categorie --
  categoryBadge: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    backgroundColor: 'rgba(10,9,8,0.62)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  } as ViewStyle,
  categoryBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    color: colors.goldBright,
    letterSpacing: 1,
  } as TextStyle,

  // -- Indicateur dots --
  imageDotsContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: 6,
  } as ViewStyle,
  imageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  } as ViewStyle,
  imageDotActive: {
    width: 20,
    borderRadius: 3,
    backgroundColor: colors.gold,
  } as ViewStyle,

  // -- Prix hero --
  heroPriceBadge: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(26,22,16,0.72)',
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  } as ViewStyle,
  heroPriceFrom: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    lineHeight: 12,
    color: colors.textSecondary,
    letterSpacing: 0.9,
  } as TextStyle,
  heroPriceValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    lineHeight: 18,
    color: colors.goldBright,
  } as TextStyle,

  // -- Galerie --
  galleryContainer: {
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
  } as ViewStyle,
  galleryItem: {
    width: GALLERY_ITEM_WIDTH,
    height: GALLERY_ITEM_HEIGHT,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  } as ViewStyle,
  galleryItemActive: {
    borderWidth: 1.5,
    borderColor: colors.gold,
  } as ViewStyle,
  galleryItemImage: {
    width: GALLERY_ITEM_WIDTH,
    height: GALLERY_ITEM_HEIGHT,
  } as ImageStyle,
  galleryItemOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(216,180,90,0.14)',
  } as ViewStyle,

  // -- Contenu principal --
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  } as ViewStyle,
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.md,
  } as TextStyle,

  // -- Carte infos verre --
  infoCard: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  } as ViewStyle,
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  } as ViewStyle,
  infoText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    letterSpacing: 0.1,
  } as TextStyle,
  infoDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textFaint,
  } as ViewStyle,
  cityBadge: {
    backgroundColor: 'rgba(216,180,90,0.1)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  } as ViewStyle,
  cityBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    color: colors.goldBright,
    letterSpacing: 0.2,
  } as TextStyle,

  // -- Separateur or premium avec losange --
  goldSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  } as ViewStyle,
  goldSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: `${colors.gold}30`,
  } as ViewStyle,
  goldSeparatorDiamond: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
  } as ViewStyle,

  // -- Sections --
  section: {
    marginBottom: spacing.xl,
  } as ViewStyle,
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  } as ViewStyle,
  sectionOverline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    color: colors.goldMuted,
    marginBottom: 3,
  } as TextStyle,
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    lineHeight: 27,
    color: colors.text,
    letterSpacing: -0.3,
  } as TextStyle,

  // -- Description --
  descriptionText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 26,
    letterSpacing: 0.1,
  } as TextStyle,
  readMoreText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.goldBright,
    marginTop: spacing.sm,
    letterSpacing: 0.2,
  } as TextStyle,

  // -- Disponibilite --
  availabilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(91,196,139,0.12)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(91,196,139,0.35)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  } as ViewStyle,
  availabilityText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.success,
    letterSpacing: 0.1,
  } as TextStyle,

  // -- Tiers de billets premium --
  tiersList: {
    gap: spacing.sm,
  } as ViewStyle,
  tierCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    ...shadows.card,
  } as ViewStyle,
  tierCardSoldOut: {
    opacity: 0.5,
  } as ViewStyle,
  tierSideIndicator: {
    position: 'absolute',
    left: 0,
    top: spacing.md,
    bottom: spacing.md,
    width: 4,
    borderRadius: 2,
  } as ViewStyle,
  tierInfo: {
    flex: 1,
    marginRight: spacing.md,
  } as ViewStyle,
  tierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  } as ViewStyle,
  tierName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.5,
  } as TextStyle,
  tierNameSoldOut: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  } as TextStyle,
  tierDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 2,
  } as TextStyle,
  tierLowStock: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: colors.warning,
    marginTop: spacing.xs,
  } as TextStyle,
  tierPriceSection: {
    alignItems: 'flex-end',
  } as ViewStyle,
  tierPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 22,
  } as TextStyle,
  tierAvailability: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 14,
    color: colors.textMuted,
    marginTop: 2,
  } as TextStyle,

  // -- Reservation rapide --
  reserveInlineSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  } as ViewStyle,
  reserveInlineLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  } as TextStyle,

  // -- Organisateur premium --
  organizerCard: {
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginTop: spacing.sm,
    ...shadows.eventCard,
  } as ViewStyle,
  organizerBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  } as ViewStyle,
  organizerAvatarWrapper: {
    marginRight: spacing.md,
  } as ViewStyle,
  organizerIdentity: {
    flex: 1,
  } as ViewStyle,
  organizerName: {
    ...typography.bodyMedium,
    color: colors.text,
    letterSpacing: -0.1,
  } as TextStyle,
  verifiedText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 14,
    color: colors.goldBright,
    letterSpacing: 0.2,
  } as TextStyle,

  // -- Boutons contact --
  contactButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  } as ViewStyle,
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    backgroundColor: 'rgba(216,180,90,0.08)',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  } as ViewStyle,
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    backgroundColor: colors.glass,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  } as ViewStyle,
  contactButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    letterSpacing: 0.2,
  } as TextStyle,

  // -- Voir tout --
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  seeAllText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.goldBright,
    letterSpacing: 0.2,
  } as TextStyle,

  // -- Similaires --
  similarCard: {
    width: 180,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.card,
  } as ViewStyle,
  similarImageContainer: {
    height: 110,
    position: 'relative',
  } as ViewStyle,
  similarImage: {
    width: '100%',
    height: 110,
  } as ImageStyle,
  similarBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(10,9,8,0.62)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  } as ViewStyle,
  similarBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    color: colors.goldBright,
    letterSpacing: 0.3,
  } as TextStyle,
  similarTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
    letterSpacing: -0.2,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  } as TextStyle,
  similarMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
  } as ViewStyle,
  similarDateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  } as TextStyle,
  similarPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.goldBright,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  } as TextStyle,

  // -- Barre fixe bas verre fumé --
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(19,17,16,0.94)',
    paddingTop: spacing.sm,
    zIndex: 100,
    elevation: 12,
  } as ViewStyle,
  bottomBarHairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: `${colors.gold}2E`,
  } as ViewStyle,
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  bottomBarPriceContainer: {
    flexDirection: 'column',
    minWidth: 96,
  } as ViewStyle,
  bottomBarPriceLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 14,
    color: colors.textMuted,
  } as TextStyle,
  bottomBarPriceValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.goldBright,
  } as TextStyle,
} as const;