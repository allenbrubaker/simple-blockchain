import { inject, injectable } from 'inversify';
import { Account, Callback, LogCanceledHandler, LogHandler, IncompleteLedgerError, Ledger, Symbols } from './types';
import { Observable, delay, of } from 'rxjs';
import { IUtils } from './utils';
import { ILogger } from './logger';

export interface ILedgerService {
  index(ledger: Ledger, account: Account): Observable<Account>;
  shouldIndex(ledger: Ledger, account: Account): boolean;
  topAccountsByType(latestAccounts: Account[]): Account[];
  ensureComplete(ledger: Ledger): void;
  accounts(ledger: Ledger): Account[];
}

@injectable()
export class LedgerService implements ILedgerService {
  constructor(@inject(Symbols.utils) private _utils: IUtils, @inject(Symbols.logger) private _logger: ILogger) {}

  index(ledger: Ledger, account: Account): Observable<Account> {
    if (this.shouldIndex(ledger, account)) {
      this._logger.onIndexed(account);
      let callback = ledger[account.id];
      if (callback && !callback.completed) {
        callback.subscription.unsubscribe(); // Cancel existing subscription.
        this._logger.onCanceled(callback.account, account.startTimeMs);
      }
      callback = this.run(account);
      ledger[account.id] = callback;
      return callback.callback$; // Return the observable to facilitate downstream delaying until all callbacks are completed.
    }

    this._logger.onIgnored(account);
    return of(null);
  }

  shouldIndex(ledger: Ledger, account: Account): boolean {
    const cur = ledger[account.id];
    return !cur || (cur.account.version ?? -1) < (account.version ?? -1);
  }

  topAccountsByType(latestAccounts: Account[]): Account[] {
    const accountsByType = this._utils.groupBy(latestAccounts, account => account.accountType);
    return Object.values(accountsByType)
      .map(group => group.reduce((max, account) => (account.tokens > max.tokens ? account : max), group[0]))
      .sort((x, y) => x.accountType.localeCompare(y.accountType));
  }

  ensureComplete(ledger: Ledger): void {
    if (!Object.values(ledger).every(x => x.completed)) throw new IncompleteLedgerError();
  }

  accounts(ledger: Ledger): Account[] {
    return Object.values(ledger).map(x => x.account);
  }

  // Generates a new callback observable for the supplied account to track callback progress.
  private run(account: Account): Callback {
    const $ = of(account).pipe(delay(account.callbackTimeMs)); // Delay by callback milliseconds before emitting account.
    const callback: Callback = { account, callback$: $, completed: false, subscription: undefined };
    callback.subscription = $.subscribe(account => {
      this._logger.onCallback(account);
      callback.completed = true;
    });
    return callback;
  }
}
