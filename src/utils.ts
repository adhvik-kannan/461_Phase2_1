import { URL, fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import AdmZip from 'adm-zip';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import logger from './logging.js';
import axios from 'axios';
import { useCallback } from 'react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function extractPackageName(url: string): string | null {
    const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
    const NPM_URL_PATTERN = /^https:\/\/www\.npmjs\.com\/package\/([^\/]+)/;

    try {
        const parsedUrl = new URL(url);

        if (GITHUB_URL_PATTERN.test(parsedUrl.toString())) {
            const match = GITHUB_URL_PATTERN.exec(parsedUrl.toString());
            return match ? match[2] : null; // Return the repository name
        } else if (NPM_URL_PATTERN.test(parsedUrl.toString())) {
            const match = NPM_URL_PATTERN.exec(parsedUrl.toString());
            return match ? match[1] : null; // Return the package name
        } else {
            console.error('Unsupported URL type.');
            return null;
        }
    } catch (error) {
        console.error('Invalid URL:', error);
        return null;
    }
}

/**
 * Parses the `repository` field from a package.json and returns the host, owner, repository name,
 * and an HTTPS URL for easy lookup.
 * @param {string|object} repository - The repository field from package.json.
 * @returns {Object|null} - An object containing host, owner, repo, and httpsUrl, or null if invalid.
 */
export function parseRepositoryUrl(repository) {
    try {
        let url;

        if (typeof repository === 'string') {
            // Handle shorthand format like "github:user/repo"
            if (repository.startsWith('github:')) {
                const [owner, repo] = repository.replace('github:', '').split('/');
                return {
                    host: 'github.com',
                    owner,
                    repo,
                    httpsUrl: `https://github.com/${owner}/${repo}`
                };
            }
            // Convert other formats to standard URL format
            url = new URL(repository.replace(/^git@/, 'https://').replace(/^git:\/\//, 'https://'));
        } else if (typeof repository === 'object' && repository.url) {
            // Handle repository object with type and url
            url = new URL(repository.url.replace(/^git@/, 'https://').replace(/^git:\/\//, 'https://'));
        } else {
            // Invalid repository format
            return null;
        }

        // Extract host, owner, and repo
        const host = url.host;
        const [owner, repo] = url.pathname.split('/').filter(Boolean);

        // Remove the '.git' suffix from the repo name if it exists
        const repoName = path.basename(repo, '.git');

        // Construct the HTTPS URL
        const httpsUrl = `https://${host}/${owner}/${repoName}`;

        return httpsUrl;
    } catch (error) {
        console.error('Invalid repository URL:', error);
        return null;
    }
}


/**
 * Clones a GitHub repository from the provided URL, compresses it into a ZIP file,
 * and returns the ZIP file as a base64-encoded string.
 *
 * @param url - The URL of the GitHub repository to clone.
 * @returns A promise that resolves to a base64-encoded string of the ZIP file, or null if an error occurs.
 *
 * @throws Will throw an error if the cloning or compression process fails.
 */
export async function processGithubURL(url: string): Promise<string | null> {
    const tempDir = path.join(__dirname, 'tmp', 'repo-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });
     try {
        await git.clone({
            fs,
            http,
            dir: tempDir,
            url: url,
            singleBranch: true,
            depth: 1,
        })

        const zip = new AdmZip();
        zip.addLocalFolder(tempDir);
        return zip.toBuffer().toString('base64');
    } catch(error) {
        logger.error('Error processing package content from URL:', error);
    } finally {
        fs.rmSync(tempDir, { recursive: true });
    }
}


/**
 * Processes the given NPM package URL to extract the GitHub repository URL.
 *
 * @param url - The URL of the NPM package to process.
 * @returns A promise that resolves to the GitHub repository URL as a string, or null if no repository field is found or an error occurs.
 *
 * @throws Will log an error message if the request to the URL fails or if the repository field is not found.
 */
export async function processNPMUrl(url: string): Promise<string | null> {
    try {
        const response = await axios.get(url);
        const repo = response.data.repository;
        if (repo && repo.url) {
            // replace the git+ prefix and .git suffix
            const githubUrl = repo.url.replace(/^git\+/, '').replace(/\.git$/,'');
            logger.info('Properly extracted github url from npm: ', githubUrl);
            return githubUrl;
        }
        logger.info('No repository field found in package.json');
        return null;
    } catch (error) {
        logger.error('Error processing package content from URL:', error);
        return null;
    }
}
