/**
 * Confidentialite — politique de confidentialite simplifiee.
 *
 * Ecran PARTAGE (hors groupes client/vendeur) : le retour ramene
 * toujours a l'ecran d'origine (client ou vendeur) avec son etat.
 *
 * Design "Noir & Or" :
 * - Header partage via components/profile/ScreenHeader
 * - Titres de section serif, paragraphes textSecondary lineHeight 24
 * - Derniere mise a jour en overline
 *
 * Conventions :
 * - Toutes les couleurs viennent de lib/constants.ts
 * - Pas de type any, pas d'emojis, imports @/
 */

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Database,
  Lock,
  Eye,
  Share2,
  Trash2,
  FileText,
} from 'lucide-react-native';

import { ScreenHeader } from '@/components/profile/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { colors, spacing, radius } from '@/lib/constants';

// ============================================================
// Donnees statiques
// ============================================================

const SECTIONS: readonly {
  readonly title: string;
  readonly body: string;
  readonly icon: React.ReactNode;
}[] = [
  {
    title: 'Donnees collectees',
    body: 'Nous collectons les informations necessaires au fonctionnement du service : nom, numero de telephone, adresse email, historique des achats et des evenements sauvegardes.',
    icon: <Database size={20} color={colors.gold} strokeWidth={1.75} />,
  },
  {
    title: 'Paiements',
    body: 'Les paiements sont traites exclusivement via les operateurs Mobile Money (MTN, Orange, Moov). Rivald\'event ne conserve jamais votre code secret ni vos identifiants de paiement.',
    icon: <Lock size={20} color={colors.gold} strokeWidth={1.75} />,
  },
  {
    title: 'Utilisation des donnees',
    body: 'Vos donnees servent uniquement a la gestion de vos billets, a vos evenements favoris et aux communications liees a vos achats (confirmation, rappel, remboursement).',
    icon: <Eye size={20} color={colors.gold} strokeWidth={1.75} />,
  },
  {
    title: 'Partage avec les organisateurs',
    body: 'Lorsque vous achetez un billet, l\'organisateur recoit uniquement votre nom et votre numero de telephone pour la gestion des entrees et du scan de votre QR code.',
    icon: <Share2 size={20} color={colors.gold} strokeWidth={1.75} />,
  },
  {
    title: 'Suppression de vos donnees',
    body: 'Vous pouvez demander la suppression de votre compte et de vos donnees a tout moment en contactant le support. Les donnees comptables sont conservees conformement a la loi.',
    icon: <Trash2 size={20} color={colors.gold} strokeWidth={1.75} />,
  },
  {
    title: 'Contact',
    body: 'Pour toute question relative a vos donnees personnelles : support@rivaldevent.cm — Rivald\'event, Yaounde, Cameroun.',
    icon: <FileText size={20} color={colors.gold} strokeWidth={1.75} />,
  },
];

// ============================================================
// Ecran
// ============================================================

export default function PrivacyScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Confidentialite"
          subtitle="Vos donnees sont protegees"
        />

        {/* Intro */}
        <View style={styles.introWrapper}>
          <Card variant="elevated" padding="lg">
            <Text style={styles.introTitle}>
              Politique de confidentialite
            </Text>
            <Text style={styles.introText}>
              Rivald'event s'engage a proteger vos donnees personnelles.
              Cette politique resume la maniere dont nous collectons,
              utilisons et protegeons vos informations.
            </Text>
          </Card>
        </View>

        {/* Sections */}
        <View style={styles.section}>
          {SECTIONS.map((section, index) => (
            <View
              key={section.title}
              style={[
                styles.sectionWrapper,
                index < SECTIONS.length - 1 ? styles.sectionGap : null,
              ]}
            >
              <Card variant="elevated" padding="lg">
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>{section.icon}</View>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                <Text style={styles.sectionBody}>{section.body}</Text>
              </Card>
            </View>
          ))}
        </View>

        {/* Date */}
        <View style={styles.footerBlock}>
          <View style={styles.footerHairline} />
          <Text style={styles.footerNote}>Derniere mise a jour : aout 2026</Text>
        </View>
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
    backgroundColor: colors.background,
  },
  introWrapper: {
    marginTop: -spacing.sm,
    marginHorizontal: spacing.lg,
  },
  introTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    lineHeight: 26,
    color: colors.text,
    letterSpacing: -0.2,
  },
  introText: {
    marginTop: spacing.sm,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionWrapper: {
    width: '100%',
  },
  sectionGap: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassGold,
    borderWidth: 1,
    borderColor: `${colors.gold}33`,
  },
  sectionTitle: {
    flex: 1,
    marginLeft: spacing.md,
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    letterSpacing: -0.2,
  },
  sectionBody: {
    marginTop: spacing.sm,
    fontFamily: 'Inter_400Regular',
    fontSize: 13.5,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  footerBlock: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  footerHairline: {
    width: 48,
    height: 1,
    backgroundColor: `${colors.gold}38`,
    marginBottom: spacing.md,
  },
  footerNote: {
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.4,
    color: colors.goldMuted,
    textTransform: 'uppercase',
  },
});