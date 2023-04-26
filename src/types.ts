import { Observable, Subscription } from 'rxjs';

export type Account = {
  id: Key;
  accountType: string;
  tokens: number;
  startTimeMs?: number;
  callbackTimeMs: number;
  data: Record<string, unknown>;
  version?: number;
};

export type Key = string;

export type Callback = {
  account: Account;
  subscription: Subscription;
  completed: boolean;
  callback$: Observable<Account>;
};

export type Ledger = Record<Key, Callback>;

export type LogHandler = (account: Account) => void;
export type LogCanceledHandler = (account: Account, time: number) => void;

export const Symbols = {
  app: Symbol.for('App'),
  config: Symbol.for('Config'),
  parser: Symbol.for('Parser'),
  utils: Symbol.for('Utils'),
  ledger: Symbol.for('Ledger'),
  logger: Symbol.for('Logger')
};

export class IncompleteLedgerError extends Error {
  constructor() {
    super('Callbacks are still running.');
  }
}
