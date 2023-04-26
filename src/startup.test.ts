import { of } from 'rxjs';
import { IApp } from './app';
import { Startup } from './startup';
import { Account, Symbols } from './types';
import { mockAccount } from './fixtures';

describe('Startup', () => {
  it('register() should register all service interfaces with their implementation', () => {
    const container = new Startup().register();
    Object.values(Symbols).forEach(symbol => {
      expect(container.get(symbol)).toMatchObject({});
    });
  });

  it('start() should run the application and return the last emitted value from the observable.', async () => {
    const container = new Startup().register();
    const app = container.get<IApp>(Symbols.app);
    const accounts: Account[] = [mockAccount];
    jest.spyOn(app, 'run').mockReturnValue(of(accounts));
    const result = await new Startup().start(container);
    expect(result).toMatchObject(accounts);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
