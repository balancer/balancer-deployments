import { expect } from 'chai';
import { Interface, LogDescription } from 'ethers';
import { BigNumber } from './numbers';

type ContractReceipt = {
  events?: Array<{ event?: string; args?: unknown }>;
  logs?: Array<Record<string, unknown>>;
};

// Ported from @openzeppelin/test-helpers to use with Ethers. The Test Helpers don't
// yet have Typescript typings, so we're being lax about them here.
// See https://github.com/OpenZeppelin/openzeppelin-test-helpers/issues/122

/* eslint-disable @typescript-eslint/no-explicit-any */

export function inReceipt(receipt: ContractReceipt, eventName: string, eventArgs = {}): any {
  const events = getEvents(receipt).filter((e) => e.event === eventName);
  expect(events.length > 0).to.equal(true, `No '${eventName}' events found`);

  const exceptions: Array<string> = [];
  const event = events.find(function (e) {
    for (const [i, [k, v]] of Object.entries(eventArgs).entries()) {
      try {
        if (e.args == undefined) {
          throw new Error('Event has no arguments');
        }

        contains(e.args, k, v, i);
      } catch (error) {
        exceptions.push(String(error));
        return false;
      }
    }
    return true;
  });

  if (event === undefined) {
    // Each event entry may have failed to match for different reasons,
    // throw the first one
    throw exceptions[0];
  }

  return event;
}

/**
 * Throws error if the given receipt does not contain a set of events with specific arguments.
 * Expecting a specific amount of events from a particular address is optional.
 * @param receipt Receipt to analyze.
 * @param emitter Interface of the contract emitting the event(s).
 * @param eventName Name of the event(s).
 * @param eventArgs Arguments of the event(s). This does not need to be a complete list; as long as the event contains
 *  the specified ones, the function will not throw.
 * @param address Contract address that emits the event(s). If undefined, the logs will not be filtered by address.
 * @param amount Number of expected events that match all the specified conditions. If not specified, at least one is
 *  expected.
 * @returns First matching event if the amount is not specified; all matching events otherwise.
 */
export function inIndirectReceipt(
  receipt: ContractReceipt,
  emitter: Interface,
  eventName: string,
  eventArgs = {},
  address?: string,
  amount?: number
): any {
  const expectedEvents = arrayFromIndirectReceipt(receipt, emitter, eventName, address);
  if (amount === undefined) {
    expect(expectedEvents.length > 0).to.equal(true, `No '${eventName}' events found`);
  } else {
    expect(expectedEvents.length).to.equal(
      amount,
      `${expectedEvents.length} '${eventName}' events found; expected ${amount}`
    );
  }

  const exceptions: Array<string> = [];
  const filteredEvents = expectedEvents.filter(function (e) {
    const normalizedArgs = normalizeArgs(
      e.args as unknown,
      (e as unknown as { fragment?: { inputs?: Array<{ name?: string }> } }).fragment?.inputs
    );

    for (const [i, [k, v]] of Object.entries(eventArgs).entries()) {
      try {
        if (normalizedArgs == undefined) {
          throw new Error('Event has no arguments');
        }

        contains(normalizedArgs, k, v, i);
      } catch (error) {
        exceptions.push(String(error));
        return false;
      }
    }
    return true;
  });

  // Each event entry may have failed to match for different reasons; in case of failure we throw the first one.
  if (amount === undefined) {
    // If amount is undefined, we don't care about the number of events. If no events were found, we throw.
    if (filteredEvents.length === 0) {
      throw exceptions[0];
    }
    return filteredEvents[0]; // In this case we just return the first appearance. This is backwards compatible.
  } else {
    // If amount was defined, we want the filtered events length to match the events length. If it doesn't, we throw.
    if (filteredEvents.length !== expectedEvents.length) {
      throw exceptions[0];
    }
    return filteredEvents; // In this case we care about all of the events, so we return them all.
  }
}

export function notEmitted(receipt: ContractReceipt, eventName: string): void {
  const events = getEvents(receipt).filter((e) => e.event === eventName);
  expect(events.length > 0).to.equal(false, `'${eventName}' event found`);
}

function getEvents(receipt: ContractReceipt): Array<{ event?: string; args?: { [key: string]: any | undefined } }> {
  const eventsFromLogs = (receipt.logs ?? [])
    .map((log) => {
      const event =
        (log.event as string | undefined) ??
        (log.eventName as string | undefined) ??
        ((log as { fragment?: { name?: string } }).fragment?.name as string | undefined);
      const args = normalizeArgs(
        log.args as unknown,
        (log as { fragment?: { inputs?: Array<{ name?: string }> } }).fragment?.inputs
      );

      if (event === undefined) {
        return undefined;
      }

      return { event, args };
    })
    .filter((event) => event !== undefined) as Array<{ event?: string; args?: { [key: string]: any | undefined } }>;

  if (eventsFromLogs.length > 0) {
    return eventsFromLogs;
  }

  if (receipt.events !== undefined) {
    return receipt.events.map((event) => ({ event: event.event, args: normalizeArgs(event.args as unknown) }));
  }

  return [];
}

function arrayFromIndirectReceipt(
  receipt: ContractReceipt,
  emitter: Interface,
  eventName: string,
  address?: string
): any[] {
  const decodedEvents = (receipt.logs ?? [])
    .filter((log) => {
      if (!address) {
        return true;
      }

      const logAddress = (log.address as string | undefined)?.toLowerCase();
      return logAddress === address.toLowerCase();
    })
    .map((log) => {
      try {
        return emitter.parseLog(log as unknown as { topics: readonly string[]; data: string });
      } catch {
        return undefined;
      }
    })
    .filter((e): e is LogDescription => e !== undefined && e !== null);

  return decodedEvents.filter((event) => event.name === eventName);
}

function contains(args: { [key: string]: any | undefined }, key: string, value: any, position: number) {
  const argsWithIndexes = args as { [key: string]: any | undefined } & Array<any>;
  const actualKey =
    key in args
      ? key
      : key.startsWith('_') && key.slice(1) in args
        ? key.slice(1)
        : `_${key}` in args
          ? `_${key}`
          : undefined;
  const hasIndex = position in argsWithIndexes;
  const actualValue = actualKey !== undefined ? args[actualKey] : hasIndex ? argsWithIndexes[position] : undefined;

  expect(actualKey !== undefined || hasIndex).to.equal(true, `Event argument '${key}' not found`);

  if (actualKey === undefined && !hasIndex) {
    return;
  }

  if (value === null) {
    expect(actualValue).to.equal(null, `expected event argument '${key}' to be null but got ${actualValue}`);
  } else if (BigNumber.isBigNumber(actualValue) || BigNumber.isBigNumber(value)) {
    const actual = BigNumber.isBigNumber(actualValue) ? actualValue.toString() : actualValue;
    const expected = BigNumber.isBigNumber(value) ? value.toString() : value;

    expect(actualValue).to.equal(
      value,
      `expected event argument '${key}' to have value ${expected} but got ${actual}`
    );
  } else {
    expect(actualValue).to.be.deep.equal(
      value,
      `expected event argument '${key}' to have value ${value} but got ${actualValue}`
    );
  }
}

function normalizeArgs(
  rawArgs: unknown,
  inputs?: Array<{ name?: string }>
): { [key: string]: any | undefined } | undefined {
  if (rawArgs === undefined || rawArgs === null) {
    return undefined;
  }

  const args = rawArgs as Array<any> & { [key: string]: any | undefined };
  const normalized: { [key: string]: any | undefined } = {};

  if (Array.isArray(args)) {
    for (let i = 0; i < args.length; i++) {
      normalized[i.toString()] = args[i];
    }
  }

  for (const key of Object.getOwnPropertyNames(args)) {
    if (key === 'length') {
      continue;
    }

    normalized[key] = (args as Record<string, any | undefined>)[key];
  }

  if (inputs !== undefined && Array.isArray(args)) {
    inputs.forEach((input, index) => {
      const name = input.name?.trim();
      if (!name) {
        return;
      }

      normalized[name] = args[index];

      if (name.startsWith('_')) {
        normalized[name.slice(1)] = args[index];
      } else {
        normalized[`_${name}`] = args[index];
      }
    });
  }

  return normalized;
}
