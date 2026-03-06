import { Decimal } from 'decimal.js';

import _BN from 'bn.js';

const SCALING_FACTOR = 1e18;

export type BigNumberish = string | number | bigint | Uint8Array | number[] | { toString(): string };
export type BigNumber = bigint;

export const BigNumber = {
  from: (x: BigNumberish | Decimal): bigint => bn(x),
  isBigNumber: (x: unknown): x is bigint => typeof x === 'bigint',
};

export const decimal = (x: BigNumberish | Decimal): Decimal => new Decimal(x.toString());

export const fp = (x: BigNumberish | Decimal): bigint => bn(toFp(x));

export const toFp = (x: BigNumberish | Decimal): Decimal => decimal(x).mul(SCALING_FACTOR);

export const fromFp = (x: BigNumberish | Decimal): Decimal => decimal(x).div(SCALING_FACTOR);

export const bn = (x: BigNumberish | Decimal): bigint => {
  if (typeof x === 'bigint') {
    return x;
  }

  if (x instanceof Uint8Array || Array.isArray(x)) {
    const hex = Buffer.from(x).toString('hex');
    return BigInt(hex.length > 0 ? `0x${hex}` : '0');
  }

  if (typeof x === 'object' && x !== null && 'toHexString' in x && typeof (x as { toHexString?: unknown }).toHexString === 'function') {
    const hexValue = (x as { toHexString: () => string }).toHexString();
    return BigInt(hexValue);
  }

  const stringified = parseScientific(x.toString());
  const integer = stringified.split('.')[0];
  return BigInt(integer);
};

export const negate = (x: BigNumberish): bigint => {
  return bn(new _BN(bn(x).toString()).notn(256).toString());
};

export const maxUint = (e: number): bigint => 2n ** BigInt(e) - 1n;

export const maxInt = (e: number): bigint => 2n ** (BigInt(e) - 1n) - 1n;

export const minInt = (e: number): bigint => -(2n ** (BigInt(e) - 1n));

export const pct = (x: BigNumberish, pct: BigNumberish): bigint => bn(decimal(x).mul(decimal(pct)));

export const max = (a: BigNumberish, b: BigNumberish): bigint => {
  const left = bn(a);
  const right = bn(b);

  return left > right ? left : right;
};

export const min = (a: BigNumberish, b: BigNumberish): bigint => {
  const left = bn(a);
  const right = bn(b);

  return left < right ? left : right;
};

export const bnSum = (bnArr: BigNumberish[]): bigint => {
  return bnArr.reduce<bigint>((prev, curr) => prev + bn(curr), 0n);
};

export const arrayAdd = (arrA: BigNumberish[], arrB: BigNumberish[]): bigint[] =>
  arrA.map((a, i) => bn(a) + bn(arrB[i]));

export const arrayFpMul = (arrA: BigNumberish[], arrB: BigNumberish[]): bigint[] => arrA.map((a, i) => fpMul(a, arrB[i]));

export const arraySub = (arrA: BigNumberish[], arrB: BigNumberish[]): bigint[] =>
  arrA.map((a, i) => bn(a) - bn(arrB[i]));

export const fpMul = (a: BigNumberish, b: BigNumberish): bigint => (bn(a) * bn(b)) / FP_SCALING_FACTOR;

export const fpDiv = (a: BigNumberish, b: BigNumberish): bigint => (bn(a) * FP_SCALING_FACTOR) / bn(b);

export const divCeil = (x: bigint, y: bigint): bigint =>
  // ceil(x/y) == (x + y - 1) / y
  (x + y - 1n) / y;

const FP_SCALING_FACTOR = bn(SCALING_FACTOR);
export const FP_ZERO = fp(0);
export const FP_ONE = fp(1);
export const FP_100_PCT = fp(1);

export function printGas(gas: number | bigint): string {
  const gasValue = typeof gas === 'number' ? gas : Number(gas);
  return `${(gasValue / 1000).toFixed(1)}k`;
}

export function scaleUp(n: bigint, scalingFactor: bigint): bigint {
  if (scalingFactor === 1n) {
    return n;
  }

  return n * scalingFactor;
}

export function scaleDown(n: bigint, scalingFactor: bigint): bigint {
  if (scalingFactor === 1n) {
    return n;
  }

  return n / scalingFactor;
}

function parseScientific(num: string): string {
  if (!/\d+\.?\d*e[+-]*\d+/i.test(num)) return num;

  const numberSign = Math.sign(Number(num));
  num = Math.abs(Number(num)).toString();

  const [coefficient, exponent] = num.toLowerCase().split('e');
  let zeros = Math.abs(Number(exponent));
  const exponentSign = Math.sign(Number(exponent));
  const [integer, decimals] = (coefficient.indexOf('.') != -1 ? coefficient : `${coefficient}.`).split('.');

  if (exponentSign === -1) {
    zeros -= integer.length;
    num =
      zeros < 0
        ? integer.slice(0, zeros) + '.' + integer.slice(zeros) + decimals
        : '0.' + '0'.repeat(zeros) + integer + decimals;
  } else {
    if (decimals) zeros -= decimals.length;
    num =
      zeros < 0
        ? integer + decimals.slice(0, zeros) + '.' + decimals.slice(zeros)
        : integer + decimals + '0'.repeat(zeros);
  }

  return numberSign < 0 ? '-' + num : num;
}

export function randomFromInterval(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

declare global {
  interface BigInt {
    add(value: BigNumberish): bigint;
    sub(value: BigNumberish): bigint;
    mul(value: BigNumberish): bigint;
    div(value: BigNumberish): bigint;
    mod(value: BigNumberish): bigint;
    pow(value: BigNumberish): bigint;
    eq(value: BigNumberish): boolean;
    gt(value: BigNumberish): boolean;
    gte(value: BigNumberish): boolean;
    lt(value: BigNumberish): boolean;
    lte(value: BigNumberish): boolean;
    toNumber(): number;
  }
}

const bigIntProto = BigInt.prototype as BigInt & Record<string, unknown>;

if (typeof bigIntProto.add !== 'function') {
  bigIntProto.add = function (this: bigint, value: BigNumberish): bigint {
    return this.valueOf() + bn(value);
  };

  bigIntProto.sub = function (this: bigint, value: BigNumberish): bigint {
    return this.valueOf() - bn(value);
  };

  bigIntProto.mul = function (this: bigint, value: BigNumberish): bigint {
    return this.valueOf() * bn(value);
  };

  bigIntProto.div = function (this: bigint, value: BigNumberish): bigint {
    return this.valueOf() / bn(value);
  };

  bigIntProto.mod = function (this: bigint, value: BigNumberish): bigint {
    return this.valueOf() % bn(value);
  };

  bigIntProto.pow = function (this: bigint, value: BigNumberish): bigint {
    return this.valueOf() ** bn(value);
  };

  bigIntProto.eq = function (this: bigint, value: BigNumberish): boolean {
    return this.valueOf() === bn(value);
  };

  bigIntProto.gt = function (this: bigint, value: BigNumberish): boolean {
    return this.valueOf() > bn(value);
  };

  bigIntProto.gte = function (this: bigint, value: BigNumberish): boolean {
    return this.valueOf() >= bn(value);
  };

  bigIntProto.lt = function (this: bigint, value: BigNumberish): boolean {
    return this.valueOf() < bn(value);
  };

  bigIntProto.lte = function (this: bigint, value: BigNumberish): boolean {
    return this.valueOf() <= bn(value);
  };

  bigIntProto.toNumber = function (this: bigint): number {
    return Number(this.valueOf());
  };
}
