/**
 * Service de paiement Mobile Money.
 *
 * Gere les flux de paiement pour les 3 operateurs Camerounais :
 * - MTN Mobile Money (MoMo)
 * - Orange Money
 * - Moov Money
 *
 * En mode mock, simule les etapes du paiement :
 * 1. Initiation : validation du numero + appel backend
 * 2. USSD Push : l'operateur envoie un prompt USSD au client
 * 3. Attente confirmation : polling du statut
 * 4. Confirmation : paiement reussi ou echoue
 *
 * En production, ce service appelera les APIs backend
 * qui gereront les integrations avec les operateurs.
 *
 * Conventions :
 * - Pas de type any
 * - Imports @/
 * - Commentaires en francais
 */

import { logger } from '@/lib/logger';
import type { PaymentMethod } from '@/types';

// ============================================================
// Types
// ============================================================

/** Resultat de l'initiation d'un paiement */
export interface PaymentInitResult {
  /** Identifiant unique de la transaction */
  readonly transactionId: string;
  /** Operateur de paiement */
  readonly operator: PaymentMethod;
  /** Numero de telephone du payeur */
  readonly phone: string;
  /** Montant en FCFA */
  readonly amount: number;
  /** Statut actuel */
  readonly status: PaymentStepStatus;
  /** Message USSD a composer (optionnel) */
  readonly ussdCode?: string;
}

/** Statut d'une etape de paiement */
export type PaymentStepStatus =
  | 'idle'
  | 'initiating'
  | 'ussd_sent'
  | 'confirming'
  | 'completed'
  | 'failed'
  | 'expired';

/** Resultat de la verification du statut */
export interface PaymentStatusResult {
  readonly status: PaymentStepStatus;
  readonly transactionId: string;
  readonly message?: string;
}

// ============================================================
// Constantes
// ============================================================

/** Prefixes valides par operateur au Cameroun */
const OPERATOR_PREFIXES: Record<PaymentMethod, string[]> = {
  mtn: ['67', '68', '69', '65', '66'],
  orange: ['69', '65', '66', '67', '68'],
  moov: ['69', '68'],
};

/** Codes USSD pour verifier le solde (information only) */
const USSD_BALANCE_CODES: Record<PaymentMethod, string> = {
  mtn: '*126#',
  orange: '#144#',
  moov: '*155#',
};

// Delai d'expiration du paiement en ms (3 minutes)
// Utilise en production pour le timeout du polling
//const _PAYMENT_TIMEOUT_MS = 3 * 60 * 1000;

// ============================================================
// Helpers
// ============================================================

/**
 * Valide un numero de telephone camerounais.
 * Format attendu : 6XXXXXXXX (9 chiffres commencant par 6)
 */
export function validateCameroonPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  return /^6\d{8}$/.test(cleaned);
}

/**
 * Detecte l'operateur probable a partir du prefixe.
 * Retourne null si le prefixe ne correspond a aucun operateur connu.
 */
export function detectOperator(phone: string): PaymentMethod | null {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.length < 3) return null;

  const prefix = cleaned.substring(0, 2);

  // Priorite : MTN (67, 68, 65), Orange (69, 66), Moov
  // Les prefixes 69 et 68 sont partages, on privilegge MTN
  if (['67', '68', '65'].includes(prefix)) return 'mtn';
  if (['69', '66'].includes(prefix)) return 'orange';

  return null;
}

/**
 * Verifie si un numero est compatible avec un operateur donne.
 */
export function isPhoneCompatibleWithOperator(
  phone: string,
  operator: PaymentMethod,
): boolean {
  const cleaned = phone.replace(/\s/g, '');
  if (!validateCameroonPhone(cleaned)) return false;

  const prefix = cleaned.substring(0, 2);
  return OPERATOR_PREFIXES[operator].includes(prefix);
}

/**
 * Formate un numero de telephone pour l'affichage.
 * Ex: "697123456" -> "697 12 34 56"
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.length !== 9) return phone;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)}`;
}

/**
 * Genere un identifiant de transaction mock.
 */
function generateTransactionId(operator: PaymentMethod): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const prefix = operator === 'mtn' ? 'MTN' : operator === 'orange' ? 'ORG' : 'MOV';
  return `${prefix}-${timestamp}-${random}`;
}

// ============================================================
// Service
// ============================================================

export const paymentService = {
  /**
   * Initie un paiement Mobile Money.
   *
   * En production : appel backend qui initie la transaction
   * et declenche le USSD push vers le telephone du client.
   * En mock : simule l'initiation avec un delai.
   */
  async initiatePayment(
    operator: PaymentMethod,
    phone: string,
    amount: number,
    eventId: string,
    tiers: readonly { tierId: string; quantity: number }[],
  ): Promise<PaymentInitResult> {
    // Validation
    const cleaned = phone.replace(/\s/g, '');

    if (!validateCameroonPhone(cleaned)) {
      throw new Error('Numero de telephone invalide. Format attendu : 6XXXXXXXX');
    }

    if (amount <= 0) {
      throw new Error('Le montant doit etre superieur a 0');
    }

    if (tiers.length === 0) {
      throw new Error('Aucun billet selectionne');
    }

    logger.debug('[paymentService] Initiation paiement:', { operator, phone: cleaned, amount, eventId });

    // Mock : simule un delai d'initiation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const transactionId = generateTransactionId(operator);

    // Mock : toujours reussi en mode dev
    return {
      transactionId,
      operator,
      phone: cleaned,
      amount,
      status: 'ussd_sent',
      ussdCode: USSD_BALANCE_CODES[operator],
    };
  },

  /**
   * Verifie le statut d'un paiement en cours.
   *
   * En production : polling du backend.
   * En mock : simule une confirmation apres un delai.
   */
  async checkPaymentStatus(transactionId: string): Promise<PaymentStatusResult> {
    logger.debug('[paymentService] Check status:', transactionId);

    // Mock : simule un delai de verification
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock : 85% de chance de succes
    const isSuccess = Math.random() < 0.85;

    return {
      transactionId,
      status: isSuccess ? 'completed' : 'failed',
      message: isSuccess
        ? 'Paiement confirme avec succes'
        : 'Le paiement a echoue. Veuillez reessayer.',
    };
  },

  /**
   * Annule un paiement en cours.
   */
  async cancelPayment(transactionId: string): Promise<void> {
    logger.debug('[paymentService] Annulation paiement:', transactionId);
    await new Promise((resolve) => setTimeout(resolve, 500));
  },

  /**
   * Retourne le code USSD de verification de solde pour un operateur.
   */
  getUSSDBalanceCode(operator: PaymentMethod): string {
    return USSD_BALANCE_CODES[operator];
  },

  /**
   * Retourne les prefixes valides pour un operateur.
   */
  getOperatorPrefixes(operator: PaymentMethod): string[] {
    return OPERATOR_PREFIXES[operator];
  },
};

// ============================================================
// Legacy exports pour compatibilite
// ============================================================

/**
 * @deprecated Utiliser paymentService.initiatePayment() a la place.
 */
export async function startUSSD(
  operator: 'mtn' | 'orange' | 'moov',
  phone: string,
  amount: number,
) {
  return paymentService.initiatePayment(operator, phone, amount, '', []);
}
