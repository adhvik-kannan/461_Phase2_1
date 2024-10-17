import { expect, test, vi } from 'vitest';
import { calculateCorrectnessScore } from '../src/correctness_calc';
import logger from '../src/logging.js';

// Mocking the logger module
vi.mock('../src/logging.js', () => ({
  debug: vi.fn(),
}));

test('calculateCorrectnessScore should return 1 when there are no issues', async () => {
    const repoUrl = 'https://github.com/axios/axios'; // NPM package GitHub repo
    const issues = [];
    const closedIssues = [];
    
    const score = await calculateCorrectnessScore(repoUrl, issues, closedIssues);
    
    expect(score).toBe(1);
    expect(logger.debug).toHaveBeenCalledWith('Total issues count is zero, returning score as 1.');
});

test('calculateCorrectnessScore should calculate score correctly when there are some closed issues', async () => {
    const repoUrl = 'https://github.com/axios/axios'; // NPM package GitHub repo
    const issues = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const closedIssues = [{ id: 1 }];
    
    const score = await calculateCorrectnessScore(repoUrl, issues, closedIssues);
    
    expect(score).toBe(1 / 3);
    expect(logger.debug).toHaveBeenCalledWith('total issues count:', issues.length);
    expect(logger.debug).toHaveBeenCalledWith('closed issues count:', closedIssues.length);
    expect(logger.debug).toHaveBeenCalledWith(`Calculated correctness score: ${score}`);
});

test('calculateCorrectnessScore should return 1 when all issues are closed', async () => {
    const repoUrl = 'https://github.com/axios/axios'; // NPM package GitHub repo
    const issues = [{ id: 1 }, { id: 2 }];
    const closedIssues = [{ id: 1 }, { id: 2 }];
    
    const score = await calculateCorrectnessScore(repoUrl, issues, closedIssues);
    
    expect(score).toBe(1);
    expect(logger.debug).toHaveBeenCalledWith('total issues count:', issues.length);
    expect(logger.debug).toHaveBeenCalledWith('closed issues count:', closedIssues.length);
    expect(logger.debug).toHaveBeenCalledWith(`Calculated correctness score: ${score}`);
});

test('calculateCorrectnessScore should return 0 when no issues are closed', async () => {
    const repoUrl = 'https://github.com/axios/axios'; // NPM package GitHub repo
    const issues = [{ id: 1 }, { id: 2 }];
    const closedIssues = [];
    
    const score = await calculateCorrectnessScore(repoUrl, issues, closedIssues);
    
    expect(score).toBe(0);
    expect(logger.debug).toHaveBeenCalledWith('total issues count:', issues.length);
    expect(logger.debug).toHaveBeenCalledWith('closed issues count:', closedIssues.length);
    expect(logger.debug).toHaveBeenCalledWith(`Calculated correctness score: ${score}`);
});
