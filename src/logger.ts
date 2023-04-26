import { injectable } from 'inversify';
import { Account, LogCanceledHandler, LogHandler } from './types';

export interface ILogger {
  onCallback: LogHandler;
  onIndexed: LogHandler;
  onIgnored: LogHandler;
  onCanceled: LogCanceledHandler;
  onComplete(accounts: Account[]);
}

@injectable()
export class Logger implements ILogger {
  onCallback: LogHandler = account => {
    const time = (account.startTimeMs ?? 0) + account.callbackTimeMs;
    console.log(`${this.formatTime(time)}ms: ${this.accountName(account)}: callback fired: ${JSON.stringify(account.data)}`);
  };

  onIndexed: LogHandler = account => {
    console.log(`${this.formatTime(account.startTimeMs)}ms: ${this.accountName(account)}: indexed`);
  };

  onCanceled: LogCanceledHandler = (account, time) => {
    console.log(`${this.formatTime(time)}ms: ${this.accountName(account)}: callback canceled`);
  };

  onIgnored: LogHandler = account => {
    console.log(`${this.formatTime(account.startTimeMs)}ms: ${this.accountName(account)}: ignored`);
  };

  onComplete(accounts: Account[]) {
    console.info('\n=== Summary ===\n');
    accounts.forEach(account =>
      console.log(`${account.accountType.padStart(15)}:  ${this.accountName(account)}:\t ${account.tokens} tokens`)
    );
  }

  private accountName(account: Account) {
    return `${account.id} ${('v' + (account.version??'?')).padStart(3)}`;
  }

  private formatTime(ms: number) {
    return ms.toString().padStart(4);
  }
}
