import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { gitAPIHandler } from '../src/gitAPIHandler'; // Adjust the import path as needed

vi.mock('@octokit/rest');
vi.mock('fs');
vi.mock('child_process');
vi.mock('util', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    promisify: vi.fn().mockImplementation((fn) => fn),
  };
});

const execPromise = promisify(exec);

describe('gitAPIHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new gitAPIHandler('https://github.com/user/repo');
  });

  it('should initialize with correct owner and repo', () => {
    expect(handler.owner).toBe('user');
    expect(handler.repo).toBe('repo');
  });

  it('should return repo details', async () => {
    const mockGet = vi.fn().mockResolvedValue({ data: { name: 'repo' } });
    Octokit.prototype.repos = { get: mockGet };

    const details = await handler.getRepoDetails();
    expect(details.name).toBe('repo');
  });

  it('should return commit history', async () => {
    const mockRequest = vi.fn().mockResolvedValue({ data: [{ sha: '123' }] });
    Octokit.prototype.request = mockRequest;

    const commits = await handler.getCommitHistory();
    expect(commits).toHaveLength(1);
    expect(commits[0].sha).toBe('123');
  });

  it('should return README content', async () => {
    const mockGetReadme = vi.fn().mockResolvedValue({ data: { content: Buffer.from('README content').toString('base64') } });
    Octokit.prototype.rest = { repos: { getReadme: mockGetReadme } };

    const readme = await handler.get_readme();
    expect(readme).toBe('README content');
  });

  it('should return issues', async () => {
    const mockListForRepo = vi.fn().mockResolvedValue({ data: [{ id: 1 }] });
    Octokit.prototype.issues = { listForRepo: mockListForRepo };

    const issues = await handler.getIssues();
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe(1);
  });

  it('should return pull requests', async () => {
    const mockList = vi.fn().mockResolvedValue({ data: [{ id: 1 }] });
    Octokit.prototype.pulls = { list: mockList };

    const pullRequests = await handler.getPullRequests();
    expect(pullRequests).toHaveLength(1);
    expect(pullRequests[0].id).toBe(1);
  });

  it('should return contributors', async () => {
    const mockListCommits = vi.fn().mockResolvedValue({ data: [{ author: { login: 'user' } }] });
    Octokit.prototype.repos = { listCommits: mockListCommits };

    const contributors = await handler.getContributors();
    expect(contributors).toHaveLength(1);
    expect(contributors[0].author.login).toBe('user');
  });

  it('should fetch all files', async () => {
    const mockGetContent = vi.fn().mockResolvedValue({ data: [{ type: 'file', path: 'file1' }] });
    Octokit.prototype.repos = { getContent: mockGetContent };

    const files = await handler.fetchAllFiles('');
    expect(files).toHaveLength(1);
    expect(files[0]).toBe('file1');
  });

  it('should fetch file content', async () => {
    const mockGetContent = vi.fn().mockResolvedValue({ data: { type: 'file', encoding: 'base64', content: Buffer.from('file content').toString('base64') } });
    Octokit.prototype.repos = { getContent: mockGetContent };

    const content = await handler.fetchFileContent('file1');
    expect(content).toBe('file content');
  });

//   it('should clone repository', async () => {
//     const mockExec = vi.fn().mockResolvedValue({});
//     execPromise.mockImplementation(mockExec);

//     await handler.cloneRepository('/path/to/clone');
//     expect(mockExec).toHaveBeenCalledWith(`git clone https://github.com/user/repo.git "/path/to/clone"`);
//   });
});
