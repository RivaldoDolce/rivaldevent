/**
 * Opérations vectorielles pures du recommandeur.
 *
 * Toutes les fonctions sont déterministes, sans état global ni accès réseau.
 * Les dimensions sont vérifiées avant chaque calcul : une incompatibilité
 * produit une erreur explicite plutôt qu'un score silencieusement faux.
 */

export function assertSameDimension(
  left: readonly number[],
  right: readonly number[],
): void {
  if (left.length !== right.length) {
    throw new Error(
      `Dimensions incompatibles : ${left.length} != ${right.length}. ` +
        'Vérifier la dimension annoncée dans embeddings.v1.json.',
    );
  }
  if (left.length === 0) {
    throw new Error('Vecteur vide : dimension nulle.');
  }
}

export function dot(left: readonly number[], right: readonly number[]): number {
  assertSameDimension(left, right);
  let sum = 0;
  for (let index = 0; index < left.length; index += 1) {
    sum += left[index] * right[index];
  }
  return sum;
}

export function l2Norm(vector: readonly number[]): number {
  let sum = 0;
  for (const value of vector) {
    sum += value * value;
  }
  return Math.sqrt(sum);
}

/**
 * Normalise un vecteur en L2. Renvoie `null` pour un vecteur nul ou non fini :
 * le moteur doit alors utiliser un repli explicite (score sémantique = 0).
 */
export function l2Normalize(vector: readonly number[]): number[] | null {
  const norm = l2Norm(vector);
  if (!Number.isFinite(norm) || norm <= 0) {
    return null;
  }
  return vector.map((value) => value / norm);
}

/** Similarité cosinus ; renvoie 0 si l'un des vecteurs est nul. */
export function cosineSimilarity(
  left: readonly number[],
  right: readonly number[],
): number {
  assertSameDimension(left, right);
  const leftNorm = l2Norm(left);
  const rightNorm = l2Norm(right);
  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }
  return dot(left, right) / (leftNorm * rightNorm);
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}
