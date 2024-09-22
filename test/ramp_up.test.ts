import { error } from 'console';
import { calculateRampUpScore } from '../src/rampUp';
import { expect, test } from 'vitest'
import exp from 'constants';
import { describe } from 'vitest';

describe('Ramp Up Tests', () => {
    test('Ramp Up Test for socket.io', async () => {
        const rampUpScore: number = await calculateRampUpScore('https://github.com/socketio/socket.io', 'test/testing_data/repos_to_test/socket.io');
        expect(rampUpScore).toBeGreaterThan(0.2);
        expect(rampUpScore).toBeLessThan(0.8);
    });

    test('Ramp Up Test for libvlc', async () => {
        const rampUpScore: number = await calculateRampUpScore('https://github.com/prathameshnetake/libvlc', 'test/testing_data/repos_to_test/libvlc');
        expect(rampUpScore).toBeLessThan(0.5);
    });
});