import { inject, injectable } from 'inversify';
import { Symbols } from './types';

export interface IConfig {
  get inputPath(): string;
}

@injectable()
export class Config implements IConfig {
  get inputPath(): string {
    return process.env.INPUT_PATH;
  }
}
