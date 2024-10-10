import axios from 'axios';
import fs from 'fs';
import { get } from 'http';
import logger from './logging.js'
import gitUrlParse from 'git-url-parse'
import getgithuburl from 'get-github-url'

/**
 * The `npmHandler` class provides methods to process and fetch metadata for NPM packages.
 * 
 * @remarks
 * This class includes methods to fetch metadata from the NPM registry, extract specific information
 * such as the package name, version, maintainers, dependencies, license, and Git repository URL.
 * 
 * @example
 * ```typescript
 * const metadata = await npmHandler.processPackage('example-package');
 * console.log(metadata);
 * ```
 * 
 * @public
 */
export class npmHandler {
    
    /**
     * Processes an NPM package by fetching its metadata.
     *
     * @param packageName - The name of the NPM package to process.
     * @returns A promise that resolves to the metadata of the NPM package.
     * @throws Will throw an error if there is an issue processing the NPM package.
     */
    static async processPackage(packageName: string) {
        try {
            logger.debug('Processing NPM Package:', packageName);
            const metaData = await this.fetchNpmPackageMetadata(packageName);
            //console.log('Processed NPM Package:', metaData);
            //console.log('Processed NPM Package:', metaData);
            return metaData;  // Return metadata so it can be used by other components
        } catch (error) {
            console.error('Error processing NPM package.');
            throw error;
        }
    }

    /**
     * Fetches metadata for a given npm package from the npm registry.
     * 
     * @param packageName - The name of the npm package to fetch metadata for.
     * @returns A promise that resolves to an object containing the package metadata, including:
     * - `name`: The name of the package.
     * - `version`: The latest version of the package.
     * - `maintainers`: An array of maintainers for the package.
     * - `dependencies`: An object representing the package's dependencies.
     * - `license`: The license of the package.
     * - `gitUrl`: The Git repository URL of the package.
     * 
     * @throws Will throw an error if the metadata fetching fails.
     */
    private static async fetchNpmPackageMetadata(packageName: string) {
        logger.debug(`Fetching metadata for package: ${packageName}`);
        const url = `https://registry.npmjs.org/${packageName}`;
        try {
            const response = await axios.get(url);
            const data = response.data;
            
            const giturl = npmHandler.getGitRepositoryUrl(data);
            //print the data into a file
            fs.writeFileSync('npmData.json', JSON.stringify(data, null, 2));
            // Extract metadata
            const metaData = {
                name: this.getName(data),
                version: this.getVersion(data),
                maintainers: this.getMaintainers(data),
                dependencies: this.getDependencies(data),
                license: this.getLicense(data),
                gitUrl: this.getGitRepositoryUrl(data)
                // contributers: this.getCommitHistory(),
                // issues: this.getIssues(),
                // pullRequests: this.getPullRequests()
            };

            return metaData;
        } catch (error) {
            console.error('Error fetching metadata');
            throw error;
        }
    }

    /**
     * Retrieves the name property from the provided data object.
     * If the name property is not present, it returns 'Unknown'.
     *
     * @param data - The data object from which to retrieve the name.
     * @returns The name property of the data object, or 'Unknown' if the name is not present.
     */
    private static getName(data: any) {
        return data.name || 'Unknown';
    }

    /**
     * Retrieves the latest version from the provided data object.
     *
     * @param data - The data object containing version information.
     * @returns The latest version as a string, or 'Unknown' if not available.
     */
    private static getVersion(data: any) {
        return data['dist-tags']?.latest || 'Unknown';
    }

    /**
     * Extracts the names of maintainers from the provided data.
     *
     * @param data - The data object containing maintainer information.
     * @returns An array of maintainer names. If no maintainers are found, returns an empty array.
     */
    private static getMaintainers(data: any) {
        return data.maintainers ? data.maintainers.map((m: any) => m.name) : [];
    }

    /**
     * Retrieves the dependencies of the latest version from the provided data.
     *
     * @param data - The data object containing version information.
     * @returns An object representing the dependencies of the latest version, or an empty object if no dependencies are found.
     */
    private static getDependencies(data: any) {
        return data.versions[data['dist-tags'].latest]?.dependencies || {};
    }

    /**
     * Retrieves the license information from the provided data.
     *
     * @param data - The data object containing license information.
     * @returns The license information if available, otherwise returns 'Unknown'.
     */
    private static getLicense(data: any) {
        return data.license || 'Unknown';
    }

    /**
     * Retrieves and normalizes the Git repository URL from the provided npm metadata.
     *
     * @param data - The npm metadata object containing repository information.
     * @returns The normalized GitHub repository URL as a string. Returns an empty string if the URL is invalid or not found.
     *
     * @throws Will log an error message if there is an issue processing the repository URL.
     *
     * @example
     * ```typescript
     * const npmData = {
     *   repository: {
     *     url: "git+https://github.com/user/repo.git"
     *   }
     * };
     * const url = getGitRepositoryUrl(npmData);
     * console.log(url); // Outputs: "https://github.com/user/repo"
     * ```
     */
    public static getGitRepositoryUrl(data: any): string {
        try {
            if (data.repository && data.repository.url) {
                // Clean the URL by removing "git+" and ".git"
                let gitUrl = data.repository.url.replace(/^git\+/, '').replace(/\.git$/, ''); 
                
                // Convert SSH URL to HTTPS if necessary
                if (gitUrl.startsWith('ssh://git@github.com')) {
                    gitUrl = gitUrl.replace('ssh://git@github.com', 'https://github.com');
                } else if (gitUrl.startsWith('git@github.com')) {
                    gitUrl = gitUrl.replace('git@github.com:', 'https://github.com/');
                }
    
                // Parse the URL using gitUrlParse and extract the pathname
                let urlInfo = gitUrlParse(gitUrl).pathname;
                let normalizedUrl = getgithuburl(urlInfo); // Function to get the final GitHub URL
    
                // Log the converted URL
                logger.debug("npm url converted to: ", normalizedUrl);
    
                // Check if the URL includes 'https' and is valid
                if (!normalizedUrl.includes('https')) {
                    console.error("Invalid GitHub URL from npm");
                    return '';
                }
    
                return normalizedUrl; // Return the valid HTTPS URL
            } else {
                console.error("No repository URL found in npm metadata.");
                return '';
            }
        } catch (error) {
            console.error("Error getting GitHub URL: ", error);
            return '';
        }
    }
        
        
}

