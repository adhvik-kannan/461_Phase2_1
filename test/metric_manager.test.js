// metric_manager.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { metric_manager } from '../src/metric_manager.js';
import { temp_bus_factor_calc } from '../src/new_bus_factor_calc.js';
import { maintainer_net } from '../src/maintainer_calculator.js';
import { temp_license } from '../src/template_for_license.js';
import { calculateRampUpScore } from '../src/rampUp.js';

vi.mock('./new_bus_factor_calc');
vi.mock('./maintainer_calculator');
vi.mock('./template_for_license');
vi.mock('./rampUp.js');

describe('metric_manager', () => {
    let manager;

    const mockData = {
        contributors: [],
        issues: [],
        pullRequests: [],
        commits: [],
        url: 'https://github.com/example/repo',
        tempDir: '/tmp/example-dir'
    };

    beforeEach(() => {
        manager = new metric_manager(
            mockData.data,
            mockData.contributors,
            mockData.issues,
            mockData.pullRequests,
            mockData.commits,
            mockData.url,
            mockData.tempDir
        );

        // Mock implementations
        temp_bus_factor_calc.mockReturnValue(1);
        maintainer_net.mockReturnValue(1);
        temp_license.mockResolvedValue(true);
        calculateRampUpScore.mockResolvedValue(1);
    });

    it('should calculate bus factor', () => {
        const busFactor = manager.bus_factor_calc();
        expect(busFactor).toBe(1);
    });

    it('should calculate correctness score', () => {
        const correctness = manager.correctness_calc();
        expect(correctness).toBe(1);
    });

    it('should calculate ramp-up metric', async () => {
        const rampUpScore = await manager.calculateRampUpMetric();
        expect(rampUpScore).toBe(1);
    });

    it('should calculate maintainer score', () => {
        const maintainerScore = manager.maintainer_calc();
        expect(maintainerScore).toBe(1);
    });

    it('should verify license', async () => {
        const licenseScore = await manager.licence_verify();
        expect(licenseScore).toBe(1);
    });

    it('should calculate metrics in parallel and net score', async () => {
        const metrics = await manager.parallel_metric_and_net_score_calc();
        expect(metrics).toEqual([1, 1, 1, 1]); // Adjust according to actual implementation
        expect(manager.net_score).toBeCloseTo(0.3 * 1 + 0.3 * 1 + 0.2 * 1 + 0.2 * 1, 5);
    });
});
