/**
 * Page detail d'un lieu - Ecran client.
 *
 * Design premium "Minimalisme Africain Camerounais" :
 * - Image hero plein ecran avec gradient overlay
 * - Bouton retour flottant sur l'image
 * - Badge promotion tier sur l'image (si sponsorise)
 * - Titre PlayfairDisplay-Bold
 * - Adresse + ville avec MapPin
 * - Galerie d'images horizontale (si plusieurs images)
 * - Description riche
 * - Section capacite (min-max + icone Users)
 * - Section equipements (amenities en chips)
 * - Section types d'evenements supportes
 * - Carte proprietaire avec avatar + nom
 * - Prix par jour + CTA "Reserver ce lieu"
 * - Barre fixe en bas : prix + CTA
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

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  MapPin,
  Users,
  Phone,
  MessageCircle,
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
  Home,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, spacing, radii, shadows } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useOffline } from '@/hooks/useOffline';
import { venueService } from '@/services/venue.service';
import { formatPrice } from '@/services/event.service';
import { logger } from '@/lib/logger';
import type { VenueWithPromotion } from '@/types';

// ============================================================
// Constantes
// ============================================================

const HERO_HEIGHT = 280;
const GALLERY_ITEM_WIDTH = 100;
const GALLERY_ITEM_HEIGHT = 72;
const BOTTOM_BAR_HEIGHT = 72;

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
  'Terrasse': Home,
  'Terrasse panoramique': Home,
  'Vue panoramique': Home,
  'Jardin tropical': Home,
  'Vestiaire': Home,
  'Vestiaire securise': Home,
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
  const { impact } = useHaptics();
  const isOffline = useOffline();

  const venueId = params.id;

  // -- State --
  const [venue, setVenue] = useState<VenueWithPromotion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

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
    setIsFavorited((prev) => !prev);
    // TODO: brancher le service favoris (Roadmap)
  }, [impact]);

  const handleShare = () => {
    impact('light');
    logger.debug('[VenueDetail] share (TODO)');
  };

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
    // TODO: naviguer vers la page de reservation de lieu
    Alert.alert('Reservation', 'La reservation de lieu sera disponible dans une prochaine version.');
  }, [impact, isOffline]);

  // -- Donnees derivees --
  const displayImages = useMemo(() => {
    if (!venue) return [];
    return venue.images.length > 0 ? venue.images : (venue.address ? [venue.address] : []);
  }, [venue]);

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
      <View style={[{ flex: 1, backgroundColor: colors.sand, justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.forest} />
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.stone, marginTop: spacing.md }}>
          Chargement...
        </Text>
      </View>
    );
  }

  if (!venue) {
    return (
      <View style={[{ flex: 1, backgroundColor: colors.sand, justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }]}>
        <Text style={{ fontFamily: 'PlayfairDisplay-SemiBold', fontSize: 18, color: colors.onyx, marginBottom: spacing.sm }}>
          Lieu introuvable
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.stone, marginBottom: spacing.lg }}>
          Ce lieu n'existe pas ou a ete supprime.
        </Text>
        <Pressable onPress={handleBack} style={{
          backgroundColor: colors.forest,
          borderRadius: radii.lg,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}>
          <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: colors.white }}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  // ============================================================
  // Render
  // ============================================================

  const locationDisplay = venue.address ?? venue.city ?? 'Adresse non precisee';

  return (
    <View style={{ flex: 1, backgroundColor: colors.sand }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: BOTTOM_BAR_HEIGHT + insets.bottom + spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* =============================================
            IMAGE HERO
            ============================================= */}
        <View style={{ height: HERO_HEIGHT, position: 'relative' }}>
          {displayImages.length > 0 ? (
            <Image
              source={{ uri: displayImages[activeGalleryIndex] ?? displayImages[0] ?? '' }}
              style={{ width: '100%', height: HERO_HEIGHT }}
              contentFit="cover"
              transition={400}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={{ width: '100%', height: HERO_HEIGHT, backgroundColor: colors.ivory, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 48, color: colors.stone }}>
                {venue.name.charAt(0)}
              </Text>
            </View>
          )}

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(26,24,22,0.7)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 }}
            pointerEvents="none"
          />

          {/* Badge promotion */}
          {venue.promotion_tier && (
            <View style={{
              position: 'absolute',
              top: insets.top + spacing.sm,
              right: spacing.md + 48, // Espace pour les boutons droite
              backgroundColor: venue.promotion_tier === 'vip' ? `${colors.gold}E6`
                : venue.promotion_tier === 'premium' ? colors.terracotta
                : colors.forest,
              borderRadius: radii.sm,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs / 2,
            }}>
              <Text style={{
                fontFamily: 'Inter-Bold',
                fontSize: 10,
                lineHeight: 14,
                color: colors.white,
                letterSpacing: 0.8,
              }}>
                {venue.promotion_tier === 'vip' ? 'VIP' : venue.promotion_tier === 'premium' ? 'PREMIUM' : 'BASIQUE'}
              </Text>
            </View>
          )}

          {/* Bouton retour */}
          <Pressable
            onPress={handleBack}
            style={{
              position: 'absolute',
              left: spacing.md,
              top: insets.top + spacing.sm,
              width: 40,
              height: 40,
              borderRadius: radii.full,
              backgroundColor: colors.white + 'CC',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ChevronLeft size={24} color={colors.onyx} strokeWidth={2.5} />
          </Pressable>

          {/* Boutons droite : Share + Favori */}
          <View style={{
            position: 'absolute',
            right: spacing.md,
            top: insets.top + spacing.sm,
            flexDirection: 'row',
            gap: spacing.sm,
          }}>
            <Pressable
              onPress={handleShare}
              style={{
                width: 40,
                height: 40,
                borderRadius: radii.full,
                backgroundColor: colors.white + 'CC',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Partager"
            >
              <Share2 size={20} color={colors.onyx} strokeWidth={2} />
            </Pressable>
            <Pressable
              onPress={handleToggleFavorite}
              style={{
                width: 40,
                height: 40,
                borderRadius: radii.full,
                backgroundColor: colors.white + 'CC',
                justifyContent: 'center',
                alignItems: 'center',
              }}
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
            <View style={{
              position: 'absolute',
              bottom: spacing.md,
              right: spacing.md,
              backgroundColor: colors.onyx + 'AA',
              borderRadius: radii.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs / 2,
            }}>
              <Text style={{
                fontFamily: 'Inter-Medium',
                fontSize: 12,
                color: colors.white,
              }}>
                {activeGalleryIndex + 1} / {displayImages.length}
              </Text>
            </View>
          )}
        </View>

        {/* =============================================
            GALERIE MINIATURES
            ============================================= */}
        {displayImages.length > 1 && (
          <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
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
                  style={{
                    borderRadius: radii.md,
                    borderWidth: activeGalleryIndex === index ? 2 : 0,
                    borderColor: colors.forest,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={{ uri: img }}
                    style={{ width: GALLERY_ITEM_WIDTH, height: GALLERY_ITEM_HEIGHT }}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* =============================================
            CONTENU PRINCIPAL
            ============================================= */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          {/* Nom du lieu */}
          <Text style={{
            fontFamily: 'PlayfairDisplay-Bold',
            fontSize: 24,
            lineHeight: 32,
            color: colors.onyx,
            letterSpacing: -0.3,
            marginBottom: spacing.sm,
          }}>
            {venue.name}
          </Text>

          {/* Adresse + ville */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
            <MapPin size={16} color={colors.forest} strokeWidth={1.5} />
            <Text style={{
              fontFamily: 'Inter-Regular',
              fontSize: 14,
              lineHeight: 20,
              color: colors.stone,
              marginLeft: spacing.xs,
            }}>
              {locationDisplay}
            </Text>
            {venue.city && venue.city !== venue.address && (
              <View style={{
                backgroundColor: colors.ivory,
                borderRadius: radii.sm,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs / 2,
                marginLeft: spacing.sm,
              }}>
                <Text style={{
                  fontFamily: 'Inter-SemiBold',
                  fontSize: 12,
                  color: colors.forest,
                }}>
                  {venue.city}
                </Text>
              </View>
            )}
          </View>

          {/* Rating premium */}
          {venue.is_premium && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: spacing.md,
              backgroundColor: `${colors.gold}15`,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}>
              <Star size={16} color={colors.gold} fill={colors.gold} strokeWidth={1} />
              <Text style={{
                fontFamily: 'Inter-SemiBold',
                fontSize: 14,
                color: colors.gold,
                marginLeft: spacing.sm,
              }}>
                Lieu premium
              </Text>
            </View>
          )}

          {/* Separateur or */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}>
            <View style={{ flex: 1, height: 1, backgroundColor: `${colors.gold}40` }} />
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.gold,
              marginHorizontal: spacing.sm,
            }} />
            <View style={{ flex: 1, height: 1, backgroundColor: `${colors.gold}40` }} />
          </View>

          {/* Description */}
          {venue.description && (
            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{
                fontFamily: 'PlayfairDisplay-SemiBold',
                fontSize: 18,
                lineHeight: 24,
                color: colors.onyx,
                marginBottom: spacing.sm,
              }}>
                A propos
              </Text>
              <Text style={{
                fontFamily: 'Inter-Regular',
                fontSize: 15,
                lineHeight: 22,
                color: colors.text,
              }}>
                {venue.description}
              </Text>
            </View>
          )}

          {/* =============================================
              CAPACITE
              ============================================= */}
          {(venue.capacity_min || venue.capacity_max) && (
            <View style={{
              backgroundColor: colors.white,
              borderRadius: radii.lg,
              padding: spacing.md,
              marginBottom: spacing.lg,
              ...shadows.card,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: radii.md,
                  backgroundColor: `${colors.forest}15`,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Users size={22} color={colors.forest} strokeWidth={1.5} />
                </View>
                <View style={{ marginLeft: spacing.md, flex: 1 }}>
                  <Text style={{
                    fontFamily: 'PlayfairDisplay-SemiBold',
                    fontSize: 16,
                    lineHeight: 22,
                    color: colors.onyx,
                  }}>
                    Capacite
                  </Text>
                  <Text style={{
                    fontFamily: 'Inter-Regular',
                    fontSize: 14,
                    lineHeight: 20,
                    color: colors.stone,
                  }}>
                    {capacityDisplay}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* =============================================
              EQUIPEMENTS (amenities)
              ============================================= */}
          {venue.amenities.length > 0 && (
            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{
                fontFamily: 'PlayfairDisplay-SemiBold',
                fontSize: 18,
                lineHeight: 24,
                color: colors.onyx,
                marginBottom: spacing.md,
              }}>
                Equipements
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {venue.amenities.map((amenity) => {
                  const IconComponent = getAmenityIcon(amenity);
                  return (
                    <View
                      key={amenity}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.ivory,
                        borderRadius: radii.md,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                      }}
                    >
                      <IconComponent size={14} color={colors.forest} strokeWidth={1.5} />
                      <Text style={{
                        fontFamily: 'Inter-Medium',
                        fontSize: 13,
                        lineHeight: 18,
                        color: colors.text,
                        marginLeft: spacing.xs,
                      }}>
                        {amenity}
                      </Text>
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
            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{
                fontFamily: 'PlayfairDisplay-SemiBold',
                fontSize: 18,
                lineHeight: 24,
                color: colors.onyx,
                marginBottom: spacing.md,
              }}>
                Types d'evenements
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {venue.event_types.map((eventType) => (
                  <View
                    key={eventType}
                    style={{
                      backgroundColor: colors.forest + '15',
                      borderRadius: radii.full,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                    }}
                  >
                    <Text style={{
                      fontFamily: 'Inter-Medium',
                      fontSize: 13,
                      lineHeight: 18,
                      color: colors.forest,
                    }}>
                      {eventType}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* =============================================
              PROPRIETAIRE
              ============================================= */}
          <View style={{
            backgroundColor: colors.white,
            borderRadius: radii.lg,
            padding: spacing.md,
            marginBottom: spacing.lg,
            ...shadows.card,
          }}>
            <Text style={{
              fontFamily: 'PlayfairDisplay-SemiBold',
              fontSize: 18,
              lineHeight: 24,
              color: colors.onyx,
              marginBottom: spacing.md,
            }}>
              Proprietaire
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: radii.full,
                backgroundColor: colors.ivory,
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
              }}>
                <Text style={{
                  fontFamily: 'PlayfairDisplay-Bold',
                  fontSize: 18,
                  color: colors.forest,
                }}>
                  P
                </Text>
              </View>
              <View style={{ marginLeft: spacing.md, flex: 1 }}>
                <Text style={{
                  fontFamily: 'Inter-SemiBold',
                  fontSize: 15,
                  lineHeight: 20,
                  color: colors.text,
                }}>
                  Proprietaire du lieu
                </Text>
                <Text style={{
                  fontFamily: 'Inter-Regular',
                  fontSize: 13,
                  lineHeight: 18,
                  color: colors.stone,
                }}>
                  Contact disponible sur demande
                </Text>
              </View>
            </View>

            {/* Boutons de contact premium */}
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
              <Pressable
                onPress={handleContactWhatsApp}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#25D366',
                  borderRadius: radii.lg,
                  paddingVertical: spacing.md + 2,
                  justifyContent: 'center',
                  gap: spacing.sm,
                  ...shadows.card,
                }}
                accessibilityRole="button"
                accessibilityLabel="Contacter via WhatsApp"
              >
                <MessageCircle size={24} color={colors.white} strokeWidth={2} />
                <Text style={{
                  fontFamily: 'Inter-Bold',
                  fontSize: 15,
                  color: colors.white,
                  letterSpacing: 0.3,
                }}>
                  WhatsApp
                </Text>
              </Pressable>
              <Pressable
                onPress={handleCall}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.terracotta,
                  borderRadius: radii.lg,
                  paddingVertical: spacing.md + 2,
                  justifyContent: 'center',
                  gap: spacing.sm,
                  ...shadows.card,
                }}
                accessibilityRole="button"
                accessibilityLabel="Appeler"
              >
                <Phone size={24} color={colors.white} strokeWidth={2} />
                <Text style={{
                  fontFamily: 'Inter-Bold',
                  fontSize: 15,
                  color: colors.white,
                  letterSpacing: 0.3,
                }}>
                  Appeler
                </Text>
              </Pressable>
            </View>
          </View>

          {/* =============================================
              PRIX PAR JOUR
              ============================================= */}
          {venue.price_per_day && (
            <View style={{
              backgroundColor: colors.white,
              borderRadius: radii.lg,
              padding: spacing.md,
              marginBottom: spacing.lg,
              ...shadows.card,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: radii.md,
                  backgroundColor: `${colors.gold}15`,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <CalendarDays size={22} color={colors.gold} strokeWidth={1.5} />
                </View>
                <View style={{ marginLeft: spacing.md, flex: 1 }}>
                  <Text style={{
                    fontFamily: 'Inter-Regular',
                    fontSize: 13,
                    lineHeight: 18,
                    color: colors.stone,
                  }}>
                    Tarif par jour
                  </Text>
                  <Text style={{
                    fontFamily: 'PlayfairDisplay-Bold',
                    fontSize: 20,
                    lineHeight: 26,
                    color: colors.onyx,
                  }}>
                    {formatPrice(venue.price_per_day)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* =============================================
          BARRE FIXE EN BAS : Prix + CTA Reserver
          ============================================= */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.white,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: insets.bottom || spacing.md,
        ...shadows.eventCard,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{
              fontFamily: 'Inter-Regular',
              fontSize: 12,
              lineHeight: 16,
              color: colors.stone,
            }}>
              A partir de
            </Text>
            <Text style={{
              fontFamily: 'PlayfairDisplay-Bold',
              fontSize: 20,
              lineHeight: 26,
              color: colors.onyx,
            }}>
              {venue.price_per_day ? formatPrice(venue.price_per_day) : 'Tarif sur demande'}
            </Text>
          </View>
          <Pressable
            onPress={handleReserve}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.forest,
              borderRadius: radii.lg,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
            }}
            accessibilityRole="button"
            accessibilityLabel="Reserver ce lieu"
          >
            <Home size={18} color={colors.white} strokeWidth={2} />
            <Text style={{
              fontFamily: 'Inter-SemiBold',
              fontSize: 16,
              lineHeight: 24,
              color: colors.white,
              marginLeft: spacing.sm,
            }}>
              Reserver
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
