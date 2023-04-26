import 'reflect-metadata'; // Prerequisite for inversify.
import * as dotenv from 'dotenv';

import { BindingScopeEnum, Container } from 'inversify';
import { App, IApp } from './app';
import { Account, Symbols } from './types';
import { IParser, Parser } from './parser';
import { Config, IConfig } from './config';
import { LedgerService, ILedgerService } from './ledger';
import { Logger, ILogger } from './logger';
import { lastValueFrom } from 'rxjs';
import { IUtils, Utils } from './utils';

export class Startup {
  register(): Container {
    // Mount environment variables that are exposed by IConfigService.
    dotenv.config();

    // Register services with dependency injection provider.
    const container = new Container({ defaultScope: BindingScopeEnum.Singleton });
    container.bind<IApp>(Symbols.app).to(App);
    container.bind<IConfig>(Symbols.config).to(Config);
    container.bind<IParser>(Symbols.parser).to(Parser);
    container.bind<ILedgerService>(Symbols.ledger).to(LedgerService);
    container.bind<ILogger>(Symbols.logger).to(Logger);
    container.bind<IUtils>(Symbols.utils).to(Utils);
    return container;
  }

  async start(container: Container): Promise<Account[]> {
    const app = container.get<IApp>(Symbols.app);
    const runner$ = app.run();
    return lastValueFrom(runner$); // Convert observable to a promise that waits until last value is emitted.
  }
}
