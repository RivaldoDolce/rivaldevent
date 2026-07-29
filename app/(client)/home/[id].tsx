/**
 * Page detail d'un evenement - Ecran client.
 *
 * Design premium "Minimalisme Africain Camerounais" :
 * - Image hero plein ecran avec gradient overlay
 * - Bouton retour et favori flottants sur l'image
 * - Badge categorie sur l'image
 * - Titre PlayfairDisplay-Bold
 * - Infos date/heure/lieu avec icones lucide
 * - Galerie d'images horizontale (si plusieurs images)
 * - Description riche
 * - Carte organisateur avec WhatsApp + appel
 * - Apercu des tiers de billets disponibles
 * - Section "Evenements similaires" en carousel horizontal
 * - Barre fixe en bas : prix + CTA "Reserver"
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
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, spacing, radii, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useOffline } from '@/hooks/useOffline';
import { eventService, formatPrice, formatDate, formatTime } from '@/services/event.service';
import { logger } from '@/lib/logger';
import type { EventWithAvailability, TicketTierWithAvailability } from '@/types';

// ============================================================
// Constantes
// ============================================================

const HERO_HEIGHT = 320;
const GALLERY_ITEM_WIDTH = 100;
const GALLERY_ITEM_HEIGHT = 72;
const BOTTOM_BAR_HEIGHT = 72;

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
// Composant
// ============================================================

export default function EventDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; from?: string }>();
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
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const galleryAutoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const panResponderRef = useRef<ReturnType<typeof PanResponder.create> | null>(null);

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
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dx }) => Math.abs(dx) > 10,
      onPanResponderRelease: (_, { dx }) => {
        const imgs = event?.cover_image
          ? event.images && event.images.length > 0 && !event.images.includes(event.cover_image)
            ? [event.cover_image, ...event.images]
            : event.images ?? (event.cover_image ? [event.cover_image] : [])
          : event?.images ?? [];
        
        if (imgs.length <= 1) return;
        
        if (dx > 50) {
          // Swipe droite: image precedente
          setActiveGalleryIndex((prev) => (prev > 0 ? prev - 1 : imgs.length - 1));
          resetAutoScroll();
        } else if (dx < -50) {
          // Swipe gauche: image suivante
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
    // Si l'utilisateur vient d'Explorer, on le ramene a Explorer
    // (pas a l'Accueil) pour eviter la confusion UX
    if (params.from === 'explore') {
      router.replace(ROUTES.EXPLORE);
    } else {
      router.back();
    }
  }, [impact, router, params.from]);

  const handleToggleFavorite = useCallback(() => {
    impact('light');
    setIsFavorited((prev) => !prev);
    // TODO: brancher le service favoris (Roadmap #8)
  }, [impact]);

  const handleShare = useCallback(() => {
    impact('light');
    // TODO: brancher le partage social (Roadmap #18)
    logger.debug('[EventDetail] share (TODO)');
  }, [impact]);

  const handleReserve = useCallback(() => {
    if (isOffline) {
      Alert.alert('Hors ligne', 'Pas de connexion internet. Verifiez votre reseau.');
      return;
    }
    impact('medium');
    router.push({
      pathname: ROUTES.PURCHASE_TICKETS,
      params: { id: eventId },
    } as any);
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
    router.push({
      pathname: ROUTES.EVENT_DETAIL,
      params: { id: similarId },
    } as any);
  }, [impact, router]);

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

  const displayImages = useMemo(() => {
    if (!event) return [];
    const cover = event.cover_image;
    const gallery = event.images ?? [];
    if (cover && !gallery.includes(cover)) {
      return [cover, ...gallery];
    }
    return gallery.length > 0 ? gallery : (cover ? [cover] : []);
  }, [event]);

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
            IMAGE HERO AVEC SWIPE
            ============================================= */}
        <View
          style={styles.heroContainer}
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

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(26,24,22,0.7)']}
            style={styles.heroGradient}
            pointerEvents="none"
          />

          {/* Badge categorie */}
          {event.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{event.category}</Text>
            </View>
          )}

          {/* Bouton retour (absolu) */}
          <Pressable
            onPress={handleBack}
            style={[styles.floatingButton, { left: spacing.md, top: Math.max(insets.top + spacing.sm, spacing.lg) }]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ChevronLeft size={24} color={colors.onyx} strokeWidth={2.5} />
          </Pressable>

          {/* Boutons droite : Partage + Favori (conteneur absolu, boutons flexibles) */}
          <View style={[styles.floatingButtonsContainer, { top: Math.max(insets.top + spacing.sm, spacing.lg) }]}>
            <Pressable
              onPress={handleShare}
              style={styles.floatingButton}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Partager"
            >
              <Share2 size={20} color={colors.onyx} strokeWidth={2} />
            </Pressable>
            <Pressable
              onPress={handleToggleFavorite}
              style={styles.floatingButton}
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

          {/* Compteur d'images */}
          {displayImages.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {activeGalleryIndex + 1} / {displayImages.length}
              </Text>
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
          {/* Titre */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Infos rapides : date + heure */}
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

          {/* Lieu */}
          <View style={styles.locationRow}>
            <MapPin size={16} color={colors.stone} strokeWidth={1.5} />
            <Text style={styles.locationText}>{locationDisplay}</Text>
            {event.city && (
              <View style={styles.cityBadge}>
                <Text style={styles.cityBadgeText}>{event.city}</Text>
              </View>
            )}
          </View>

          {/* Separateur or */}
          <View style={styles.goldSeparator}>
            <View style={styles.goldSeparatorLine} />
            <View style={styles.goldSeparatorDot} />
            <View style={styles.goldSeparatorLine} />
          </View>

          {/* Description */}
          {event.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>A propos</Text>
              <Text style={styles.descriptionText}>{event.description}</Text>
            </View>
          ) : null}

          {/* =============================================
              BILLETS DISPONIBLES
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
            </View>
          ) : null}

          {/* =============================================
              ORGANISATEUR
              ============================================= */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organisateur</Text>
            <View style={styles.organizerCard}>
              <View style={styles.organizerInfo}>
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
                <View style={styles.organizerDetails}>
                  <Text style={styles.organizerName}>
                    {event.organizer?.full_name ?? 'Organisateur'}
                  </Text>
                  <Text style={styles.organizerLabel}>Organisateur</Text>
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
                  <Image
                    source={require('@/assets/icons/WhatsApp.svg')}
                    style={styles.whatsappIcon}
                    contentFit="contain"
                  />
                  <Text style={styles.whatsappButtonText}>WhatsApp</Text>
                </Pressable>
                <Pressable
                  onPress={handleCall}
                  style={styles.callButton}
                  accessibilityRole="button"
                  accessibilityLabel="Appeler l'organisateur"
                >
                  <Image
                    source={require('@/assets/icons/phone.png')}
                    style={styles.callIcon}
                    contentFit="contain"
                  />
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
          BARRE FIXE EN BAS : Prix + CTA Reserver
          ============================================= */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || spacing.md }]}>
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
      </View>
    </View>
  );
}

// ============================================================
// Sous-composant : Apercu d'un tier de billet
// ============================================================

function TierPreviewCard({ tier }: { readonly tier: TicketTierWithAvailability }) {
  return (
    <View
      style={[
        styles.tierCard,
        tier.is_sold_out && styles.tierCardSoldOut,
      ]}
    >
      <View style={styles.tierInfo}>
        <Text
          style={[
            styles.tierName,
            tier.is_sold_out && styles.tierNameSoldOut,
          ]}
        >
          {tier.name}
        </Text>
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
        <Text style={styles.tierPrice}>{formatPrice(tier.price)}</Text>
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

  // -- Hero --
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
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
    height: 160,
  } as ViewStyle,

  // -- Flottants --
  floatingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.white}E6`,
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
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: colors.terracotta,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  } as ViewStyle,
  categoryBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.white,
    letterSpacing: 0.3,
  } as TextStyle,

  // -- Compteur images --
  imageCounter: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: `${colors.onyx}88`,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  } as ViewStyle,
  imageCounterText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
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
    fontSize: 26,
    lineHeight: 34,
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

  // -- Separateur or --
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
  goldSeparatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
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

  // -- Tiers de billets --
  tiersList: {
    gap: spacing.sm,
  } as ViewStyle,
  tierCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.card,
  } as ViewStyle,
  tierCardSoldOut: {
    opacity: 0.5,
  } as ViewStyle,
  tierInfo: {
    flex: 1,
    marginRight: spacing.md,
  } as ViewStyle,
  tierName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.onyx,
    letterSpacing: 0.1,
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
    color: colors.gold,
  } as TextStyle,
  tierAvailability: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    lineHeight: 14,
    color: colors.stone,
    marginTop: 2,
  } as TextStyle,

  // -- Organisateur --
  organizerCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xl,
    ...shadows.card,
  } as ViewStyle,
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  } as ViewStyle,
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.ivory,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.gold,
  } as ViewStyle,
  organizerAvatarImage: {
    width: 48,
    height: 48,
  } as ImageStyle,
  organizerAvatarFallback: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    lineHeight: 24,
    color: colors.terracotta,
  } as TextStyle,
  organizerDetails: {
    marginLeft: spacing.md,
    flex: 1,
  } as ViewStyle,
  organizerName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.onyx,
    letterSpacing: 0.1,
  } as TextStyle,
  organizerLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
    marginTop: spacing.xs,
  } as TextStyle,

  // -- Boutons contact --
  contactButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  } as ViewStyle,
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  } as ViewStyle,
  whatsappButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
    letterSpacing: 0.2,
  } as TextStyle,
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.terracotta,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  } as ViewStyle,
  callButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
    letterSpacing: 0.2,
  } as TextStyle,
  whatsappIcon: {
    width: 18,
    height: 18,
  } as ImageStyle,
  callIcon: {
    width: 18,
    height: 18,
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

  // -- Barre fixe bas --
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: `${colors.stone}15`,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    zIndex: 50,
    ...shadows.card,
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
  } as ViewStyle,
  reserveButtonDisabled: {
    backgroundColor: colors.stone,
  } as ViewStyle,
  reserveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.white,
    letterSpacing: 0.2,
  } as TextStyle,
};