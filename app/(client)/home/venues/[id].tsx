/**
 * Page detail d'un lieu — Ecran client (stack Accueil).
 *
 * Cette route miroir garde le detail dans la stack Accueil, afin que
 * le bouton retour restaure l'etat de la page d'accueil d'origine.
 *
 * Design premium « Noir & Or » :
 * - Image hero avec dégradé sombre du bas vers le haut + filet or
 * - Bouton retour + partage/favori en pastilles verre fumé
 * - Badge promotion verre doré sur l'image
 * - Titre Playfair Display, infos adresse/ville en carte verre
 * - Carte capacité, chips équipements et types d'événements ornés
 * - Carte propriétaire premium (Avatar verre + boutons contact)
 * - Barre fixe en bas : verre fumé avec filet doré + bouton « Réserver » dégradé or
 *
 * Conventions :
 * - lucide-react-native pour les icones (noms vérifiés)
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
  PanResponder,
  Share,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, usePathname } from 'expo-router';
import {
  ChevronLeft,
  MapPin,
  Users,
  Phone,
  Star,
  Wifi,
  Music,
  Car,
  UtensilsCrossed,
  Projector,
  Heart,
  Share2,
  CalendarDays,
  Tag,
  House,
  ShieldCheck,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import WhatsAppIcon from '@/assets/icons/WhatsApp.svg';

import { colors, spacing, radius, shadows, typography, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useOffline } from '@/hooks/useOffline';
import { venueService } from '@/services/venue.service';
import { useFavoritesStore } from '@/stores/favorites-store';
import { formatPrice } from '@/services/event.service';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { VenueWithPromotion } from '@/types';
import { ScreenBackground } from '@/components/ui/ScreenBackground';

// ============================================================
// Constantes
// ============================================================

const HERO_HEIGHT = 300;
const GALLERY_ITEM_WIDTH = 100;
const GALLERY_ITEM_HEIGHT = 72;
const BOTTOM_BAR_HEIGHT = 96;

// ============================================================
// Mapping icone amenity -> lucide icon
// ============================================================

const AMENITY_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  'Wi-Fi': Wifi,
  'Wi-fi': Wifi,
  'Son professionnel': Music,
  'Son premium': Music,
  'Systeme son premium': Music,
  'Parking': Car,
  'Parking VIP': Car,
  'Parking 200 places': Car,
  'Parking VIP couvert': Car,
  'Bar premium': UtensilsCrossed,
  'Cuisine sur site': UtensilsCrossed,
  'Catering': UtensilsCrossed,
  'Cocktail welcome': UtensilsCrossed,
  'Projection HD': Projector,
  'Eclairage scene': Projector,
  'Scene modulable': Projector,
  'Terrasse': House,
  'Terrasse panoramique': House,
  'Vue panoramique': House,
  'Jardin tropical': House,
  'Vestiaire': House,
  'Vestiaire securise': House,
};

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
// Helper : icone amenity
// ============================================================

function getAmenityIcon(amenity: string) {
  return AMENITY_ICONS[amenity] ?? Tag;
}

// ============================================================
// Composant principal
// ============================================================

export default function VenueDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const pathname = usePathname();
  const { impact } = useHaptics();
  const isOffline = useOffline();

  const venueId = params.id;

  // -- State --
  const [venue, setVenue] = useState<VenueWithPromotion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const galleryAutoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const panResponderRef = useRef<ReturnType<typeof PanResponder.create> | null>(null);

  // -- Favoris (etat global partage) --
  const venueIds = useFavoritesStore((s) => s.venueIds);
  const toggleVenue = useFavoritesStore((s) => s.toggleVenue);
  const isFavorited = venueIds.includes(venueId ?? '');

  // -- Chargement des donnees --
  useEffect(() => {
    if (!venueId) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const detail = await venueService.fetchVenueDetail(venueId);

        if (cancelled || !detail) {
          setIsLoading(false);
          return;
        }

        setVenue(detail);
      } catch (err) {
        logger.error('[VenueDetail] load error:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [venueId]);

  // -- Handlers --
  const handleBack = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  const handleToggleFavorite = useCallback(() => {
    impact('light');
    if (venueId) {
      toggleVenue(venueId);
    }
  }, [impact, toggleVenue, venueId]);

  const handleShare = useCallback(async () => {
    if (!venue) return;
    impact('light');
    const location = venue.address ?? venue.city ?? 'Adresse non precisee';
    try {
      await Share.share({
        title: venue.name,
        message: `Decouvrez le lieu "${venue.name}" a ${location} sur Rivald'Event.`,
      });
    } catch (err) {
      logger.debug('[VenueDetail] share error:', err);
    }
  }, [impact, venue]);

  const handleContactWhatsApp = useCallback(() => {
    if (!venue) return;
    impact('medium');
    // Le owner n'est pas toujours disponible dans le type VenueWithPromotion
    // On utilise un message generique si pas de phone
    const phone = '+237 6 99 88 77 66'; // Contact generique mock
    const message = `Bonjour, j'ai une question concernant le lieu "${venue.name}" sur Rivald'Event.`;
    openWhatsApp(phone, message);
  }, [impact, venue]);

  const handleCall = useCallback(() => {
    impact('light');
    const phone = '+237 6 99 88 77 66'; // Contact generique mock
    Linking.openURL(`tel:${phone}`);
  }, [impact]);

  const handleReserve = useCallback(() => {
    if (isOffline) {
      Alert.alert('Hors ligne', 'Pas de connexion internet. Verifiez votre reseau.');
      return;
    }
    impact('medium');
    // Contextuel : depuis les Favoris, la reservation reste dans la
    // stack Favoris pour que le retour revienne au detail du lieu.
    router.push({
      pathname: pathname.includes('/favorites/')
        ? ROUTES.FAVORITES_VENUE_RESERVE
        : ROUTES.VENUE_RESERVE,
      params: { id: venueId },
    });
  }, [impact, router, venueId, isOffline, pathname]);

  // -- Donnees derivees --
  const displayImages = useMemo(() => {
    if (!venue) return [];
    return venue.images.length > 0 ? venue.images : (venue.address ? [venue.address] : []);
  }, [venue]);

  // -- Auto-scroll du carrousel d'images --
  const resetAutoScroll = useCallback(() => {
    if (galleryAutoScrollRef.current) {
      clearTimeout(galleryAutoScrollRef.current);
    }
    if (!venue || displayImages.length <= 1) return;

    galleryAutoScrollRef.current = setTimeout(() => {
      setActiveGalleryIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0));
      resetAutoScroll();
    }, 2000);
  }, [venue, displayImages]);

  // -- Swipe horizontal pour changer d'image (comme page detail evenement) --
  useEffect(() => {
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx }) => Math.abs(dx) > 10,
      onPanResponderRelease: (_, { dx }) => {
        if (displayImages.length <= 1) return;

        if (dx > 50) {
          setActiveGalleryIndex((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1));
          resetAutoScroll();
        } else if (dx < -50) {
          setActiveGalleryIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0));
          resetAutoScroll();
        }
      },
    });
  }, [displayImages, resetAutoScroll]);

  // -- Lancer l'auto-scroll au montage et quand le lieu change --
  useEffect(() => {
    resetAutoScroll();
    return () => {
      if (galleryAutoScrollRef.current) {
        clearTimeout(galleryAutoScrollRef.current);
      }
    };
  }, [resetAutoScroll]);

  const capacityDisplay = useMemo(() => {
    if (!venue) return '';
    if (venue.capacity_min && venue.capacity_max) {
      return `${venue.capacity_min} - ${venue.capacity_max} personnes`;
    }
    if (venue.capacity_max) {
      return `Jusqu'a ${venue.capacity_max} personnes`;
    }
    if (venue.capacity_min) {
      return `Min. ${venue.capacity_min} personnes`;
    }
    return 'Capacite non precisee';
  }, [venue]);

  // ============================================================
  // Loading state
  // ============================================================

  if (isLoading) {
    return (
      <ScreenBackground><View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.heroSkeleton}>
          <Skeleton width="100%" height={HERO_HEIGHT} radius={0} />
        </View>
        <View style={styles.loadingBody}>
          <Skeleton width={220} height={30} radius={radius.sm} />
          <Skeleton width="100%" height={90} radius={radius.lg} />
          <Skeleton width="100%" height={70} radius={radius.lg} />
          <Skeleton width="70%" height={70} radius={radius.lg} />
        </View>
      </View></ScreenBackground>
    );
  }

  if (!venue) {
    return (
      <ScreenBackground><View style={[styles.errorContainer, { paddingTop: insets.top }, { backgroundColor: 'transparent' }]}>
        <Text style={styles.errorTitle}>Lieu introuvable</Text>
        <Text style={styles.errorText}>Ce lieu n'existe pas ou a ete supprime.</Text>
        <View style={{ marginTop: spacing.lg, width: 200 }}>
          <Button variant="primary" size="md" onPress={handleBack}>
            Retour
          </Button>
        </View>
      </View></ScreenBackground>
    );
  }

  // ============================================================
  // Render
  // ============================================================

  const locationDisplay = venue.address ?? venue.city ?? 'Adresse non precisee';

  return (
    <ScreenBackground><View style={[styles.screen, { backgroundColor: 'transparent' }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingBottom: BOTTOM_BAR_HEIGHT + insets.bottom + spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* =============================================
            IMAGE HERO — HAUTEUR PREMIUM
            ============================================= */}
        <View style={styles.heroContainer}>
          {/* Zone swipeable : uniquement l'image (les boutons restent cliquables) */}
          <View
            style={styles.heroSwipeArea}
            {...(panResponderRef.current ? panResponderRef.current.panHandlers : {})}
          >
            {displayImages.length > 0 ? (
              <Image
                source={{ uri: displayImages[activeGalleryIndex] ?? displayImages[0] ?? '' }}
                style={styles.heroImage}
                contentFit="cover"
                transition={400}
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.heroImage, styles.heroPlaceholder]}>
                <Text style={styles.heroPlaceholderText}>{venue.name.charAt(0)}</Text>
              </View>
            )}
          </View>

          {/* Dégradé sombre du bas vers le haut */}
          <LinearGradient
            colors={['rgba(10,9,8,0)', 'rgba(10,9,8,0.42)', 'rgba(10,9,8,0.85)']}
            locations={[0, 0.5, 1]}
            style={StyleAbsoluteFill}
            pointerEvents="none"
          />

          {/* Filet doré haut */}
          <View pointerEvents="none" style={styles.goldEdge} />

          {/* Badge promotion — pastille verre doré */}
          {venue.promotion_tier && (
            <View style={[styles.promoBadge, { top: insets.top + spacing.sm }]}>
              <Text style={styles.promoBadgeText}>
                {venue.promotion_tier === 'vip' ? 'VIP' : venue.promotion_tier === 'premium' ? 'PREMIUM' : 'BASIQUE'}
              </Text>
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

          {/* Compteur d'images */}
          {displayImages.length > 1 && (
            <View style={styles.imageCounter} pointerEvents="none">
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
          {/* Nom du lieu — titre serif */}
          <Text style={styles.title}>{venue.name}</Text>

          {/* Adresse + ville — carte verre */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MapPin size={15} color={colors.goldMuted} strokeWidth={1.75} />
              <Text style={[styles.infoText, { flex: 1 }]} numberOfLines={1}>
                {locationDisplay}
              </Text>
              {venue.city && venue.city !== venue.address && (
                <View style={styles.cityBadge}>
                  <Text style={styles.cityBadgeText}>{venue.city}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Mention lieu premium */}
          {venue.is_premium && (
            <View style={styles.premiumPill}>
              <Star size={14} color={colors.gold} fill={colors.gold} strokeWidth={1.5} />
              <Text style={styles.premiumPillText}>Lieu premium</Text>
            </View>
          )}

          {/* Separateur or premium */}
          <View style={styles.goldSeparator}>
            <View style={styles.goldSeparatorLine} />
            <View style={styles.goldSeparatorDiamond} />
            <View style={styles.goldSeparatorLine} />
          </View>

          {/* Description */}
          {venue.description && (
            <View style={styles.section}>
              <Text style={styles.sectionOverline}>LE LIEU</Text>
              <Text style={styles.sectionTitle}>A propos</Text>
              <Text style={styles.descriptionText}>{venue.description}</Text>
            </View>
          )}

          {/* =============================================
              CAPACITE
              ============================================= */}
          {(venue.capacity_min || venue.capacity_max) && (
            <View style={styles.section}>
              <Text style={styles.sectionOverline}>ESPACE</Text>
              <View style={styles.statCard}>
                <View style={styles.statIconMedallion}>
                  <Users size={22} color={colors.goldBright} strokeWidth={1.5} />
                </View>
                <View style={styles.statBody}>
                  <Text style={styles.statLabel}>Capacite</Text>
                  <Text style={styles.statValue}>{capacityDisplay}</Text>
                </View>
              </View>
            </View>
          )}

          {/* =============================================
              EQUIPEMENTS (amenities)
              ============================================= */}
          {venue.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionOverline}>PRESTATIONS</Text>
              <Text style={styles.sectionTitle}>Equipements</Text>
              <View style={styles.chipsWrap}>
                {venue.amenities.map((amenity) => {
                  const IconComponent = getAmenityIcon(amenity);
                  return (
                    <View key={amenity} style={styles.chip}>
                      <IconComponent size={14} color={colors.goldMuted} strokeWidth={1.5} />
                      <Text style={styles.chipText}>{amenity}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* =============================================
              TYPES D'EVENEMENTS SUPPORTES
              ============================================= */}
          {venue.event_types.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionOverline}>UNIVERS</Text>
              <Text style={styles.sectionTitle}>Types d'evenements</Text>
              <View style={styles.chipsWrap}>
                {venue.event_types.map((eventType) => (
                  <View key={eventType} style={styles.chipActive}>
                    <Text style={styles.chipActiveText}>{eventType}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* =============================================
              PROPRIETAIRE — CARTE PREMIUM
              ============================================= */}
          <View style={styles.ownerCard}>
            {/* En-tete : libelle a l'interieur du carde */}
            <View style={styles.ownerHeader}>
              <Text style={styles.ownerTitle}>Proprietaire</Text>
              <View style={styles.ownerHeaderBadge}>
                <ShieldCheck size={15} color={colors.goldBright} strokeWidth={2} />
              </View>
            </View>

            {/* Separateur subtil avec accent or */}
            <View style={styles.ownerDivider}>
              <View style={styles.ownerDividerAccent} />
            </View>

            {/* Identite : avatar + nom, bien aere */}
            <View style={styles.ownerBody}>
              <Avatar size="md" border="highlight" fallback="P" />
              <View style={styles.ownerIdentity}>
                <Text style={styles.ownerName}>Proprietaire du lieu</Text>
                <Text style={styles.ownerDetail}>Contact disponible sur demande</Text>
              </View>
            </View>

            {/* Boutons de contact premium */}
            <View style={styles.contactButtons}>
              <Pressable
                onPress={handleContactWhatsApp}
                style={styles.whatsappButton}
                accessibilityRole="button"
                accessibilityLabel="Contacter via WhatsApp"
              >
                <WhatsAppIcon width={20} height={20} />
                <Text style={styles.contactButtonText}>WhatsApp</Text>
              </Pressable>
              <Pressable
                onPress={handleCall}
                style={styles.callButton}
                accessibilityRole="button"
                accessibilityLabel="Appeler"
              >
                <Phone size={17} color={colors.goldBright} strokeWidth={1.75} />
                <Text style={styles.contactButtonText}>Appeler</Text>
              </Pressable>
            </View>
          </View>

          {/* =============================================
              PRIX PAR JOUR
              ============================================= */}
          {venue.price_per_day && (
            <View style={styles.section}>
              <Text style={styles.sectionOverline}>TARIF</Text>
              <View style={styles.statCard}>
                <View style={styles.statIconMedallion}>
                  <CalendarDays size={22} color={colors.goldBright} strokeWidth={1.5} />
                </View>
                <View style={styles.statBody}>
                  <Text style={styles.statLabel}>Tarif par jour</Text>
                  <Text style={styles.priceValue}>{formatPrice(venue.price_per_day)}</Text>
                </View>
              </View>
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
              {venue.price_per_day ? formatPrice(venue.price_per_day) : 'Tarif sur demande'}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onPress={handleReserve}
              icon={<House size={18} strokeWidth={1.9} />}
              iconPosition="right"
            >
              Reserver
            </Button>
          </View>
        </View>
      </View>
    </View></ScreenBackground>
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
    backgroundColor: 'transparent',
  } as ViewStyle,
  scrollView: {
    flex: 1,
  } as ViewStyle,

  // -- Chargement --
  heroSkeleton: {
    overflow: 'hidden',
  } as ViewStyle,
  loadingBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  } as ViewStyle,

  // -- Erreur --
  errorContainer: {
    flex: 1,
    backgroundColor: 'transparent',
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
    fontSize: 64,
    lineHeight: 72,
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

  // -- Badge promotion --
  promoBadge: {
    position: 'absolute',
    right: spacing.md + 48, // Espace pour les boutons droite
    backgroundColor: 'rgba(10,9,8,0.62)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  } as ViewStyle,
  promoBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    color: colors.goldBright,
    letterSpacing: 0.8,
  } as TextStyle,

  // -- Compteur images --
  imageCounter: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(10,9,8,0.62)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  } as ViewStyle,
  imageCounterText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    color: colors.goldBright,
    letterSpacing: 0.4,
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

  // -- Infos verre --
  infoCard: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
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

  // -- Mention premium --
  premiumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(216,180,90,0.12)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  } as ViewStyle,
  premiumPillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 17,
    color: colors.goldBright,
    letterSpacing: 0.3,
  } as TextStyle,

  // -- Separateur or premium avec losange --
  goldSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
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
  sectionOverline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    color: colors.goldMuted,
    marginBottom: 3,
  } as TextStyle,
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    lineHeight: 30,
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  } as TextStyle,

  // -- Description --
  descriptionText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 26,
    letterSpacing: 0.1,
  } as TextStyle,

  // -- Cartes statistiques verre --
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  } as ViewStyle,
  statIconMedallion: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(216,180,90,0.1)',
    borderWidth: 1,
    borderColor: `${colors.gold}26`,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  statBody: {
    marginLeft: spacing.md,
    flex: 1,
  } as ViewStyle,
  statLabel: {
    ...typography.overline,
    color: colors.textMuted,
    marginBottom: 2,
  } as TextStyle,
  statValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
    letterSpacing: 0.2,
  } as TextStyle,

  // -- Prix --
  priceValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.goldBright,
    letterSpacing: -0.2,
  } as TextStyle,

  // -- Chips equipements --
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  } as ViewStyle,
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  } as ViewStyle,
  chipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  } as TextStyle,

  // -- Chips types d'evenements (pilules or) --
  chipActive: {
    backgroundColor: 'rgba(216,180,90,0.12)',
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  } as ViewStyle,
  chipActiveText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.goldBright,
    letterSpacing: 0.2,
  } as TextStyle,

  // -- Proprietaire premium --
  ownerCard: {
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadows.eventCard,
  } as ViewStyle,
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  } as ViewStyle,
  ownerTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    letterSpacing: -0.3,
  } as TextStyle,
  ownerHeaderBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(216,180,90,0.1)',
    borderWidth: 1,
    borderColor: `${colors.gold}26`,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  ownerDivider: {
    height: 1,
    backgroundColor: `${colors.gold}1F`,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  } as ViewStyle,
  ownerDividerAccent: {
    position: 'absolute',
    left: 0,
    top: -1,
    bottom: 0,
    width: 48,
    backgroundColor: `${colors.gold}60`,
  } as ViewStyle,
  ownerBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  } as ViewStyle,
  ownerIdentity: {
    flex: 1,
    marginLeft: spacing.md,
  } as ViewStyle,
  ownerName: {
    ...typography.bodyMedium,
    color: colors.text,
    letterSpacing: -0.1,
  } as TextStyle,
  ownerDetail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: spacing.xs,
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