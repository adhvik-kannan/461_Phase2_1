import { describe, it, expect, vi, beforeEach } from 'vitest';
import { metric_manager } from '../src/metric_manager.js';
import { isGithubTokenValid } from '../src/github_utils.js';
import { urlhandler } from '../src/urlhandler.js';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../src/logging.js';
import { output_formatter } from '../src/output_formatter.js';
import { cloneRepository } from '../src/github_utils.js';
import { fileURLToPath } from 'url';

vi.mock('fs');
vi.mock('../src/metric_manager.js');
vi.mock('../src/github_utils.js');
vi.mock('../src/urlhandler.js');
vi.mock('../src/logging.js');
vi.mock('../src/output_formatter.js');

// Mock os module for temp directories
vi.mock('os', async (importOriginal) => {
  const actualOs = await importOriginal();
  return {
    ...actualOs,
    tmpdir: vi.fn(() => '/tmp'),
    mkdtempSync: vi.fn(() => '/tmp/temp-repo-1234'),
  };
});

describe('Main Program Tests', () => {
  let readFileMock;

  beforeEach(() => {
    // Mock fs.readFile behavior
    readFileMock = vi.spyOn(fs, 'readFile').mockImplementation((filePath, encoding, callback) => {
      callback(null, 'https://github.com/repo1\nhttps://github.com/repo2');
    });

    // Mock isGithubTokenValid to return true initially
    isGithubTokenValid.mockResolvedValue(true);

    // Mock urlhandler and metric_manager behavior
    urlhandler.mockImplementation((url) => ({
      handle: vi.fn().mockResolvedValue('mockData'),
      url: url,
      contributors: Promise.resolve([]),
      issues: Promise.resolve([]),
      pullRequests: Promise.resolve([]),
      commits: Promise.resolve([]),
    }));

    cloneRepository.mockResolvedValue(undefined);
    metric_manager.mockImplementation(() => ({
      parallel_metric_and_net_score_calc: vi.fn().mockResolvedValue([1, 1, 1, 1, 1]),
      net_score_latency: 1000,
    }));
  });

  it('should read URLs from a file and process them correctly', async () => {
    process.argv = ['node', 'main_program.js', 'test_urls.txt'];

    await import('../src/main_program.js');

    expect(readFileMock).toHaveBeenCalledWith('test_urls.txt', 'utf8', expect.any(Function));
    expect(cloneRepository).toHaveBeenCalledTimes(1);
    expect(metric_manager).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalled();
    //expect(output_formatter).toHaveBeenCalled();
  });

  it('should exit if the GitHub token is invalid', async () => {
    isGithubTokenValid.mockResolvedValueOnce(false);

    // Mock process.exit to capture exit calls
    const exitMock = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
    });

    // Run the main program in a try-catch block
    try {
        await import('../src/main_program.js'); // This should trigger the exit
    } catch (error) {
        // Expect process.exit to have been called with status code 1
        expect(exitMock).toHaveBeenCalledWith(1);
    }

    // Restore the exit mock after the test
    exitMock.mockRestore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
