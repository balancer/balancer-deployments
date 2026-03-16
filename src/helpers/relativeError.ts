import { expect } from 'chai';
import { Decimal } from 'decimal.js';
import { BigNumberish, bn, pct } from './numbers';

export function expectEqualWithError(actual: BigNumberish, expected: BigNumberish, error: BigNumberish = 0.001): void {
  const a = bn(actual);
  const e = bn(expected);
  const acceptedError = pct(expected, error);

  if (a >= 0n) {
    expect(a).to.be.at.least(e - acceptedError);
    expect(a).to.be.at.most(e + acceptedError);
  } else {
    expect(a).to.be.at.most(e - acceptedError);
    expect(a).to.be.at.least(e + acceptedError);
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
  const a = bn(actual);
  const e = bn(expected);
  const minimumValue = e - pct(expected, error);

  expect(a).to.be.at.most(e);
  expect(a).to.be.at.least(minimumValue);
}

export function expectRelativeError(actual: Decimal, expected: Decimal, maxRelativeError: Decimal): void {
  const lessThanOrEqualTo = actual.dividedBy(expected).sub(1).abs().lessThanOrEqualTo(maxRelativeError);
  expect(lessThanOrEqualTo, 'Relative error too big').to.be.true;
}
