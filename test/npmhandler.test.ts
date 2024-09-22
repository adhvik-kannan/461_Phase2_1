import { expect, test, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { npmHandler } from '../src/npmHandler.js';
import fs from 'fs';

// Mocking the axios module
vi.mock('axios');

// Mocking fs module
vi.mock('fs');

// Mocking the logger module (without spreading importOriginal)
vi.mock('../src/logging.js', async () => {
    const originalModule = await vi.importActual<any>('../src/logging.js');
    return {
        ...originalModule,  // Spread the actual module to keep the non-mocked methods
        debug: vi.fn(),     // Mock the debug function
    };
})

const mockPackageName = 'example-package';
const mockResponseData = {
    name: mockPackageName,
    'dist-tags': { latest: '1.0.0' },
    maintainers: [{ name: 'maintainer1' }],
    versions: {
        '1.0.0': { dependencies: { lodash: '^4.17.21' } },
    },
    license: 'MIT',
    repository: {
        url: 'git+https://github.com/user/repo.git',
    },
};

beforeEach(() => {
    (axios.get as any).mockReset();
    (fs.writeFileSync as any).mockReset();
});

test('processPackage should return package metadata', async () => {
    (axios.get as any).mockResolvedValue({ data: mockResponseData });

    const result = await npmHandler.processPackage(mockPackageName);

    expect(result).toEqual({
        name: mockPackageName,
        version: '1.0.0',
        maintainers: ['maintainer1'],
        dependencies: { lodash: '^4.17.21' },
        license: 'MIT',
        gitUrl: 'https://github.com/user/repo',
    });
});

test('processPackage should throw an error on fetch failure', async () => {
    (axios.get as any).mockRejectedValue(new Error('Network Error'));

    await expect(npmHandler.processPackage(mockPackageName)).rejects.toThrow('Network Error');
});

test('getGitRepositoryUrl should handle valid Git URLs', () => {
    const validData = {
        repository: {
            url: 'git+ssh://git@github.com:user/repo.git',
        },
    };

    const gitUrl = npmHandler.getGitRepositoryUrl(validData);
    expect(gitUrl).toBe('https://github.com/user/repo');
});

test('getGitRepositoryUrl should return an empty string for missing URL', () => {
    const invalidData = {};

    const gitUrl = npmHandler.getGitRepositoryUrl(invalidData);
    expect(gitUrl).toBe('');
});

test('getGitRepositoryUrl should return an empty string for invalid URL', () => {
    const invalidData = {
        repository: {
            url: 'invalid-url',
        },
    };

    const gitUrl = npmHandler.getGitRepositoryUrl(invalidData);
    expect(gitUrl).toBe('');
});
