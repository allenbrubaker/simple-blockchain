import { inject, injectable } from 'inversify';
import { Account, Ledger, Symbols } from './types';
import { IConfig } from './config';
import { IParser } from './parser';
import { IUtils } from './utils';
import { Observable, delay, map, mergeMap, of, tap, toArray } from 'rxjs';
import { ILedgerService } from './ledger';
import { ILogger } from './logger';

export interface IApp {
  run(): Observable<Account[]>;
}

@injectable()
export class App implements IApp {
  constructor(
    @inject(Symbols.config) private _config: IConfig,
    @inject(Symbols.parser) private _parser: IParser,
    @inject(Symbols.utils) private _utils: IUtils,
    @inject(Symbols.ledger) private _ledger: ILedgerService,
    @inject(Symbols.logger) private _logger: ILogger
  ) {}

  run(): Observable<Account[]> {
    const accounts$ = this._parser.parse<Account[]>(this._config.inputPath);
    const ledger = {} as Ledger;

    return accounts$.pipe(
      mergeMap(x => x), // Flatten a single observable of an array to many observables.
      mergeMap(account => {
        const ms = Math.round(this._utils.random(0, 1000));
        return of({ ...account, startTimeMs: ms }).pipe(delay(ms)); // Inject a random delay into each observable.
      }),
      mergeMap(account => this._ledger.index(ledger, account)),
      toArray(), // Wait until all observables complete, then aggregate results.
      map(x => {
        this._ledger.ensureComplete(ledger); // sanity check
        return this._ledger.accounts(ledger);
      }),
      tap(accounts => {
        this._logger.onComplete(this._ledger.topAccountsByType(accounts));
      })
    );
  }
}
