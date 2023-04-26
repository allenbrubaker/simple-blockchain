import { injectable } from 'inversify';

export interface IUtils {
  randomDelay(minMs: number, maxMs: number): Promise<void>;
  delay(ms: number): Promise<void>;
  random(minMs: number, maxMs: number);
  groupBy: <T, TKey extends string | number>(list: T[], getKey: (_: T, i: number) => TKey) => Record<TKey, T[]>;
}

@injectable()
export class Utils {
  async randomDelay(minMs: number, maxMs: number): Promise<void> {
    if (minMs > maxMs) {
      const t = minMs;
      minMs = maxMs;
      maxMs = t;
    }
    const delay = this.random(minMs, maxMs);
    return this.delay(delay);
  }

  async delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

  random(minMs: number, maxMs: number) {
    return Math.random() * (maxMs - minMs) + minMs;
  }

  groupBy = <T, TKey extends string | number>(list: T[], getKey: (_: T, i: number) => TKey): Record<TKey, T[]> =>
    list.reduce<Record<TKey, T[]>>((group, item, i) => {
      const key = getKey(item, i);
      (group[key] ||= []).push(item);
      return group;
    }, {} as any);
}
