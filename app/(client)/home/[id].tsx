/**
 * Page detail d'un evenement - Ecran client.
 *
 * Design premium "Minimalisme Africain Camerounais" :
 * - Image hero plein ecran avec parallaxe et gradient overlay premium
 * - Bouton retour et favori flottants avec glassmorphism
 * - Badge categorie avec glow terracotta
 * - Titre PlayfairDisplay-Bold avec ombre douce
 * - Infos date/heure/lieu avec chips elegants et icones lucide
 * - Galerie d'images horizontale avec indicateur dots
 * - Description riche avec "Lire la suite"
 * - Section billets avec cartes gradient par tier
 * - Section organisateur premium avec avatar, verifie, WhatsApp + appel
 * - Section "Evenements similaires" en carousel horizontal
 * - Barre fixe en bas avec glassmorphism : prix + CTA "Reserver"
 *
 * Conventions :
 * - lucide-react-native pour les icones
 * - Design tokens depuis lib/constants.ts
 * - expo-image pour les images
 * - Animated natif (pas reanimated)
 * - Pas de type any, pas d'emojis
 * - Imports @/
 * - Commentaires en francais
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  ActivityIndicator,
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
  Ticket,
  ChevronRight,
  Star,
  ShieldCheck,
  Phone,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import WhatsAppIcon from '@/assets/icons/WhatsApp.svg';

import { colors, spacing, radii, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useOffline } from '@/hooks/useOffline';
import { eventService, formatPrice, formatDate, formatTime } from '@/services/event.service';
import { useFavoritesStore } from '@/stores/favorites-store';
import { logger } from '@/lib/logger';
import type { EventWithAvailability, TicketTierWithAvailability } from '@/types';

// ============================================================
// Constantes
// ============================================================

const HERO_HEIGHT = 300;
const GALLERY_ITEM_WIDTH = 110;
const GALLERY_ITEM_HEIGHT = 78;
const BOTTOM_BAR_HEIGHT = 76;

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
// Helper : couleur de tier pour les cartes billets
// ============================================================

function getTierAccent(tierName: string): { bg: string; border: string; text: string; icon: string } {
  const name = tierName.toUpperCase();
  if (name.includes('PREMIUM')) {
    return {
      bg: `${colors.gold}12`,
      border: `${colors.gold}40`,
      text: colors.gold,
      icon: colors.gold,
    };
  }
  if (name.includes('VIP')) {
    return {
      bg: `${colors.forest}12`,
      border: `${colors.forest}40`,
      text: colors.forest,
      icon: colors.forest,
    };
  }
  // Standard
  return {
    bg: `${colors.stone}08`,
    border: `${colors.stone}25`,
    text: colors.stone,
    icon: colors.stone,
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
    // Navigation contextuelle : si on est dans l'onglet Explorer,
    // pousser sur la stack Explorer ; sinon sur la stack Home
    const detailRoute = pathname.includes('/explore/')
      ? ROUTES.EXPLORE_EVENT_DETAIL
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
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.terracotta} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorTitle}>Evenement introuvable</Text>
        <Text style={styles.errorText}>Cet evenement n'existe pas ou a ete supprime.</Text>
        <Pressable onPress={handleBack} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Retour</Text>
        </Pressable>
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

          {/* Gradient overlay premium — triple couche */}
          <LinearGradient
            colors={['transparent', 'rgba(26,24,22,0.3)', 'rgba(26,24,22,0.85)']}
            locations={[0, 0.4, 1]}
            style={styles.heroGradient}
            pointerEvents="none"
          />

          {/* Badge categorie avec glow */}
          {event.category && (
            <View style={styles.categoryBadgeWrapper}>
              <View style={styles.categoryBadgeGlow} />
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{event.category.toUpperCase()}</Text>
              </View>
            </View>
          )}

          {/* Bouton retour — style page detail lieu */}
          <Pressable
            onPress={handleBack}
            style={[styles.glassButton, { left: spacing.md, top: insets.top + spacing.sm }]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ChevronLeft size={24} color={colors.onyx} strokeWidth={2.5} />
          </Pressable>

          {/* Boutons droite glassmorphism : Partage + Favori */}
          <View style={[styles.floatingButtonsContainer, { top: insets.top + spacing.sm }]}>
            <Pressable
              onPress={handleShare}
              style={styles.glassButton}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Partager"
            >
              <Share2 size={20} color={colors.onyx} strokeWidth={2} />
            </Pressable>
            <Pressable
              onPress={handleToggleFavorite}
              style={styles.glassButton}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart
                size={20}
                color={isFavorited ? colors.terracotta : colors.onyx}
                fill={isFavorited ? colors.terracotta : 'none'}
                strokeWidth={2}
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

          {/* Infos rapides : date + heure dans des chips premium */}
          <View style={styles.infoRow}>
            <View style={styles.infoChip}>
              <CalendarDays size={16} color={colors.terracotta} strokeWidth={1.5} />
              <Text style={styles.infoText}>{formatDate(event.start_date)}</Text>
            </View>
            <View style={styles.infoChip}>
              <Clock size={16} color={colors.terracotta} strokeWidth={1.5} />
              <Text style={styles.infoText}>{formatTime(event.start_date)}</Text>
            </View>
          </View>

          {/* Lieu avec icone MapPin */}
          <View style={styles.locationRow}>
            <MapPin size={16} color={colors.stone} strokeWidth={1.5} />
            <Text style={styles.locationText}>{locationDisplay}</Text>
            {event.city && (
              <View style={styles.cityBadge}>
                <Text style={styles.cityBadgeText}>{event.city}</Text>
              </View>
            )}
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
              BILLETS DISPONIBLES — CARTES GRADIENT PREMIUM
              ============================================= */}
          {event.ticket_tiers.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Billets</Text>
                <View style={styles.availabilityChip}>
                  <Users size={12} color={colors.forest} strokeWidth={2} />
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
                <Pressable
                  onPress={handleReserve}
                  style={[
                    styles.reserveInlineButton,
                    totalAvailable === 0 && styles.reserveButtonDisabled,
                  ]}
                  disabled={totalAvailable === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Reserver des billets"
                >
                  <Text style={styles.reserveInlineButtonText}>
                    {totalAvailable === 0 ? 'Complet' : 'Reserver'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* =============================================
              ORGANISATEUR — DESIGN PREMIUM REPUSE
              ============================================= */}
          <View style={styles.section}>
            <View style={styles.organizerCard}>
              {/* En-tete : libelle a l'interieur du carde */}
              <View style={styles.organizerCardHeader}>
                <Text style={styles.organizerCardTitle}>Organisateur</Text>
                <View style={styles.organizerHeaderBadge}>
                  <ShieldCheck size={15} color={colors.forest} strokeWidth={2} />
                </View>
              </View>

              {/* Separateur subtil avec accent or */}
              <View style={styles.organizerDivider}>
                <View style={styles.organizerDividerAccent} />
              </View>

              {/* Identite : avatar + nom, bien aere */}
              <View style={styles.organizerBody}>
                <View style={styles.organizerAvatarWrapper}>
                  <View style={styles.organizerAvatar}>
                    {event.organizer?.avatar_url ? (
                      <Image
                        source={{ uri: event.organizer.avatar_url }}
                        style={styles.organizerAvatarImage}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <Text style={styles.organizerAvatarFallback}>
                        {(event.organizer?.full_name ?? 'O').charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.organizerVerifiedBadge}>
                    <ShieldCheck size={12} color={colors.white} strokeWidth={2.5} />
                  </View>
                </View>

                <View style={styles.organizerIdentity}>
                  <Text style={styles.organizerName}>
                    {event.organizer?.full_name ?? 'Organisateur'}
                  </Text>
                  <View style={styles.verifiedChip}>
                    <ShieldCheck size={12} color={colors.forest} strokeWidth={2} />
                    <Text style={styles.verifiedText}>Organisateur verifie</Text>
                  </View>
                </View>
              </View>

              {/* Boutons de contact premium (design intact) */}
              <View style={styles.contactButtons}>
                <Pressable
                  onPress={handleContactWhatsApp}
                  style={styles.whatsappButton}
                  accessibilityRole="button"
                  accessibilityLabel="Contacter via WhatsApp"
                >
                  <WhatsAppIcon width={26} height={26} />
                  <Text style={styles.whatsappButtonText}>WhatsApp</Text>
                </Pressable>
                <Pressable
                  onPress={handleCall}
                  style={styles.callButton}
                  accessibilityRole="button"
                  accessibilityLabel="Appeler l'organisateur"
                >
                  <Phone size={24} color={colors.white} strokeWidth={2} />
                  <Text style={styles.callButtonText}>Appeler</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* =============================================
              EVENEMENTS SIMILAIRES
              ============================================= */}
          {similarEvents.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Evenements similaires</Text>
                <Pressable
                  onPress={() => {
                    impact('light');
                    router.push('/(client)/explore');
                  }}
                  hitSlop={12}
                >
                  <View style={styles.seeAllRow}>
                    <Text style={styles.seeAllText}>Voir tout</Text>
                    <ChevronRight size={16} color={colors.terracotta} strokeWidth={2} />
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
                      <CalendarDays size={12} color={colors.stone} strokeWidth={1.5} />
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
          BARRE FIXE EN BAS — GLASSMORPHISM PREMIUM
          ============================================= */}
      <LinearGradient
        colors={[`${colors.white}F2`, `${colors.white}F8`]}
        style={[styles.bottomBar, { paddingBottom: insets.bottom || spacing.md, paddingHorizontal: spacing.md }]}
      >
        <View style={styles.bottomBarContent}>
          <View style={styles.bottomBarPriceContainer}>
            <Text style={styles.bottomBarPriceLabel}>A partir de</Text>
            <Text style={styles.bottomBarPriceValue}>
              {minPrice !== null ? formatPrice(minPrice) : 'Gratuit'}
            </Text>
          </View>
          <Pressable
            onPress={handleReserve}
            style={[
              styles.reserveButton,
              totalAvailable === 0 && styles.reserveButtonDisabled,
            ]}
            disabled={totalAvailable === 0}
            accessibilityRole="button"
            accessibilityLabel="Reserver des billets"
          >
            <Ticket size={18} color={colors.white} strokeWidth={2} />
            <Text style={styles.reserveButtonText}>
              {totalAvailable === 0 ? 'Complet' : 'Reserver'}
            </Text>
          </Pressable>
        </View>
      </LinearGradient>
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
          <Star size={14} color={accent.icon} strokeWidth={2} />
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

const styles = {
  // -- Ecran --
  screen: {
    flex: 1,
    backgroundColor: colors.sand,
  } as ViewStyle,
  scrollView: {
    flex: 1,
  } as ViewStyle,

  // -- Loading --
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.sand,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  } as ViewStyle,
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    lineHeight: 20,
    color: colors.stone,
  } as TextStyle,

  // -- Erreur --
  errorContainer: {
    flex: 1,
    backgroundColor: colors.sand,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  } as ViewStyle,
  errorTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.onyx,
    textAlign: 'center',
  } as TextStyle,
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.stone,
    textAlign: 'center',
  } as TextStyle,
  errorButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.terracotta,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  } as ViewStyle,
  errorButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.white,
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
    backgroundColor: colors.ivory,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  heroPlaceholderText: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 72,
    lineHeight: 80,
    color: `${colors.stone}30`,
  } as TextStyle,
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  } as ViewStyle,

  // -- Glassmorphism boutons --
  glassButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.white + 'CC',
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

  // -- Badge categorie avec glow --
  categoryBadgeWrapper: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
  } as ViewStyle,
  categoryBadgeGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: radii.md + 4,
    backgroundColor: `${colors.terracotta}30`,
  } as ViewStyle,
  categoryBadge: {
    backgroundColor: colors.terracotta,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  } as ViewStyle,
  categoryBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    lineHeight: 14,
    color: colors.white,
    letterSpacing: 1,
  } as TextStyle,

  // -- Indicateur dots au lieu de compteur --
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
    backgroundColor: `${colors.white}50`,
  } as ViewStyle,
  imageDotActive: {
    width: 20,
    borderRadius: 3,
    backgroundColor: colors.white,
  } as ViewStyle,

  // -- Prix hero en bas a droite --
  heroPriceBadge: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    backgroundColor: `${colors.onyx}70`,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  } as ViewStyle,
  heroPriceFrom: {
    fontFamily: 'Inter-Medium',
    fontSize: 9,
    lineHeight: 12,
    color: `${colors.white}BB`,
    letterSpacing: 0.5,
  } as TextStyle,
  heroPriceValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    lineHeight: 18,
    color: colors.white,
  } as TextStyle,

  // -- Galerie --
  galleryContainer: {
    paddingVertical: spacing.sm,
    paddingLeft: spacing.lg,
  } as ViewStyle,
  galleryItem: {
    width: GALLERY_ITEM_WIDTH,
    height: GALLERY_ITEM_HEIGHT,
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  } as ViewStyle,
  galleryItemActive: {
    borderColor: colors.terracotta,
  } as ViewStyle,
  galleryItemImage: {
    width: GALLERY_ITEM_WIDTH,
    height: GALLERY_ITEM_HEIGHT,
  } as ImageStyle,
  galleryItemOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${colors.terracotta}15`,
    borderRadius: radii.sm,
  } as ViewStyle,

  // -- Contenu principal --
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  } as ViewStyle,
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
    lineHeight: 36,
    color: colors.onyx,
    letterSpacing: -0.5,
    marginBottom: spacing.md,
  } as TextStyle,

  // -- Infos rapides --
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  } as ViewStyle,
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.terracotta}10`,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  } as ViewStyle,
  infoText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.onyx,
    letterSpacing: 0.1,
  } as TextStyle,

  // -- Lieu --
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  } as ViewStyle,
  locationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone,
    flex: 1,
  } as TextStyle,
  cityBadge: {
    backgroundColor: `${colors.gold}15`,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  } as ViewStyle,
  cityBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 14,
    color: colors.gold,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.onyx,
    letterSpacing: -0.3,
  } as TextStyle,

  // -- Description --
  descriptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 24,
    color: `${colors.onyx}CC`,
    letterSpacing: 0.1,
  } as TextStyle,
  readMoreText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.terracotta,
    marginTop: spacing.sm,
    letterSpacing: 0.2,
  } as TextStyle,

  // -- Disponibilite --
  availabilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.forest}12`,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  } as ViewStyle,
  availabilityText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.forest,
    letterSpacing: 0.1,
  } as TextStyle,

  // -- Tiers de billets premium --
  tiersList: {
    gap: spacing.sm,
  } as ViewStyle,
  tierCard: {
    borderRadius: radii.lg,
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
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.5,
  } as TextStyle,
  tierNameSoldOut: {
    textDecorationLine: 'line-through',
    color: colors.stone,
  } as TextStyle,
  tierDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
    marginTop: 2,
  } as TextStyle,
  tierLowStock: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: colors.mango,
    marginTop: spacing.xs,
  } as TextStyle,
  tierPriceSection: {
    alignItems: 'flex-end',
  } as ViewStyle,
  tierPrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    lineHeight: 22,
  } as TextStyle,
  tierAvailability: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    lineHeight: 14,
    color: colors.stone,
    marginTop: 2,
  } as TextStyle,

  // -- Organisateur premium repense --
  organizerCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadows.eventCard,
  } as ViewStyle,
  organizerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  } as ViewStyle,
  organizerCardTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.onyx,
    letterSpacing: -0.3,
  } as TextStyle,
  organizerHeaderBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: `${colors.forest}12`,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  organizerDivider: {
    height: 1,
    backgroundColor: `${colors.stone}15`,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  } as ViewStyle,
  organizerDividerAccent: {
    position: 'absolute',
    left: 0,
    top: -1,
    bottom: 0,
    width: 48,
    backgroundColor: `${colors.gold}60`,
  } as ViewStyle,
  organizerBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  } as ViewStyle,
  organizerAvatarWrapper: {
    marginRight: spacing.md,
  } as ViewStyle,
  organizerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.ivory,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.gold,
    ...shadows.card,
  } as ViewStyle,
  organizerAvatarImage: {
    width: 60,
    height: 60,
  } as ImageStyle,
  organizerAvatarFallback: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    lineHeight: 30,
    color: colors.terracotta,
  } as TextStyle,
  organizerVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.forest,
    borderWidth: 2,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  organizerIdentity: {
    flex: 1,
  } as ViewStyle,
  organizerName: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.onyx,
    letterSpacing: -0.2,
  } as TextStyle,
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: `${colors.forest}10`,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  } as ViewStyle,
  verifiedText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 14,
    color: colors.forest,
    letterSpacing: 0.2,
  } as TextStyle,

  // -- Boutons contact premium --
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
    backgroundColor: '#25D366',
    borderRadius: radii.lg,
    paddingVertical: spacing.md + 2,
    gap: spacing.sm,
    ...shadows.card,
  } as ViewStyle,
  whatsappButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.white,
    letterSpacing: 0.3,
  } as TextStyle,
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.terracotta,
    borderRadius: radii.lg,
    paddingVertical: spacing.md + 2,
    gap: spacing.sm,
    ...shadows.card,
  } as ViewStyle,
  callButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.white,
    letterSpacing: 0.3,
  } as TextStyle,
  whatsappIcon: {
    width: 26,
    height: 26,
  } as ImageStyle,

  // -- Voir tout --
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  seeAllText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.terracotta,
    letterSpacing: 0.2,
  } as TextStyle,

  // -- Similaires --
  similarCard: {
    width: 180,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
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
    backgroundColor: colors.terracotta,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  } as ViewStyle,
  similarBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    lineHeight: 14,
    color: colors.white,
    letterSpacing: 0.3,
  } as TextStyle,
  similarTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 14,
    lineHeight: 19,
    color: colors.onyx,
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
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
  } as TextStyle,
  similarPrice: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.gold,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  } as TextStyle,

  // -- Barre fixe bas glassmorphism --
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: `${colors.stone}10`,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    zIndex: 100,
    elevation: 12,
  } as ViewStyle,
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  bottomBarPriceContainer: {
    flexDirection: 'column',
  } as ViewStyle,
  bottomBarPriceLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 14,
    color: colors.stone,
  } as TextStyle,
  bottomBarPriceValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.gold,
  } as TextStyle,
  reserveInlineSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  } as ViewStyle,
  reserveInlineLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onyx,
  } as TextStyle,
  reserveInlineButton: {
    backgroundColor: colors.terracotta,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    ...shadows.card,
  } as ViewStyle,
  reserveInlineButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.white,
  } as TextStyle,
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.terracotta,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    minWidth: 160,
    justifyContent: 'center',
    ...shadows.card,
  } as ViewStyle,
  reserveButtonDisabled: {
    backgroundColor: colors.stone,
  } as ViewStyle,
  reserveButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.white,
    letterSpacing: 0.2,
  } as TextStyle,
};
