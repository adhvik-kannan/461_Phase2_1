import { error } from 'console';
import { calculateRampUpScore } from '../src/rampUp';
import { expect, test } from 'vitest'
import exp from 'constants';


test('Ramp Up Test', async () => {
    const rampUpScore = await calculateRampUpScore('https://github.com/socketio/socket.io', 'test/testing_data/repos_to_test/socket.io');
    expect(rampUpScore).toBeGreaterThan(.2)
    expect(rampUpScore).toBeLessThan(.8)
});

test('Ramp Up Test', async () => {
    const rampUpScore = await calculateRampUpScore('https://github.com/prathameshnetake/libvlc', 'test/testing_data/repos_to_test/libvlc');
    expect(rampUpScore).toBeLessThan(.5);
})
