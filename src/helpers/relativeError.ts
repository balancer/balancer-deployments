import { expect } from 'chai';
import { Decimal } from 'decimal.js';
import { BigNumberish, bn, pct } from './numbers';

export function expectEqualWithError(actual: BigNumberish, expected: BigNumberish, error: BigNumberish = 0.001): void {
  const actualBn = bn(actual);
  const expectedBn = bn(expected);
  const acceptedError = pct(expectedBn, error);

  if (actualBn >= 0n) {
    expect(actualBn >= expectedBn - acceptedError).to.be.true;
    expect(actualBn <= expectedBn + acceptedError).to.be.true;
  } else {
    expect(actualBn <= expectedBn - acceptedError).to.be.true;
    expect(actualBn >= expectedBn + acceptedError).to.be.true;
  }
}

export function expectArrayEqualWithError(
  actual: Array<BigNumberish>,
  expected: Array<BigNumberish>,
  error: BigNumberish = 0.001
): void {
  expect(actual.length).to.be.eq(expected.length);
  for (let i = 0; i < actual.length; i++) {
    expectEqualWithError(actual[i], expected[i], error);
  }
}

export function expectLessThanOrEqualWithError(
  actual: BigNumberish,
  expected: BigNumberish,
  error: BigNumberish = 0.001
): void {
  const actualBn = bn(actual);
  const expectedBn = bn(expected);
  const minimumValue = expectedBn - pct(expectedBn, error);

  expect(actualBn <= expectedBn).to.be.true;
  expect(actualBn >= minimumValue).to.be.true;
}

export function expectRelativeError(actual: Decimal, expected: Decimal, maxRelativeError: Decimal): void {
  const lessThanOrEqualTo = actual.dividedBy(expected).sub(1).abs().lessThanOrEqualTo(maxRelativeError);
  expect(lessThanOrEqualTo, 'Relative error too big').to.be.true;
}
