import { URL } from 'url';
import path from 'path';
import fs from 'fs';

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

export function findAndReadReadme(possibleReadmeFiles: string[], dirPath: string): String {
    for (const fileName of possibleReadmeFiles) {
        const filePath = path.join(dirPath, fileName);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            return content;
        }
    }
    return '';
}