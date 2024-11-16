// utils.ts

import { URL } from 'url';
import path from 'path';
import AdmZip from 'adm-zip'; // Ensure adm-zip is installed: npm install adm-zip
import logger from './logging'; // Adjust the import path as necessary
import { requestContentFromS3 } from './s3_utils'; // Adjust the import path as necessary

// Interface for Package JSON structure
export interface PackageJson {
    dependencies?: { [key: string]: string };
    [key: string]: any; // To accommodate other possible fields
}

/**
 * Extracts the package name from a given URL.
 * @param {string} url - The URL to extract the package name from.
 * @returns {string | null} - The extracted package name or null if not found.
 */
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
 * Parses the `repository` field from a package.json and returns the HTTPS URL.
 * @param {string | object} repository - The repository field from package.json.
 * @returns {string | null} - The HTTPS URL of the repository or null if invalid.
 */
export function parseRepositoryUrl(repository: string | { url: string }): string | null {
    try {
        let url: URL;

        if (typeof repository === 'string') {
            // Handle shorthand format like "github:user/repo"
            if (repository.startsWith('github:')) {
                const [owner, repo] = repository.replace('github:', '').split('/');
                return `https://github.com/${owner}/${repo}`;
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

        // Construct the HTTPS URL without the trailing '.git'
        const httpsUrl = `https://${url.host}${url.pathname.replace(/\.git$/, '')}`;
        return httpsUrl;
    } catch (error) {
        console.error('Invalid repository URL:', error);
        return null;
    }
}

/**
 * Calculates the size of a package in megabytes (MB).
 * @param {string} hashKey - The hash key of the package in S3.
 * @returns {Promise<number>} - The size of the package in MB.
 */
export async function calculatePackageSize(hashKey: string): Promise<number> {
    try {
        // Retrieve the Base64-encoded content from S3
        const buffer = await requestContentFromS3(hashKey);
        const base64Content = buffer.toString('utf8');

        // Decode the Base64 content to get binary data
        const binaryContent = Buffer.from(base64Content, 'base64');

        // Calculate the size in MB
        const sizeInMB = binaryContent.length / (1024 * 1024);

        return parseFloat(sizeInMB.toFixed(2)); // Rounded to 2 decimal places
    } catch (error) {
        logger.error(`Error calculating size for package ${hashKey}:`, error);
        throw new Error('Failed to calculate package size.');
    }
}

/**
 * Retrieves the dependencies for a given package by parsing its package.json from S3.
 * @param {string} hashKey - The hash key of the package in S3.
 * @returns {Promise<string[]>} - An array of dependency package IDs.
 */
export async function getPackageDependencies(hashKey: string): Promise<string[]> {
    try {
        // Retrieve the Base64-encoded content from S3
        const buffer = await requestContentFromS3(hashKey);
        const base64Content = buffer.toString('utf8');

        // Decode the Base64 content to get binary data
        const binaryContent = Buffer.from(base64Content, 'base64');

        // Initialize AdmZip with the binary content
        const zip = new AdmZip(binaryContent);

        // Read the package.json file from the ZIP archive
        const packageJsonEntry = zip.getEntry('package.json');
        if (!packageJsonEntry) {
            logger.error(`package.json not found in package ${hashKey}`);
            throw new Error('package.json not found in the package.');
        }

        const packageJsonContent = packageJsonEntry.getData().toString('utf8');
        const packageJson: PackageJson = JSON.parse(packageJsonContent);

        // Extract dependencies from package.json
        const dependencies = packageJson.dependencies ? Object.keys(packageJson.dependencies) : [];

        return dependencies;
    } catch (error) {
        logger.error(`Error retrieving dependencies for package ${hashKey}:`, error);
        throw new Error('Failed to retrieve package dependencies.');
    }
}
