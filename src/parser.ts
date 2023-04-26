import { injectable } from 'inversify';
import { readFile } from 'fs/promises';
import { Observable, from, map } from 'rxjs';

export interface IParser {
  parse<T>(path: string): Observable<T>;
}

@injectable()
export class Parser implements IParser {
  parse<T>(path: string): Observable<T> {
    return from(readFile(path)).pipe(map(file => JSON.parse(file.toString()) as T));
  }
}
