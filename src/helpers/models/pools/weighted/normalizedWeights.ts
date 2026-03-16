import { BigNumberish } from 'ethers';

// Should match MAX_WEIGHTED_TOKENS from v2-helpers/constants
// Including would introduce a dependency
const MaxWeightedTokens = 100;
const ONE = 10n ** 18n;

/**
 * Normalize an array of token weights to ensure they sum to `1e18`
 * @param weights - an array of token weights to be normalized
 * @returns an equivalent set of normalized weights
 */
export function toNormalizedWeights(weights: bigint[]): bigint[] {
  // When the number is exactly equal to the max, normalizing with common inputs
  // leads to a value < 0.01, which reverts. In this case fill in the weights exactly.
  if (weights.length == MaxWeightedTokens) {
    return Array(MaxWeightedTokens).fill(ONE / BigInt(MaxWeightedTokens));
  }

  const sum = weights.reduce((total, weight) => total + weight, 0n);
  if (sum === ONE) return weights;

  const normalizedWeights: bigint[] = [];
  let normalizedSum = 0n;
  for (let index = 0; index < weights.length; index++) {
    if (index < weights.length - 1) {
      normalizedWeights[index] = weights[index] * ONE / sum;
      normalizedSum = normalizedSum + normalizedWeights[index];
    } else {
      normalizedWeights[index] = ONE - normalizedSum;
    }
  }

  return normalizedWeights;
}

/**
 * Check whether a set of weights are normalized
 * @param weights - an array of potentially unnormalized weights
 * @returns a boolean of whether the weights are normalized
 */
export const isNormalizedWeights = (weights: BigNumberish[]): boolean => {
  const totalWeight = weights.reduce((total: bigint, weight) => total + BigInt(weight.toString()), 0n);
  return totalWeight === ONE;
};
