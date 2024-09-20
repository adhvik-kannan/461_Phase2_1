import {temp_license} from '../src/template_for_license.js'
import { expect, test } from 'vitest'
// import {describe, expect, test} from '@jest/globals'

test('Test for license', async () => {
    expect(await temp_license('https://github.com/ryanve/unlicensed')).toBe(false);
});

test('Test for license', async () => {
    expect(await temp_license('https://github.com/lodash/lodash')).toBe(true);
});

test('Test for license', async () => {
    expect(await temp_license('invalid url')).toBe(false);
}   );  



        



