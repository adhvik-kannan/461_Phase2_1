import { error } from 'console';
import { urlhandler } from '../src/urlhandler.js'
import { expect, test } from 'vitest'




test('Test for urlhandler with bad URL', async () => {
    const url_bad = new urlhandler('badlink');
    expect(() => url_bad.identify('badlink').tobe('Not found'));
    
});

test('Test for urlhandler with github URL', async () => {
    const url_good = new urlhandler('https://github.com/lodash/lodash');
    expect(url_good.identify('https://github.com/lodash/lodash')).toBe("GitHub");
});

test('Test for urlhandler with npm URL', async () => {
    const url_good = new urlhandler('https://www.npmjs.com/package/lodash');
    expect(url_good.identify('https://www.npmjs.com/package/lodash')).toBe("NPM");
});



test('Get data from npm URL', async () => {
    const mockData = { name: 'lodash' };
    urlhandler.mockImplementation(() => {
        return {
            handle: vi.fn().mockResolvedValue(mockData),
        };
    });

    const url_good = new urlhandler('https://www.npmjs.com/package/lodash');
    const data = await url_good.handle();
    expect(data).toHaveProperty('name', 'lodash');
});

test('Get data from GitHub URL', async () => {
    const mockData = { name: 'lodash' };
    urlhandler.mockImplementation(() => {
        return {
            handle: vi.fn().mockResolvedValue(mockData),
        };
    });

    const url_good = new urlhandler('https://github.com/lodash/lodash');
    const data = await url_good.handle();
    expect(data.name).toBe('lodash');
});




