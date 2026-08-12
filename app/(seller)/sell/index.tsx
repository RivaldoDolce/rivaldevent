/**
 * Vendre — creation d'un evenement (wizard 3 etapes, mock).
 *
 * Etapes :
 * 1. Informations : titre, categorie, type, description, image (URL optionnelle)
 * 2. Date et lieu : date (picker natif), ville, lieu
 * 3. Billets : jusqu'a 3 paliers (nom, prix, quantite)
 *
 * A la publication, l'evenement est ajoute au store vendeur et apparait
 * immediatement dans le dashboard et "Mes evenements".
 *
 * En production : remplacement de addEvent par un appel Supabase
 * (createEvent) + upload d'image dans le bucket storage.
 *
 * Design system « Noir & Or » : stepper or, sections en cartes verre,
 * CTA degrade or, tiers style TicketTierCard sombre.
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  ImagePlus,
} from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DateInput } from '@/components/ui/DateInput';
import { ScreenHeader } from '@/components/profile/ScreenHeader';
import { CATEGORIES } from '@/data/mock';
import { colors, typography, spacing, radius, shadows, gradients, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useSellerStore, type NewSellerEventInput } from '@/stores/seller-store';

// ============================================================
// Types
// ============================================================

interface TierDraft {
  readonly name: string;
  readonly price: string;
  readonly quantity: string;
}

const EMPTY_TIER: TierDraft = { name: '', price: '', quantity: '' };

const EVENT_CATEGORIES = CATEGORIES.filter((category) => category.id !== 'all');

// ============================================================
// Ecran
// ============================================================

export default function SellerSellScreen() {
  const router = useRouter();
  const { impact, notification } = useHaptics();
  const addEvent = useSellerStore((state) => state.addEvent);

  const [step, setStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Etape 1 — informations
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [eventType, setEventType] = useState('physique');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  // Etape 2 — date et lieu
  const [date, setDate] = useState('');
  const [city, setCity] = useState('');
  const [venue, setVenue] = useState('');

  // Etape 3 — billets
  const [tiers, setTiers] = useState<TierDraft[]>([
    { ...EMPTY_TIER, name: 'Standard' },
    { ...EMPTY_TIER, name: 'VIP' },
  ]);

  // -- Validation --
  const step1Valid = title.trim().length >= 3 && category !== '';
  const step2Valid = date !== '' && city.trim() !== '' && venue.trim() !== '';
  const step3Valid =
    tiers.length > 0 &&
    tiers.every(
      (tier) =>
        tier.name.trim() !== '' &&
        Number(tier.price) > 0 &&
        Number(tier.quantity) > 0
    );

  const updateTier = useCallback((index: number, patch: Partial<TierDraft>) => {
    setTiers((prev) =>
      prev.map((tier, i) => (i === index ? { ...tier, ...patch } : tier))
    );
  }, []);

  const addTier = useCallback(() => {
    impact('light');
    setTiers((prev) => (prev.length >= 3 ? prev : [...prev, { ...EMPTY_TIER }]));
  }, [impact]);

  const removeTier = useCallback(
    (index: number) => {
      impact('light');
      setTiers((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    },
    [impact]
  );

  const goNext = useCallback(() => {
    impact('light');
    setStep((prev) => Math.min(prev + 1, 3));
  }, [impact]);

  const goBack = useCallback(() => {
    impact('light');
    setStep((prev) => Math.max(prev - 1, 1));
  }, [impact]);

  const handlePublish = useCallback(() => {
    if (!step3Valid) return;
    setIsPublishing(true);
    impact('medium');

    const input: NewSellerEventInput = {
      title,
      category,
      event_type: eventType,
      description,
      image,
      start_date: date,
      city,
      venue,
      tiers: tiers.map((tier) => ({
        name: tier.name.trim(),
        price: Number(tier.price),
        quantity: Number(tier.quantity),
      })),
    };

    // Simulation d'une publication reussie (Supabase a terme)
    setTimeout(() => {
      addEvent(input);
      setIsPublishing(false);
      setShowSuccess(true);
      notification('success');
    }, 700);
  }, [step3Valid, title, category, eventType, description, image, date, city, venue, tiers, addEvent, impact, notification]);

  const handleGoToEvents = useCallback(() => {
    impact('light');
    setShowSuccess(false);
    router.push(ROUTES.SELLER_EXPLORE);
  }, [impact, router]);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Creer un evenement"
          subtitle="Mettez votre billetterie en ligne"
        />

        {/* ============================================
            Stepper
            ============================================ */}
        <View style={styles.stepper}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={styles.stepperItem}>
              <View
                style={[
                  styles.stepperCircle,
                  s < step ? styles.stepperCircleDone : null,
                  s === step ? styles.stepperCircleActive : null,
                ]}
              >
                {s < step ? (
                  <Check size={14} color={colors.onyx} strokeWidth={3} />
                ) : (
                  <Text
                    style={[
                      styles.stepperNumber,
                      s === step ? styles.stepperNumberActive : null,
                    ]}
                  >
                    {s}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepperLabel,
                  s === step ? styles.stepperLabelActive : null,
                ]}
              >
                {s === 1 ? 'Infos' : s === 2 ? 'Date' : 'Billets'}
              </Text>
              {s < 3 ? (
                <View
                  style={[
                    styles.stepperLine,
                    s < step ? styles.stepperLineDone : null,
                  ]}
                />
              ) : null}
            </View>
          ))}
        </View>

        {/* ============================================
            STEP 1 — INFORMATIONS
            ============================================ */}
        {step === 1 ? (
          <View style={styles.formCard}>
            <Text style={styles.stepTitle}>Informations generales</Text>
            <Text style={styles.stepSubtitle}>
              Comment les participants vont decouvrir votre evenement
            </Text>

            <Input
              label="Titre de l'evenement"
              placeholder="Ex: Concert Afrobeats Douala"
              value={title}
              onChangeText={setTitle}
              autoCapitalize="sentences"
              autoCorrect={false}
              maxLength={80}
              error={title.length > 0 && title.length < 3 ? 'Minimum 3 caracteres' : undefined}
            />

            <Text style={styles.fieldLabel}>Categorie</Text>
            <View style={styles.chipsWrap}>
              {EVENT_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      impact('light');
                      setCategory(cat.id);
                    }}
                    style={[styles.chip, isSelected ? styles.chipSelected : null]}
                    accessibilityRole="button"
                    accessibilityLabel={cat.label}
                  >
                    <Text
                      style={[styles.chipText, isSelected ? styles.chipTextSelected : null]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Type d'evenement</Text>
            <View style={styles.typeRow}>
              {(['physique', 'en ligne'] as const).map((type) => {
                const isSelected = eventType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => {
                      impact('light');
                      setEventType(type);
                    }}
                    style={[
                      styles.typeCard,
                      isSelected ? styles.typeCardSelected : null,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={type === 'physique' ? 'En presentiel' : 'En ligne'}
                  >
                    <Text
                      style={[styles.typeText, isSelected ? styles.typeTextSelected : null]}
                    >
                      {type === 'physique' ? 'En presentiel' : 'En ligne'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Input
              label="Description"
              placeholder="Programme, artistes, informations pratiques..."
              value={description}
              onChangeText={setDescription}
              autoCapitalize="sentences"
              autoCorrect={false}
              maxLength={220}
            />

            <Input
              label="Image (URL optionnelle)"
              placeholder="https://..."
              value={image}
              onChangeText={setImage}
              autoCapitalize="none"
              autoCorrect={false}
              iconLeft={<ImagePlus color={colors.goldMuted} size={20} strokeWidth={1.5} />}
              helperText="Laissez vide pour utiliser une image par defaut"
            />

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!step1Valid}
              onPress={goNext}
              icon={<ArrowRight color={colors.onyx} size={18} />}
              iconPosition="right"
            >
              Continuer
            </Button>
          </View>
        ) : null}

        {/* ============================================
            STEP 2 — DATE ET LIEU
            ============================================ */}
        {step === 2 ? (
          <View style={styles.formCard}>
            <Text style={styles.stepTitle}>Date et lieu</Text>
            <Text style={styles.stepSubtitle}>
              Quand et ou se deroulera votre evenement
            </Text>

            <DateInput
              label="Date de l'evenement"
              value={date}
              onDateChange={(value) => {
                impact('light');
                setDate(value);
              }}
            />

            <Input
              label="Ville"
              placeholder="Ex: Douala"
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
              maxLength={40}
            />

            <Input
              label="Lieu"
              placeholder="Ex: Palais des Sports"
              value={venue}
              onChangeText={setVenue}
              autoCapitalize="words"
              maxLength={60}
            />

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!step2Valid}
              onPress={goNext}
              icon={<ArrowRight color={colors.onyx} size={18} />}
              iconPosition="right"
            >
              Continuer
            </Button>
          </View>
        ) : null}

        {/* ============================================
            STEP 3 — BILLETS
            ============================================ */}
        {step === 3 ? (
          <View style={styles.formCard}>
            <View style={styles.tiersHeader}>
              <View>
                <Text style={styles.stepTitle}>Vos billets</Text>
                <Text style={styles.stepSubtitle}>
                  Jusqu'a 3 paliers avec prix et quantite
                </Text>
              </View>
            </View>

            {tiers.map((tier, index) => (
              <View key={index} style={styles.tierCard}>
                <View style={styles.tierCardHeader}>
                  <Text style={styles.tierIndex}>Palier {index + 1}</Text>
                  {tiers.length > 1 ? (
                    <Pressable
                      onPress={() => removeTier(index)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={`Supprimer le palier ${index + 1}`}
                    >
                      <Trash2 size={17} color={colors.terracotta} strokeWidth={1.5} />
                    </Pressable>
                  ) : null}
                </View>

                <Input
                  label="Nom du palier"
                  placeholder="Ex: VIP"
                  value={tier.name}
                  onChangeText={(text) => updateTier(index, { name: text })}
                  maxLength={30}
                />

                <View style={styles.tierRow}>
                  <View style={[styles.tierField, { marginRight: spacing.sm }]}>
                    <Input
                      label="Prix (FCFA)"
                      placeholder="15000"
                      value={tier.price}
                      onChangeText={(text) =>
                        updateTier(index, { price: text.replace(/\D/g, '') })
                      }
                      keyboardType="numeric"
                      maxLength={7}
                    />
                  </View>
                  <View style={styles.tierField}>
                    <Input
                      label="Quantite"
                      placeholder="100"
                      value={tier.quantity}
                      onChangeText={(text) =>
                        updateTier(index, { quantity: text.replace(/\D/g, '') })
                      }
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                </View>
              </View>
            ))}

            {tiers.length < 3 ? (
              <Pressable
                onPress={addTier}
                style={styles.addTierButton}
                accessibilityRole="button"
                accessibilityLabel="Ajouter un palier"
              >
                <Plus size={17} color={colors.goldBright} strokeWidth={2} />
                <Text style={styles.addTierText}>Ajouter un palier</Text>
              </Pressable>
            ) : null}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={isPublishing}
              disabled={!step3Valid}
              onPress={handlePublish}
              icon={<Check color={colors.onyx} size={18} />}
            >
              {isPublishing ? 'Publication...' : 'Publier mon evenement'}
            </Button>
          </View>
        ) : null}

        {/* Navigation bas de wizard */}
        {step > 1 ? (
          <Pressable
            onPress={goBack}
            style={styles.backLink}
            accessibilityRole="button"
            accessibilityLabel="Etape precedente"
          >
            <ArrowLeft size={16} color={colors.textSecondary} strokeWidth={1.75} />
            <Text style={styles.backLinkText}>Etape precedente</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {/* ============================================
          MODAL SUCCES
          ============================================ */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
        onRequestClose={handleGoToEvents}
      >
        <View style={styles.successBackdrop}>
          <View style={styles.successCard}>
            <LinearGradient
              colors={[...gradients.gold] as unknown as readonly [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.successCircle}
            >
              <Check size={30} color={colors.onyx} strokeWidth={2.5} />
            </LinearGradient>
            <Text style={styles.successTitle}>Evenement publie</Text>
            <Text style={styles.successDescription}>
              Votre evenement est en ligne. Les participants peuvent desormais
              reserver leurs billets.
            </Text>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleGoToEvents}
            >
              Voir mes evenements
            </Button>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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

  // -- Stepper --
  stepper: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  stepperItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: `${colors.gold}40`,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCircleActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(216,180,90,0.16)',
    ...shadows.goldGlowSoft,
  },
  stepperCircleDone: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  stepperNumber: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  stepperNumberActive: {
    color: colors.goldBright,
  },
  stepperLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    lineHeight: 14,
    color: colors.textMuted,
    marginLeft: 5,
  },
  stepperLabelActive: {
    color: colors.goldBright,
    fontFamily: 'Inter_600SemiBold',
  },
  stepperLine: {
    flex: 1,
    height: 2,
    backgroundColor: `${colors.gold}22`,
    marginHorizontal: spacing.sm,
  },
  stepperLineDone: {
    backgroundColor: colors.gold,
  },

  // -- Formulaire --
  formCard: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.elevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    padding: spacing.lg,
    ...shadows.card,
  },
  stepTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    letterSpacing: -0.2,
  },
  stepSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
  },
  chipSelected: {
    backgroundColor: 'rgba(216,180,90,0.14)',
    borderColor: `${colors.gold}55`,
  },
  chipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.goldBright,
    fontFamily: 'Inter_600SemiBold',
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeCard: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
    alignItems: 'center',
  },
  typeCardSelected: {
    backgroundColor: 'rgba(216,180,90,0.10)',
    borderColor: `${colors.gold}55`,
  },
  typeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  typeTextSelected: {
    color: colors.goldBright,
    fontFamily: 'Inter_600SemiBold',
  },

  // -- Tiers --
  tiersHeader: {
    marginBottom: spacing.md,
  },
  tierCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.gold}2E`,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  tierCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tierIndex: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 17,
    color: colors.goldBright,
    letterSpacing: 0.4,
  },
  tierRow: {
    flexDirection: 'row',
  },
  tierField: {
    flex: 1,
  },
  addTierButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: `${colors.gold}55`,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(216,180,90,0.06)',
  },
  addTierText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.goldBright,
    marginLeft: spacing.sm,
  },

  // -- Navigation --
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backLinkText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },

  // -- Modal succes --
  successBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,9,8,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  successCard: {
    width: '100%',
    backgroundColor: colors.elevated,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: `${colors.gold}2E`,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.elevated,
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.goldGlow,
  },
  successTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
  },
  successDescription: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});