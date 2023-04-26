import { Startup } from './startup';
import { Account, Callback, IncompleteLedgerError, Ledger, Symbols } from './types';
import { expectInput, getMockCallback, getMockLedger, mockAccount } from './fixtures';
import { ILedgerService } from './ledger';
import { IUtils } from './utils';
import { ILogger } from './logger';
import { IApp } from './app';
import { delay, lastValueFrom, of } from 'rxjs';
import { IParser } from './parser';

describe('App', () => {
  let _ledger: ILedgerService;
  let _logger: ILogger;
  let _utils: IUtils;
  let _app: IApp;
  let _parser: IParser;

  beforeEach(() => {
    const container = new Startup().register();
    _ledger = container.get<ILedgerService>(Symbols.ledger);
    _app = container.get<IApp>(Symbols.app);
    _logger = container.get<ILogger>(Symbols.logger);
    _utils = container.get<IUtils>(Symbols.utils);
    _parser = container.get<IParser>(Symbols.parser);
  });

  it('should be defined', () => {
    expect(_app).toBeDefined();
  });

  describe('run()', () => {
    it('injects a random starting delay between [0, 1000] to all incoming accounts', async () => {
      const wait = 100;
      const random = jest.spyOn(_utils, 'random').mockReturnValue(wait);
      const index = jest.spyOn(_ledger, 'index').mockReturnValue(of(mockAccount));
      jest.spyOn(_logger, 'onComplete').mockImplementation();
      const accounts = Array(10)
        .fill(0)
        .map(x => mockAccount);
      jest.spyOn(_parser, 'parse').mockReturnValue(of(accounts));

      const runPromise = lastValueFrom(_app.run());

      await _utils.delay(wait / 2);

      // random(0,1000) should be invoked n times for n accounts.
      expectInput(random, accounts.length, ([min, max]) => {
        expect(min).toEqual(0);
        expect(max).toEqual(1000);
      });
      // No indexing should happen until after the random delays.
      expect(index).toBeCalledTimes(0);

      await runPromise;
      expect(index).toBeCalledTimes(accounts.length);
    });

    it('indexes all accounts and logs summary on completion of all callbacks', async () => {
      jest.clearAllMocks();
      const callbackMs = 100;
      jest.spyOn(_utils, 'random').mockReturnValue(0);
      jest.spyOn(_logger, 'onComplete').mockImplementation();
      const accounts = Array(10)
        .fill(0)
        .map((_, i) => ({ ...mockAccount, id: i }));
      jest.spyOn(_parser, 'parse').mockReturnValue(of(accounts));
      const index = jest.spyOn(_ledger, 'index').mockReturnValue(of(mockAccount).pipe(delay(callbackMs)));
      const onComplete = jest.spyOn(_logger, 'onComplete').mockImplementation();

      const promise = lastValueFrom(_app.run());

      await _utils.delay(callbackMs / 2);

      expect(index).toBeCalledTimes(accounts.length);
      const ids = new Set(accounts.map(x => x.id));
      index.mock.calls.map(x => x[1].id).forEach(id => expect(ids).toContain(id));

      await _utils.delay(callbackMs / 2 - 10);
      expect(onComplete).toBeCalledTimes(0); // Ensure summary is not logged until after all callbacks execute.

      await promise;

      expect(onComplete).toBeCalledTimes(1); // Summary should be called once after all callbacks execute.
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
