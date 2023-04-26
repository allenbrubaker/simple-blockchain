import { Startup } from './startup';
import { Symbols } from './types';
import { IParser } from './parser';
import { lastValueFrom, of } from 'rxjs';
import * as fs from 'fs/promises';

jest.mock('fs/promises', () => ({ __esModule: true, ...jest.requireActual('fs/promises') }));

describe('Parser', () => {
  let _parser: IParser;
  beforeEach(() => {
    const container = new Startup().register();
    _parser = container.get<IParser>(Symbols.parser);
  });

  it('should be defined', () => {
    expect(_parser).toBeDefined();
  });

  it('parse() should correctly deserialize a JSON document', async () => {
    const file = '[{ "key": "value" }, { "key": "value2" }]';
    jest.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from(file));

    const result = await lastValueFrom(_parser.parse('./file'));
    expect(result).toMatchObject([{ key: 'value' }, { key: 'value2' }]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
