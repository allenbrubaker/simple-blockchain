import { Startup } from './startup';
import { Account, Symbols } from './types';
import { expectInput, mockAccount } from './fixtures';
import { ILogger } from './logger';

describe('Logger', () => {
  let _logger: ILogger;
  beforeEach(() => {
    const container = new Startup().register();
    _logger = container.get<ILogger>(Symbols.logger);
  });

  it('should be defined', () => {
    expect(_logger).toBeDefined();
  });

  it('should each log to console the account id, version, handler type, and timestamp', () => {
    const log = jest.spyOn(console, 'log').mockImplementation();
    const account = mockAccount;
    const ensure = (keyword: string) =>
      expectInput(log, 1, ([message]) => {
        expect(message).toContain(account.id);
        expect(message).toContain(String(account.version));
        expect(message).toContain(keyword);
        expect(message).toMatch(/\d+ms/);
        log.mockReset();
      });
    _logger.onCallback(account);
    ensure('fired');
    _logger.onIndexed(account);
    ensure('indexed');
    _logger.onCanceled(account, 100);
    ensure('canceled');
    _logger.onIgnored(account);
    ensure('ignored');
  });

  it('onComplete() should log account type, id, version, and tokens for each account supplied', () => {
    const log = jest.spyOn(console, 'log').mockImplementation();
    const accounts = [
      { ...mockAccount, id: 'xxx', type: 'type_1' },
      { ...mockAccount, id: 'yyy', type: 'type_2' },
      { ...mockAccount, id: 'zzz', type: 'type_3' }
    ];
    _logger.onComplete(accounts);
    const ensure = (account: Account, index: number) => {
      expectInput(
        log,
        accounts.length,
        ([message]) => {
          expect(message).toContain(account.id);
          expect(message).toContain(String(account.version));
          expect(message).toContain(account.accountType);
          expect(message).toContain(account.tokens.toString());
        },
        index
      );
    };
    accounts.forEach(ensure);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
