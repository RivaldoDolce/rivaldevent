/**
 * Schémas Zod pour la validation des formulaires.
 *
 * Utilises par React Hook Form (zodResolver) ET par les Edge Functions
 * pour la double validation (client + serveur).
 *
 * Regles :
 * - Email : format valide
 * - Mot de passe : min 8, 1 maj, 1 chiffre, 1 special
 * - Telephone : format camerounais (6XXXXXXXX)
 * - OTP : 6 chiffres
 */

import { z } from 'zod';

// ============================================================
// AUTH
// ============================================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Email invalide'),
  password: z
    .string()
    .min(1, 'Mot de passe requis')
    .min(8, 'Minimum 8 caractères'),
});

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(1, 'Nom complet requis')
      .min(2, 'Minimum 2 caractères')
      .max(80, 'Maximum 80 caractères'),
    email: z
      .string()
      .min(1, 'Email requis')
      .email('Email invalide'),
    phone: z
      .string()
      .min(1, 'Numéro requis')
      .regex(/^6[0-9]{8}$/, 'Format invalide (6XXXXXXXX)'),
    password: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .regex(/[A-Z]/, '1 majuscule requise')
      .regex(/[0-9]/, '1 chiffre requis')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, '1 caractère spécial requis'),
    confirm_password: z.string().min(1, 'Confirmation requise'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  });

export const phoneLoginSchema = z.object({
  phone: z
    .string()
    .min(1, 'Numéro requis')
    .regex(/^6[0-9]{8}$/, 'Format invalide (6XXXXXXXX)'),
});

export const otpSchema = z.object({
  code: z
    .string()
    .min(1, 'Code requis')
    .length(6, 'Le code doit contenir 6 chiffres')
    .regex(/^[0-9]+$/, 'Chiffres uniquement'),
});

// ============================================================
// Inférence de types
// ============================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PhoneLoginInput = z.infer<typeof phoneLoginSchema>;
export type OtpInput = z.infer<typeof otpSchema>;