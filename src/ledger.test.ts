import { Startup } from './startup';
import { Account, Callback, IncompleteLedgerError, Ledger, Symbols } from './types';
import { getMockLedger, mockAccount } from './fixtures';
import { ILedgerService } from './ledger';
import { IUtils } from './utils';
import { ILogger } from './logger';

describe('LedgerService', () => {
  let _ledger: ILedgerService;
  let _logger: ILogger;
  let _utils: IUtils;
  beforeEach(() => {
    const container = new Startup().register();
    _ledger = container.get<ILedgerService>(Symbols.ledger);
    _logger = container.get<ILogger>(Symbols.logger);
    _utils = container.get<IUtils>(Symbols.utils);
    jest.spyOn(console, 'log').mockImplementation();
  });

  it('should be defined', () => {
    expect(_ledger).toBeDefined();
  });

  describe('index()', () => {
    let _onIndexed: any, _onIgnored: any, _onCanceled: any, _onCallback;
    beforeEach(() => {
      _onIndexed = jest.spyOn(_logger, 'onIndexed').mockImplementation();
      _onIgnored = jest.spyOn(_logger, 'onIgnored').mockImplementation();
      _onCanceled = jest.spyOn(_logger, 'onCanceled').mockImplementation();
      _onCallback = jest.spyOn(_logger, 'onCallback').mockImplementation();
    });

    it('ignores accounts belonging to an older version', done => {
      const account = { ...mockAccount, version: (mockAccount.version??0) - 1 };
      const ledger = getMockLedger([account]);
      _ledger.index(ledger, account).subscribe(x => {
        expect(x).toEqual(null);
        expect(_onIgnored).toBeCalledTimes(1);
        expect(_onCanceled).toBeCalledTimes(0);
        expect(_onIndexed).toBeCalledTimes(0);
        expect(_onCallback).toBeCalledTimes(0);
        expect(ledger).toMatchObject({ [account.id]: <Callback>{ account } });
        done();
      });
    });

    it('is flagged completed when callbackTimeMs elapses', done => {
      const account = <Account>{ ...mockAccount, callbackTimeMs: 20 };
      const ledger = {};

      _ledger.index(ledger, account).subscribe(x => {
        expect(ledger).toMatchObject({ [account.id]: <Callback>{ account, completed: true } });
        expect(_onCallback).toBeCalledTimes(1);
        done();
      });

      expect(ledger).toMatchObject({ [account.id]: <Callback>{ account, completed: false } });
      expect(_onIgnored).toBeCalledTimes(0);
      expect(_onIndexed).toBeCalledTimes(1); // Indexed the new account.
      expect(_onCanceled).toBeCalledTimes(0);
    });

    it('cancels ongoing older account', async () => {
      const oldAccount = <Account>{ ...mockAccount, callbackTimeMs: 50, version: 1 };
      const account = <Account>{ ...mockAccount, callbackTimeMs: 20, version: 2 };
      const ledger: Ledger = {};

      _ledger.index(ledger, oldAccount);

      expect(_onIndexed).toBeCalledTimes(1); // Indexed the new account.
      const oldCallback = ledger[oldAccount.id];

      _ledger.index(ledger, account);

      expect(oldCallback.completed).toEqual(false);
      expect(oldCallback.subscription.closed).toEqual(true);
      expect(_onIgnored).toBeCalledTimes(0);
      expect(_onIndexed).toBeCalledTimes(2); // Indexed the new account.
      expect(_onCanceled).toBeCalledTimes(1); // Canceled the old one.
      expect(ledger).toMatchObject({ [account.id]: <Callback>{ account, completed: false } }); // New account is still running.

      await _utils.delay(oldAccount.callbackTimeMs * 2);
      expect(ledger).toMatchObject({ [account.id]: <Callback>{ account, completed: true } }); // New account completed.
      expect(oldCallback.completed).toEqual(false);
      expect(_onCallback).toBeCalledTimes(1);
    });

    it('does not cancel completed older accounts', async () => {
      const oldAccount = <Account>{ ...mockAccount, callbackTimeMs: 20, version: 1 };
      const account = <Account>{ ...mockAccount, callbackTimeMs: 20, version: 2 };
      const ledger: Ledger = {};

      _ledger.index(ledger, oldAccount);

      const oldCallback = ledger[oldAccount.id];
      await _utils.delay(50); // Give enough time for first one to complete.

      _ledger.index(ledger, account).subscribe(() => {
        expect(oldCallback.completed).toEqual(true);
        expect(oldCallback.subscription.closed).toEqual(true);
        expect(_onIgnored).toBeCalledTimes(0);
        expect(_onCanceled).toBeCalledTimes(0);
        expect(_onIndexed).toBeCalledTimes(2);
        expect(_onCallback).toBeCalledTimes(2);
        expect(ledger).toMatchObject({ [account.id]: <Callback>{ account, completed: true } }); // New account completed.
      });

      await _utils.delay(100);
    });
  });

  describe('shouldIndex()', () => {
    it('should return true if and only if the account version is greater than the current one', () => {
      const accounts: Account[] = [
        { ...mockAccount, version: 1 },
        { ...mockAccount, version: 2 },
        { ...mockAccount, version: 3 },
        { ...mockAccount, version: 4 }
      ];
      for (let i = 0; i < accounts.length - 1; ++i)
        for (let j = i + 1; j < accounts.length; ++j) {
          expect(_ledger.shouldIndex(getMockLedger([accounts[i]]), accounts[j])).toBeTruthy();
          expect(_ledger.shouldIndex(getMockLedger([accounts[j]]), accounts[i])).toBeFalsy();
        }
    });

    it('should return true if the ledger contains no matching account ID', () => {
      expect(_ledger.shouldIndex(getMockLedger([]), mockAccount)).toBeTruthy();
    });
  });

  it('topAccountsByType() should contain only unique account types matching accounts with the largest tokens', () => {
    const accounts: Account[] = [
      { ...mockAccount, accountType: 'c', tokens: 10 },
      { ...mockAccount, accountType: 'a', tokens: 500 },
      { ...mockAccount, accountType: 'b', tokens: 200 },
      { ...mockAccount, accountType: 'b', tokens: 100 },
      { ...mockAccount, accountType: 'a', tokens: 1000 }
    ];
    const deduped = _ledger.topAccountsByType(accounts);
    expect(deduped).toHaveLength(3);
    [0, 2, 4].forEach(topIndex => expect(deduped).toContain(accounts[topIndex]));
  });

  it('ensureComplete() throws an IncompleteLedgerError if any ledger entries are incomplete', () => {
    const accounts: Account[] = [
      { ...mockAccount, id: '1' },
      { ...mockAccount, id: '2' },
      { ...mockAccount, id: '3' },
      { ...mockAccount, id: '4' }
    ];
    const ledger = getMockLedger(accounts);
    Object.values(ledger).forEach(x => (x.completed = true));
    _ledger.ensureComplete(ledger);
    ledger[accounts[0].id].completed = false;
    expect(() => _ledger.ensureComplete(ledger)).toThrowError(new IncompleteLedgerError());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
