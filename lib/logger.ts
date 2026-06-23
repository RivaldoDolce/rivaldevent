/**
 * Logger conditionnel.
 *
 * Regles :
 * - debug : uniquement en __DEV__
 * - warn/error : toujours (meme en production)
 * - sensitive : jamais (silencieux)
 *
 * Jamais logger : mot de passe, token, numero telephone, qr_secret, code OTP.
 */

type LogLevel = 'debug' | 'warn' | 'error';

interface Logger {
  debug: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  sensitive: (..._args: unknown[]) => void;
}

function log(level: LogLevel, args: unknown[]): void {
  const prefix = `[Rivald'event ${level.toUpperCase()}]`;
  // eslint-disable-next-line no-console
  console[level](prefix, ...args);
}

export const logger: Logger = {
  debug: (...args) => {
    if (__DEV__) {
      log('debug', args);
    }
  },
  warn: (...args) => {
    log('warn', args);
  },
  error: (...args) => {
    log('error', args);
  },
  sensitive: () => {
    // Jamais de logs sensibles
  },
};