import { Startup } from './startup';
import { Symbols } from './types';
import { IUtils } from './utils';
import { expectInput } from './fixtures';

describe('Utils', () => {
  let _utils: IUtils;
  beforeEach(() => {
    const container = new Startup().register();
    _utils = container.get<IUtils>(Symbols.utils);
  });

  it('should be defined', () => {
    expect(_utils).toBeDefined();
  });

  it('randomDelay() should delay for a random value between [minMs, maxMs] inclusive', async () => {
    const delay = jest.spyOn(_utils, 'delay').mockImplementation();
    const min = 200;

    await _utils.randomDelay(min, min);
    expectInput(delay, 1, ([ms]) => {
      expect(ms).toEqual(min);
    });

    delay.mockReset();
    await _utils.randomDelay(min, min + 1);
    expectInput(delay, 1, ([ms]) => {
      expect(ms).toBeDefined();
      expect(ms).toBeGreaterThanOrEqual(min);
      expect(ms).toBeLessThanOrEqual(min + 1);
    });
  });

  it('groupBy() should partition an array by the given key selector', () => {
    const list = [
      { name: 'a', value: 1 },
      { name: 'a', value: 2 },
      { name: 'b', value: 3 },
      { name: 'c', value: 4 }
    ];
    const group = _utils.groupBy(list, x => x.name);
    expect(group).toMatchObject({ a: [list[0], list[1]], b: [list[2]], c: [list[3]] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
