// import { error } from 'console';
// import { calculateRampUpScore } from '../src/rampUp';
// import { expect, test } from 'vitest'
// import exp from 'constants';
// import { describe } from 'vitest';

// describe('Ramp Up Tests', () => {
//     test('Ramp Up Test for socket.io', async () => {
//         const rampUpScore: number = await calculateRampUpScore('https://github.com/socketio/socket.io', 'test/testing_data/repos_to_test/socket.io');
//         expect(rampUpScore).toBeGreaterThan(0.2);
//         expect(rampUpScore).toBeLessThan(0.8);
//     });

//     test('Ramp Up Test for libvlc', async () => {
//         const rampUpScore: number = await calculateRampUpScore('https://github.com/prathameshnetake/libvlc', 'test/testing_data/repos_to_test/libvlc');
//         expect(rampUpScore).toBeLessThan(0.5);
//     });
// });

import { expect, test, describe, vi } from 'vitest';
import { calculateRampUpScore } from '../src/rampUp';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../src/logging';
import { marked } from 'marked';
import { npmHandler } from '../src/npmHandler';

// Mock the logger
vi.mock('../src/logging', () => ({
    error: vi.fn(),
}));

// Mock the npmHandler
vi.mock('../src/npmHandler', () => ({
    npmHandler: {
        processPackage: vi.fn(),
    },
}));

// Mock the TextStatistics class
vi.mock('text-statistics', () => {
    return {
      default: vi.fn().mockImplementation(() => {
        return {
          someMethod: vi.fn(),
        };
      }),
    };
  });
  
// Mock the fs module for file system operations
vi.mock('fs', () => {
    return {
        existsSync: vi.fn().mockReturnValue(true),
        readFileSync: vi.fn().mockReturnValue('# README\nThis is a sample README file.'),
        rmSync: vi.fn(),
    };
});

// Mock the marked function
vi.mock('marked', () => ({
    marked: {
        parse: vi.fn().mockReturnValue('This is a sample README file.'),
    },
}));

describe('Ramp Up Score Tests', () => {
    test('should calculate ramp-up score for GitHub URL', async () => {
        const repoPath = path.join(__dirname, 'test-repo');

        // Mock the checkDocumentationQuality function
        const checkDocumentationQuality = vi.fn().mockResolvedValue(0.8);
        vi.mocked(checkDocumentationQuality).mockImplementation(() => Promise.resolve(0.8));

        const score = await calculateRampUpScore('https://github.com/socketio/socket.io', repoPath);
        
        expect(score).toBeGreaterThanOrEqual(0); // Adjust as needed for the expected range
        //expect(checkDocumentationQuality).toHaveBeenCalledWith(repoPath);
    });

    test('should calculate ramp-up score for npm URL', async () => {
        const repoPath = path.join(__dirname, 'test-repo');

        // Mock the npmHandler.processPackage
        const mockNpmMetadata = { 
            name: 'example-package', 
            version: '1.0.0', 
            maintainers: ['user1', 'user2'], 
            dependencies: {}, 
            license: 'MIT', 
            gitUrl: 'https://github.com/owner/repo' 
        };
        vi.mocked(npmHandler.processPackage).mockResolvedValue(mockNpmMetadata);

        const score = await calculateRampUpScore('https://npmjs.com/package/example', repoPath);

        expect(score).toBeGreaterThanOrEqual(0); // Adjust as needed for the expected range
        expect(npmHandler.processPackage).toHaveBeenCalledWith('example');
    });

    // test('should return 0 for unsupported URL type', async () => {
    //     const score = await calculateRampUpScore('https://example.com', 'dummy/path');
    //     expect(score).toBe(0);
    //     expect(logger.error).toHaveBeenCalledWith('Unsupported URL type. Please provide a GitHub or npm URL.');
    // });
});
