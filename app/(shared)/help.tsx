/**
 * Aide et support — questions frequentes et contacts.
 *
 * Ecran PARTAGE (hors groupes client/vendeur) : le retour ramene
 * toujours a l'ecran d'origine (client ou vendeur) avec son etat.
 *
 * Design "Noir & Or" :
 * - Header partage via components/profile/ScreenHeader
 * - FAQ en cartes elevated (question semi-bold + reponse tamisee)
 * - Rows de contact en verre fume (WhatsApp, appel, email)
 * - Version du pied de page
 *
 * Conventions :
 * - Toutes les couleurs viennent de lib/constants.ts
 * - Pas de type any, pas d'emojis, imports @/
 */

import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native';
import { ChevronDown, ChevronUp, MessageCircle, Phone, Mail } from 'lucide-react-native';

import { ScreenHeader } from '@/components/profile/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { colors, spacing, radius } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';

// ============================================================
// Donnees statiques
// ============================================================

const FAQ_ITEMS: readonly { question: string; answer: string }[] = [
  {
    question: 'Comment acheter un billet ?',
    answer:
      'Choisissez un evenement, selectionnez votre categorie de billet, puis payez par MTN Mobile Money, Orange Money ou Moov Money. Votre billet apparait immediatement dans "Mes billets".',
  },
  {
    question: 'Comment obtenir un remboursement ?',
    answer:
      'Les remboursements sont possibles jusqu\'a 48 heures avant l\'evenement. Contactez le support avec votre numero de billet et le motif de la demande.',
  },
  {
    question: 'Comment devenir organisateur ?',
    answer:
      'Depuis votre profil, appuyez sur "Passer en mode vendeur". Vous pourrez creer des evenements, vendre des billets et suivre vos ventes en temps reel.',
  },
  {
    question: 'Mon billet ne se charge pas, que faire ?',
    answer:
      'Verifiez votre connexion puis relancez l\'application. Si le probleme persiste, contactez le support en indiquant votre numero de commande.',
  },
  {
    question: 'Comment est protégé mon paiement ?',
    answer:
      'Les paiements passent par les canaux officiels Mobile Money (MTN, Orange, Moov) avec un identifiant de transaction unique pour chaque achat.',
  },
];

const CONTACTS: readonly {
  readonly label: string;
  readonly value: string;
  readonly icon: React.ReactNode;
  readonly action: () => void;
}[] = [
  {
    label: 'WhatsApp',
    value: '+237 6 99 88 77 66',
    icon: <MessageCircle size={20} color={colors.gold} strokeWidth={1.75} />,
    action: () => {
      Linking.openURL('https://wa.me/237699887766').catch(() => {
        // Silent fail hors ligne
      });
    },
  },
  {
    label: 'Appeler le support',
    value: '+237 6 99 88 77 66',
    icon: <Phone size={20} color={colors.gold} strokeWidth={1.75} />,
    action: () => {
      Linking.openURL('tel:+237699887766').catch(() => {
        // Silent fail
      });
    },
  },
  {
    label: 'Email',
    value: 'support@rivaldevent.cm',
    icon: <Mail size={20} color={colors.gold} strokeWidth={1.75} />,
    action: () => {
      Linking.openURL('mailto:support@rivaldevent.cm').catch(() => {
        // Silent fail
      });
    },
  },
];

// ============================================================
// Ecran
// ============================================================

export default function HelpScreen() {
  const { impact } = useHaptics();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = useCallback(
    (index: number) => {
      impact('light');
      setOpenIndex((prev) => (prev === index ? null : index));
    },
    [impact]
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Aide et support"
          subtitle="Nous sommes la pour vous aider"
        />

        {/* ============================================
            FAQ
            ============================================ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUESTIONS FREQUENTES</Text>
          <Card variant="elevated" padding="none">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <Pressable
                  key={item.question}
                  onPress={() => handleToggle(index)}
                  style={[
                    styles.faqRow,
                    index < FAQ_ITEMS.length - 1 ? styles.faqRowBorder : null,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  accessibilityLabel={item.question}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{item.question}</Text>
                    {isOpen ? (
                      <ChevronUp size={18} color={colors.goldMuted} strokeWidth={1.75} />
                    ) : (
                      <ChevronDown size={18} color={colors.goldMuted} strokeWidth={1.75} />
                    )}
                  </View>
                  {isOpen ? (
                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </Card>
        </View>

        {/* ============================================
            CONTACTS
            ============================================ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOUS CONTACTER</Text>
          <View style={styles.contactList}>
            {CONTACTS.map((contact) => (
              <Pressable
                key={contact.label}
                onPress={() => {
                  impact('light');
                  contact.action();
                }}
                style={styles.contactRow}
                accessibilityRole="button"
                accessibilityLabel={contact.label}
              >
                <View style={styles.contactIcon}>{contact.icon}</View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>{contact.label}</Text>
                  <Text style={styles.contactValue}>{contact.value}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ============================================
            HORAIRES
            ============================================ */}
        <View style={styles.section}>
          <Card variant="elevated" padding="lg">
            <Text style={styles.hoursTitle}>Horaires du support</Text>
            <Text style={styles.hoursText}>
              Du lundi au samedi, de 8h00 a 20h00 (heure du Cameroun).
            </Text>
          </Card>
        </View>

        {/* ============================================
            VERSION
            ============================================ */}
        <View style={styles.versionBlock}>
          <View style={styles.versionHairline} />
          <Text style={styles.versionText}>Rivald'event — Version 1.0.0</Text>
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
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    color: colors.goldMuted,
    letterSpacing: 1.4,
    marginBottom: spacing.sm + 2,
    marginLeft: spacing.xs,
  },
  faqRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  faqRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: `${colors.gold}1F`,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    marginRight: spacing.md,
  },
  faqAnswer: {
    marginTop: spacing.sm,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  contactList: {
    gap: spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassGold,
    borderWidth: 1,
    borderColor: `${colors.gold}33`,
  },
  contactInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  contactLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
  contactValue: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: 1,
  },
  hoursTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    letterSpacing: -0.2,
  },
  hoursText: {
    marginTop: spacing.xs,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  versionBlock: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  versionHairline: {
    width: 48,
    height: 1,
    backgroundColor: `${colors.gold}38`,
    marginBottom: spacing.md,
  },
  versionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
});