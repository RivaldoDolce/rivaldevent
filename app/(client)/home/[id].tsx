/**
 * Page detail d'un evenement - Ecran client.
 *
 * Actuellement en mode mock (donnees statiques).
 * Contient le bouton "Contacter l'organisateur" qui ouvre WhatsApp
 * avec un message pre-rempli.
 *
 * Conventions :
 * - lucide-react-native pour les icones
 * - Design tokens depuis lib/constants.ts
 * - expo-linking pour ouvrir WhatsApp
 * - Pas de type any, pas d'emojis
 */

import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, ChevronLeft, CalendarDays, MapPin, Clock, Phone } from 'lucide-react-native';

import { colors, typography, spacing, radii, shadows } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useRouter } from 'expo-router';

// ============================================================
// Types (mock - seront remplaces par les vrais types)
// ============================================================

interface MockEventDetail {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly time: string;
  readonly location: string;
  readonly description: string;
  readonly organizerName: string;
  readonly organizerPhone: string;
  readonly price: number;
  readonly currency: string;
  readonly category: string;
  readonly image: string;
}

// ============================================================
// Mock data (sera remplace par le service + TanStack Query)
// ============================================================

const MOCK_EVENTS_MAP: Record<string, MockEventDetail> = {
  '1': {
    id: '1',
    title: 'Soiree Afrobeats Yaounde',
    date: '12 Juillet 2026',
    time: '20h00',
    location: 'Palais des Sports, Yaounde',
    description: 'Une soiree exceptionnelle dediee a l\'afrobeats avec les meilleurs artistes de la scene camerounaise et africaine. Venez danser au rythme des hits du moment dans une ambiance unique.',
    organizerName: 'Pro Events CMR',
    organizerPhone: '237612345678',
    price: 5000,
    currency: 'FCFA',
    category: 'Concerts',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
  },
  '2': {
    id: '2',
    title: 'Festival Culturel Nguon 2026',
    date: '25 Juillet 2026',
    time: '18h30',
    location: 'Centre Culturel, Douala',
    description: 'Le Festival Nguon est un evenement culturel majeur qui celebre la richesse et la diversite des traditions camerounaises. Spectacles, expositions et ateliers vous attendent.',
    organizerName: 'Ministere de la Culture',
    organizerPhone: '237698765432',
    price: 2000,
    currency: 'FCFA',
    category: 'Festivals',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
  },
  '3': {
    id: '3',
    title: 'Conference Tech Douala',
    date: '03 Aout 2026',
    time: '09h00',
    location: 'Hotel Pullman, Douala',
    description: 'La conference tech de reference au Cameroun. Decouvrez les dernieres tendances en technologie, entrepreneuriat et innovation avec des speakers internationaux.',
    organizerName: 'Cameroon Tech Hub',
    organizerPhone: '237611223344',
    price: 15000,
    currency: 'FCFA',
    category: 'Conferences',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
  },
  '4': {
    id: '4',
    title: 'Match Football Classique',
    date: '15 Aout 2026',
    time: '16h00',
    location: 'Stade Japoma, Douala',
    description: 'Un match de football amical entre deux equipes legendaires. Une after-midi de sport et de convivialite dans l\'un des plus beaux stades d\'Afrique.',
    organizerName: 'FECAfoot',
    organizerPhone: '237655443322',
    price: 3000,
    currency: 'FCFA',
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
  },
  '5': {
    id: '5',
    title: 'Piece de Theatre "Le Choix"',
    date: '20 Aout 2026',
    time: '19h30',
    location: 'Maison de la Culture, Yaounde',
    description: 'Une piece de theatre captivante qui explore les choix de vie et leurs consequences. Mise en scene par la troupe Les Eclats, la reference du theatre camerounais.',
    organizerName: 'Troupe Les Eclats',
    organizerPhone: '237677889900',
    price: 3500,
    currency: 'FCFA',
    category: 'Theatre',
    image: 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800',
  },
  '6': {
    id: '6',
    title: 'Gala de Charite 2026',
    date: '02 Septembre 2026',
    time: '20h00',
    location: 'Hilton Yaounde',
    description: 'Un gala elegant au profit de causes caritatives. Soiree de prestige avec diner, musique live et vente aux encheres pour soutenir l\'education des enfants defavorises.',
    organizerName: 'Fondation Hope',
    organizerPhone: '237633221100',
    price: 50000,
    currency: 'FCFA',
    category: 'Galas',
    image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800',
  },
};

const DEFAULT_EVENT: MockEventDetail = MOCK_EVENTS_MAP['1'];

// ============================================================
// Helper : ouvrir WhatsApp
// ============================================================

function openWhatsApp(phone: string, message: string): void {
  const encodedMessage = encodeURIComponent(message);
  // Essayer d'abord le scheme natif WhatsApp
  const appUrl = `whatsapp://send?phone=${phone}&text=${encodedMessage}`;
  // Fallback : lien web WhatsApp
  const webUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

  Linking.canOpenURL(appUrl)
    .then((canOpen) => {
      if (canOpen) {
        Linking.openURL(appUrl);
      } else {
        // WhatsApp non installe, essayer le lien web
        Linking.openURL(webUrl).catch(() => {
          Alert.alert(
            'Impossible d\'ouvrir WhatsApp',
            'Verifiez que WhatsApp est installe sur votre appareil.',
          );
        });
      }
    })
    .catch(() => {
      // En cas d'erreur, essayer le lien web directement
      Linking.openURL(webUrl).catch(() => {
        Alert.alert(
          'Impossible d\'ouvrir WhatsApp',
          'Verifiez que WhatsApp est installé sur votre appareil.',
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
  const { impact } = useHaptics();

  // TODO: Remplacer par useLocalSearchParams + TanStack Query quand branche
  const event: MockEventDetail = DEFAULT_EVENT;

  // -- Formater le prix --
  const formattedPrice = useMemo(() => {
    const absPrice = Math.abs(event.price);
    if (absPrice >= 1000) {
      const formatted = absPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
      return `${event.price < 0 ? '-' : ''}${formatted} ${event.currency}`;
    }
    return `${event.price} ${event.currency}`;
  }, [event.price, event.currency]);

  // -- Message WhatsApp pre-rempli --
  const whatsappMessage = useMemo(
    () =>
      `Bonjour, j'ai une question concernant l'evenement "${event.title}" du ${event.date} sur Rivald'Event.`,
    [event.title, event.date],
  );

  // -- Handlers --
  const handleBack = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  const handleContactOrganizer = useCallback(() => {
    impact('medium');
    openWhatsApp(event.organizerPhone, whatsappMessage);
  }, [impact, event.organizerPhone, whatsappMessage]);

  // -- Styles --
  const headerContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: insets.top + spacing.sm,
    paddingBottom: spacing.md,
  };

  const backButtonStyle: ViewStyle = {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  };

  const sectionTitleStyle: TextStyle = {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.stone,
    letterSpacing: 0.2,
    marginBottom: spacing.sm,
  };

  const detailRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  };

  const detailTextStyle: TextStyle = {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone,
    marginLeft: spacing.sm,
  };

  const descriptionStyle: TextStyle = {
    ...typography.body,
    color: colors.onyx,
    lineHeight: 24,
  };

  const contactCardStyle: ViewStyle = {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  };

  const organizerInfoRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  };

  const organizerNameStyle: TextStyle = {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.onyx,
    marginLeft: spacing.sm,
  };

  const whatsappButtonStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  };

  const whatsappButtonTextStyle: TextStyle = {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.white,
    letterSpacing: 0.2,
  };

  const phoneButtonStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.terracotta,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  };

  const phoneButtonTextStyle: TextStyle = {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.white,
    letterSpacing: 0.2,
  };

  const priceStyle: TextStyle = {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.gold,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.sand }}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: Math.max(insets.bottom + 100, spacing.xxl),
        paddingHorizontal: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header avec bouton retour */}
      <View style={headerContainerStyle}>
        <Pressable
          onPress={handleBack}
          style={backButtonStyle}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ChevronLeft size={22} color={colors.onyx} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Titre de l'evenement */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.h2, { color: colors.onyx, marginBottom: spacing.xs }]}>
          {event.title}
        </Text>
        <View style={detailRowStyle}>
          <CalendarDays size={15} color={colors.stone} strokeWidth={1.5} />
          <Text style={detailTextStyle}>{event.date}</Text>
        </View>
        <View style={detailRowStyle}>
          <Clock size={15} color={colors.stone} strokeWidth={1.5} />
          <Text style={detailTextStyle}>{event.time}</Text>
        </View>
        <View style={detailRowStyle}>
          <MapPin size={15} color={colors.stone} strokeWidth={1.5} />
          <Text style={detailTextStyle}>{event.location}</Text>
        </View>
      </View>

      {/* Prix */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.caption, { color: colors.stone, marginBottom: spacing.xs }]}>
          A partir de
        </Text>
        <Text style={priceStyle}>{formattedPrice}</Text>
      </View>

      {/* Description */}
      <View style={{ marginBottom: spacing.xl }}>
        <Text style={sectionTitleStyle}>Description</Text>
        <Text style={descriptionStyle}>{event.description}</Text>
      </View>

      {/* Contacter l'organisateur */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={sectionTitleStyle}>Organisateur</Text>
        <View style={contactCardStyle}>
          <View style={organizerInfoRowStyle}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.ivory,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{
                fontFamily: 'Inter-SemiBold',
                fontSize: 16,
                color: colors.terracotta,
              }}>
                {event.organizerName.charAt(0)}
              </Text>
            </View>
            <Text style={organizerNameStyle}>{event.organizerName}</Text>
          </View>

          {/* Bouton WhatsApp */}
          <Pressable
            onPress={handleContactOrganizer}
            style={whatsappButtonStyle}
            accessibilityRole="button"
            accessibilityLabel="Contacter l'organisateur via WhatsApp"
          >
            <MessageCircle size={20} color={colors.white} strokeWidth={2} />
            <Text style={whatsappButtonTextStyle}>Contacter l'organisateur</Text>
          </Pressable>

          {/* Bouton appel direct */}
          <Pressable
            onPress={() => {
              impact('light');
              Linking.openURL(`tel:${event.organizerPhone}`);
            }}
            style={[phoneButtonStyle, { marginTop: spacing.sm }]}
            accessibilityRole="button"
            accessibilityLabel="Appeler l'organisateur"
          >
            <Phone size={20} color={colors.white} strokeWidth={2} />
            <Text style={phoneButtonTextStyle}>Appeler directement</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}