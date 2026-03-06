import { AsyncFunc } from 'mocha';
import chai, { expect } from 'chai';

import { NAry } from './models/types/types';
import { ZERO_ADDRESS } from './constants';
import { BigNumber, BigNumberish, bn, fp } from './numbers';
import { expectEqualWithError, expectLessThanOrEqualWithError } from './relativeError';

import { sharedBeforeEach } from './sharedBeforeEach';

/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Chai {
    interface Assertion {
      zero: void;
      zeros: void;
      zeroAddress: void;
      equalFp(value: BigNumberish): void;
      lteWithError(value: NAry<BigNumberish>, error?: BigNumberish): void;
      equalWithError(value: NAry<BigNumberish>, error?: BigNumberish): void;
      almostEqual(value: NAry<BigNumberish>, error?: BigNumberish): void;
      almostEqualFp(value: NAry<BigNumberish>, error?: BigNumberish): void;
      reverted: Promise<void>;
      revertedWith(message: string): Promise<void>;
    }
  }

  function sharedBeforeEach(fn: AsyncFunc): void;
  function sharedBeforeEach(name: string, fn: AsyncFunc): void;
}

global.sharedBeforeEach = (nameOrFn: string | AsyncFunc, maybeFn?: AsyncFunc): void => {
  sharedBeforeEach(nameOrFn, maybeFn);
};

chai.use(function (chai, utils) {
  const { Assertion } = chai;

  Assertion.addProperty('zero', function () {
    new Assertion(this._obj).to.be.equal(bn(0));
  });

  Assertion.addProperty('zeros', function () {
    const obj = this._obj;
    const expectedValue = Array(obj.length).fill(bn(0));
    new Assertion(obj).to.be.deep.equal(expectedValue);
  });

  Assertion.addProperty('zeroAddress', function () {
    new Assertion(this._obj).to.be.equal(ZERO_ADDRESS);
  });

  Assertion.addMethod('equalFp', function (expectedValue: BigNumberish) {
    expect(this._obj).to.be.equal(fp(expectedValue));
  });

  Assertion.addMethod('equalWithError', function (expectedValue: NAry<BigNumberish>, error?: BigNumberish) {
    if (Array.isArray(expectedValue)) {
      const actual: BigNumberish[] = this._obj;
      actual.forEach((actual, i) => expectEqualWithError(actual, expectedValue[i], error));
    } else {
      expectEqualWithError(this._obj, expectedValue, error);
    }
  });

  Assertion.addMethod('lteWithError', function (expectedValue: NAry<BigNumberish>, error?: BigNumberish) {
    if (Array.isArray(expectedValue)) {
      const actual: BigNumberish[] = this._obj;
      actual.forEach((actual, i) => expectLessThanOrEqualWithError(actual, expectedValue[i], error));
    } else {
      expectLessThanOrEqualWithError(this._obj, expectedValue, error);
    }
  });

  Assertion.addMethod('almostEqual', function (expectedValue: NAry<BigNumberish>, error?: BigNumberish) {
    if (Array.isArray(expectedValue)) {
      const actuals: BigNumberish[] = this._obj;
      actuals.forEach((actual, i) => expectEqualWithError(actual, expectedValue[i], error));
    } else {
      expectEqualWithError(this._obj, expectedValue, error);
    }
  });

  Assertion.addMethod('almostEqualFp', function (expectedValue: NAry<BigNumberish>, error?: BigNumberish) {
    if (Array.isArray(expectedValue)) {
      const actuals: BigNumberish[] = this._obj;
      actuals.forEach((actual, i) => expectEqualWithError(actual, fp(expectedValue[i]), error));
    } else {
      expectEqualWithError(this._obj, fp(expectedValue), error);
    }
  });

  Assertion.addProperty('reverted', function () {
    const promise = this._obj as Promise<unknown>;

    return promise.then(
      () => {
        this.assert(
          false,
          'Expected transaction to be reverted',
          'Expected transaction not to be reverted',
          undefined,
          undefined
        );
      },
      (error: unknown) => {
        this.assert(
          true,
          `Expected transaction not to be reverted but it reverted with ${(error as Error)?.message ?? String(error)}`,
          'Expected transaction to be reverted',
          undefined,
          undefined
        );
      }
    );
  });

  Assertion.addMethod('revertedWith', function (expectedMessage: string) {
    const promise = this._obj as Promise<unknown>;

    return promise.then(
      () => {
        this.assert(false, `Expected transaction to be reverted with '${expectedMessage}'`, '', undefined, undefined);
      },
      (error: unknown) => {
        const actualMessage = (error as Error)?.message ?? String(error);
        const contains = actualMessage.includes(expectedMessage);
        this.assert(
          contains,
          `Expected revert message to include '${expectedMessage}', got '${actualMessage}'`,
          `Expected revert message not to include '${expectedMessage}'`,
          expectedMessage,
          actualMessage
        );
      }
    );
  });

  ['eq', 'equal', 'equals'].forEach((fn: string) => {
    Assertion.overwriteMethod(fn, function (_super) {
      return function (this: any, expected: any) {
        const actual = utils.flag(this, 'object');
        if (!utils.flag(this, 'deep') && (BigNumber.isBigNumber(actual) || BigNumber.isBigNumber(expected))) {
          const equal = BigNumber.from(actual).eq(expected);
          this.assert(
            equal,
            `Expected "${expected}" to equal ${actual}`,
            `Expected "${expected}" NOT to equal ${actual}`,
            expected,
            actual
          );
          return;
        }

        if (
          utils.flag(this, 'deep') &&
          Array.isArray(actual) &&
          Array.isArray(expected) &&
          actual.length === expected.length &&
          (actual.some(BigNumber.isBigNumber) || expected.some(BigNumber.isBigNumber))
        ) {
          const equal = actual.every((value: any, i: number) => BigNumber.from(value).eq(expected[i]));
          this.assert(
            equal,
            `Expected "[${expected}]" to be deeply equal [${actual}]`,
            `Expected "[${expected}]" NOT to be deeply equal [${actual}]`,
            expected,
            actual
          );
        } else {
          // eslint-disable-next-line prefer-rest-params
          _super.apply(this, arguments);
        }
      };
    });
  });

  type Comparator = (actual: BigNumberish, expected: BigNumberish) => boolean;
  const comparisonMethods: Array<{ names: string[]; comparator: Comparator; description: string }> = [
    {
      names: ['gt', 'above', 'greaterThan'],
      comparator: (actual, expected) => bn(actual) > bn(expected),
      description: 'greater than',
    },
    {
      names: ['gte', 'least'],
      comparator: (actual, expected) => bn(actual) >= bn(expected),
      description: 'greater than or equal to',
    },
    {
      names: ['lt', 'below', 'lessThan'],
      comparator: (actual, expected) => bn(actual) < bn(expected),
      description: 'less than',
    },
    {
      names: ['lte', 'most'],
      comparator: (actual, expected) => bn(actual) <= bn(expected),
      description: 'less than or equal to',
    },
  ];

  for (const { names, comparator, description } of comparisonMethods) {
    names.forEach((fn: string) => {
      Assertion.overwriteMethod(fn, function (_super) {
        return function (this: any, expected: any) {
          const actual = utils.flag(this, 'object');
          if (!utils.flag(this, 'deep') && (BigNumber.isBigNumber(actual) || BigNumber.isBigNumber(expected))) {
            const ok = comparator(actual, expected);
            this.assert(
              ok,
              `Expected "${actual}" to be ${description} ${expected}`,
              `Expected "${actual}" not to be ${description} ${expected}`,
              expected,
              actual
            );
            return;
          }

          // eslint-disable-next-line prefer-rest-params
          _super.apply(this, arguments);
        };
      });
    });
  }
});
