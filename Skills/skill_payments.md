# Skill : Paiements Mobile Money Rivald'event

## Rôle
Tu es l'ingénieur paiements senior de Rivald'event. Les transactions Mobile Money (MTN, Orange, Moov) sont le cœur de la monétisation. Tout doit être sécurisé, fiable, et transparent pour l'utilisateur.

## Contexte Marché

| Opérateur | Pays couverts | API disponible | Fallback |
|-----------|--------------|----------------|----------|
| MTN Mobile Money | Cameroun, Côte d'Ivoire, Ghana, etc. | MTN MoMo API | USSD |
| Orange Money | Cameroun, Côte d'Ivoire, Sénégal, etc. | Orange Money API | USSD |
| Moov Money | Côte d'Ivoire, Togo, Bénin | Moov API | USSD |

## Architecture Paiement

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   APP CLIENT    │     │  SUPABASE EDGE  │     │  OPÉRATEUR API   │
│                 │────►│    FUNCTION     │────►│   (MTN/Orange)  │
│  1. Sélection   │     │  2. Validation  │     │  3. Transaction │
│     opérateur   │     │     montant     │     │     USSD/API    │
│  4. Overlay     │◄────│  5. Webhook     │◄────│  6. Callback    │
│     USSD        │     │     polling     │     │     status      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  SQLite Cache   │     │  Supabase DB    │
│  (ticket local) │     │  (transactions) │
└─────────────────┘     └─────────────────┘
```

## Flow Complet

### 1. Sélection Opérateur (UI)

```typescript
// app/(purchase)/payment/index.tsx
export default function PaymentOperatorScreen() {
  const { eventId, totalAmount } = useLocalSearchParams();
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);

  const operators = [
    { id: 'mtn', name: 'MTN Mobile Money', color: '#FFCC00', icon: 'MtnIcon' },
    { id: 'orange', name: 'Orange Money', color: '#FF6600', icon: 'OrangeIcon' },
    { id: 'moov', name: 'Moov Money', color: '#0066CC', icon: 'MoovIcon' },
  ];

  return (
    <View className="flex-1 bg-sand p-6">
      <Text className="text-h2 text-onyx mb-6">Paiement Mobile</Text>

      <View className="bg-ivory rounded-2xl p-4 mb-8">
        <Text className="text-stone">Montant total</Text>
        <Text className="text-h1 text-onyx">{totalAmount} FCFA</Text>
      </View>

      {operators.map((op) => (
        <TouchableOpacity
          key={op.id}
          onPress={() => setSelectedOperator(op.id)}
          className={`flex-row items-center p-4 rounded-2xl mb-3 ${
            selectedOperator === op.id ? 'bg-terracotta/10 border-2 border-terracotta' : 'bg-white'
          }`}
        >
          <op.icon color={op.color} />
          <Text className="flex-1 ml-3 text-onyx font-semibold">{op.name}</Text>
          {selectedOperator === op.id && (
            <View className="w-6 h-6 rounded-full bg-terracotta items-center justify-center">
              <CheckIcon color="white" size={16} />
            </View>
          )}
        </TouchableOpacity>
      ))}

      <Button
        variant="primary"
        disabled={!selectedOperator}
        onPress={() => router.push(`/payment/${selectedOperator}`)}
      >
        Continuer
      </Button>
    </View>
  );
}
```

### 2. Formulaire Paiement (par opérateur)

```typescript
// app/(purchase)/payment/[operator].tsx
export default function PaymentFormScreen() {
  const { operator } = useLocalSearchParams<{ operator: string }>();
  const { control, handleSubmit, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      phoneNumber: '',
      confirmPhone: '',
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    // Chiffrer le numéro avant envoi
    const encryptedPhone = await encryptPhone(data.phoneNumber);

    // Appeler l'Edge Function de paiement
    const result = await paymentService.initiate({
      operator,
      phoneNumber: encryptedPhone,
      amount: totalAmount,
      eventId,
      ticketTiers: selectedTiers,
      idempotencyKey: generateIdempotencyKey(),
    });

    if (result.requiresUSSD) {
      // Afficher l'overlay USSD
      showUSSDOverlay(result.ussdCode, result.instructions);
    } else {
      // Paiement direct API
      router.push(`/payment/confirmation?transactionId=${result.transactionId}`);
    }
  };

  return (
    <View className="flex-1 bg-sand p-6">
      <Text className="text-h2 text-onyx mb-2">
        {operator === 'mtn' && 'MTN Mobile Money'}
        {operator === 'orange' && 'Orange Money'}
        {operator === 'moov' && 'Moov Money'}
      </Text>

      <Controller
        control={control}
        name="phoneNumber"
        render={({ field }) => (
          <Input
            label="Numéro de téléphone"
            placeholder="6XX XXX XXX"
            keyboardType="phone-pad"
            iconLeft={<PhoneIcon />}
            error={errors.phoneNumber?.message}
            {...field}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPhone"
        render={({ field }) => (
          <Input
            label="Confirmer le numéro"
            placeholder="6XX XXX XXX"
            keyboardType="phone-pad"
            error={errors.confirmPhone?.message}
            {...field}
          />
        )}
      />

      <Button variant="primary" onPress={handleSubmit(onSubmit)}>
        Valider le paiement
      </Button>
    </View>
  );
}

// Validation Zod
const paymentSchema = z.object({
  phoneNumber: z.string()
    .regex(/^6[0-9]{8}$/, 'Numéro camerounais invalide (format: 6XX XXX XXX)')
    .transform((val) => val.replace(/\s/g, '')),
  confirmPhone: z.string(),
}).refine((data) => data.phoneNumber === data.confirmPhone, {
  message: 'Les numéros ne correspondent pas',
  path: ['confirmPhone'],
});
```

### 3. Overlay USSD

```typescript
// components/payment/USSDOverlay.tsx
export function USSDOverlay({
  ussdCode,
  instructions,
  onComplete,
  onCancel,
}: USSDOverlayProps) {
  const [step, setStep] = useState(0);
  const [timer, setTimer] = useState(300); // 5 minutes

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          onCancel?.();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Modal animationType="slide" transparent={false}>
      <View className="flex-1 bg-onyx/95 p-6 justify-center">
        <View className="bg-sand rounded-3xl p-6">
          <Text className="text-h2 text-onyx text-center mb-4">
            Validez sur votre téléphone
          </Text>

          <View className="bg-terracotta/10 rounded-2xl p-6 mb-6">
            <Text className="text-center text-stone mb-2">Composez</Text>
            <Text className="text-center text-h1 text-terracotta font-mono">
              {ussdCode}
            </Text>
            <TouchableOpacity
              onPress={() => Clipboard.setString(ussdCode)}
              className="mt-2"
            >
              <Text className="text-center text-gold">Copier le code</Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-3 mb-6">
            {instructions.map((instruction, index) => (
              <View key={index} className="flex-row items-start">
                <View className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${
                  step > index ? 'bg-forest' : 'bg-stone/20'
                }`}>
                  {step > index ? (
                    <CheckIcon size={14} color="white" />
                  ) : (
                    <Text className="text-stone text-xs">{index + 1}</Text>
                  )}
                </View>
                <Text className={`flex-1 ${step > index ? 'text-onyx' : 'text-stone'}`}>
                  {instruction}
                </Text>
              </View>
            ))}
          </View>

          <View className="bg-ivory rounded-xl p-4 mb-6">
            <Text className="text-center text-stone">
              Temps restant : {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </Text>
          </View>

          <Button variant="outline" onPress={onCancel}>
            Annuler
          </Button>
        </View>
      </View>
    </Modal>
  );
}
```

### 4. Edge Function (Supabase)

```typescript
// supabase/functions/payment-initiate/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const { operator, phoneNumber, amount, eventId, ticketTiers, idempotencyKey } = await req.json();

  // 1. Validation
  if (!['mtn', 'orange', 'moov'].includes(operator)) {
    return new Response(JSON.stringify({ error: 'Opérateur invalide' }), { status: 400 });
  }

  // 2. Vérifier idempotency
  const { data: existing } = await supabase
    .from('transactions')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .single();

  if (existing) {
    return new Response(JSON.stringify({ transactionId: existing.id }), { status: 200 });
  }

  // 3. Créer transaction pending
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: authUser.id,
      type: 'ticket_sale',
      amount,
      currency: 'XAF',
      status: 'pending',
      provider: operator,
      provider_ref: null,
      idempotency_key: idempotencyKey,
      metadata: { eventId, ticketTiers, phoneNumber: hashPhone(phoneNumber) },
    })
    .select()
    .single();

  if (txError) throw txError;

  // 4. Appeler API opérateur
  let paymentResult;
  try {
    paymentResult = await callOperatorAPI(operator, {
      phoneNumber,
      amount,
      reference: transaction.id,
      description: `Rivald'event - Billet ${eventId}`,
    });
  } catch (error) {
    // Marquer failed
    await supabase.from('transactions').update({ status: 'failed' }).eq('id', transaction.id);
    throw error;
  }

  // 5. Réponse
  if (paymentResult.requiresUSSD) {
    return new Response(JSON.stringify({
      transactionId: transaction.id,
      requiresUSSD: true,
      ussdCode: paymentResult.ussdCode,
      instructions: paymentResult.instructions,
    }), { status: 200 });
  }

  // Paiement direct
  return new Response(JSON.stringify({
    transactionId: transaction.id,
    requiresUSSD: false,
    status: 'processing',
  }), { status: 200 });
});

// Webhook callback des opérateurs
serve(async (req) => {
  const { transactionId, status, providerRef } = await req.json();

  // Vérifier signature webhook
  if (!verifyWebhookSignature(req)) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Mettre à jour transaction
  await supabase.from('transactions').update({
    status: status === 'success' ? 'completed' : 'failed',
    provider_ref: providerRef,
    updated_at: new Date().toISOString(),
  }).eq('id', transactionId);

  // Si succès, créer le billet
  if (status === 'success') {
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', transactionId).single();
    await createTicketFromTransaction(tx);
  }

  return new Response('OK', { status: 200 });
});
```

## Sécurité Paiement

### Chiffrement Numéro Téléphone

```typescript
// lib/crypto.ts
import * as Crypto from 'expo-crypto';

const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY!;

export async function encryptPhone(phone: string): Promise<string> {
  const iv = await Crypto.getRandomBytesAsync(16);
  const encrypted = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${phone}:${ENCRYPTION_KEY}:${iv}`
  );
  return `${iv.toString('base64')}:${encrypted}`;
}
```

### Idempotency

```typescript
// lib/payment.ts
export function generateIdempotencyKey(): string {
  return `idemp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Stocké dans Zustand pour persistance
usePaymentStore.getState().setIdempotencyKey(key);
```

### Rollback

```typescript
// services/payment.service.ts
async function rollbackPayment(transactionId: string) {
  // 1. Annuler transaction
  await supabase.from('transactions').update({ status: 'failed' }).eq('id', transactionId);

  // 2. Libérer les billets réservés
  await supabase.rpc('release_tickets', { transaction_id: transactionId });

  // 3. Notifier l'utilisateur
  showNotification('Paiement échoué', 'Vos billets ont été libérés. Réessayez.');
}
```

## UX Paiement

### États de Transaction

| État | UI | Action utilisateur |
|------|-----|-------------------|
| `pending` | Spinner + "Validation en cours..." | Attendre |
| `processing` | Spinner + "Paiement en cours..." | Suivre instructions USSD |
| `completed` | Animation succès + QR code | Voir le billet |
| `failed` | Message rouge + "Réessayer" | Réessayer ou changer opérateur |
| `refunded` | Message info + "Remboursé" | Contacter support |

### Feedback Haptic

```typescript
// lib/haptics.ts
import * as Haptics from 'expo-haptics';

export const paymentHaptics = {
  initiate: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  failure: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  stepComplete: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
};
```

## Checklist Paiement

- [ ] Numéro chiffré avant envoi
- [ ] Idempotency key unique par transaction
- [ ] Validation montant côté serveur
- [ ] Timeout de 10 min max
- [ ] Retry automatique 3x avec backoff
- [ ] Rollback en cas d'échec
- [ ] Webhook sécurisé (signature)
- [ ] Polling fallback si webhook manqué
- [ ] Cache transaction dans SQLite
- [ ] UI offline bloque le paiement (pas de queue pour les paiements)
- [ ] Haptic feedback sur chaque étape
- [ ] Instructions USSD claires et copiables
- [ ] Timer visible pour l'expiration
