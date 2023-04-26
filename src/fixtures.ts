import { of } from 'rxjs';
import { Account, Callback, Ledger } from './types';

export const expectInput = <T, Y extends any[]>(
  mock: jest.MockInstance<T, Y>,
  invocationCount: number,
  validator: (params: Y) => void,
  callIndex?: number
) => {
  expect(mock).toHaveBeenCalledTimes(invocationCount);
  const call = callIndex === undefined ? mock.mock.lastCall : mock.mock.calls[callIndex];
  validator(call);
};

export const mockAccount: Account = {
  accountType: 'type',
  callbackTimeMs: 10,
  startTimeMs: 0,
  data: {},
  id: 'id',
  tokens: 1,
  version: 1
};

export const getMockCallback = (account: Account) => ({
  account,
  callback$: of(),
  completed: false,
  subscription: { unsubscribe: () => {} } as any
});

export const getMockLedger = (accounts: Account[]): Ledger =>
  accounts.reduce<Ledger>((ledger, account) => {
    ledger[account.id] = getMockCallback(account);
    return ledger;
  }, {});
