import { describe, it, expect, vi } from 'vitest';
import { Octokit } from '@octokit/rest';
import git from 'isomorphic-git';
import fs from 'fs';
import http from 'isomorphic-git/http/node/index.cjs';
import { isGithubTokenValid, cloneRepository } from '../src/github_utils'; // Adjust the import path as needed

vi.mock('@octokit/rest');
vi.mock('isomorphic-git');

describe('isGithubTokenValid', () => {
  it('should return true for a valid token', async () => {
    const mockRequest = vi.fn().mockResolvedValue({ status: 200 });
    Octokit.prototype.request = mockRequest;

    const result = await isGithubTokenValid('valid-token');
    expect(result).toBe(true);
  });

  it('should return false for an invalid token', async () => {
    const mockRequest = vi.fn().mockRejectedValue({ status: 401 });
    Octokit.prototype.request = mockRequest;

    const result = await isGithubTokenValid('invalid-token');
    expect(result).toBe(false);
  });
});

describe('cloneRepository', () => {
  it('should clone the repository successfully', async () => {
    const mockClone = vi.fn().mockResolvedValue({});
    git.clone = mockClone;

    const repoUrl = 'https://github.com/user/repo.git';
    const tempDir = '/tmp/repo';

    await cloneRepository(repoUrl, tempDir);
    expect(mockClone).toHaveBeenCalledWith({
      fs,
      http,
      dir: tempDir,
      url: repoUrl,
      singleBranch: true,
      depth: 1,
    });
  });

  it('should throw an error if cloning fails', async () => {
    const mockClone = vi.fn().mockRejectedValue(new Error('Clone failed'));
    git.clone = mockClone;

    const repoUrl = 'https://github.com/user/repo.git';
    const tempDir = '/tmp/repo';

    await expect(cloneRepository(repoUrl, tempDir)).rejects.toThrow('Clone failed');
  });
});
