import axios from 'axios';
import fs from 'fs';
import { get } from 'http';
import logger from './logging.js'
import gitUrlParse from 'git-url-parse'
import getgithuburl from 'get-github-url'

export class npmHandler {
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

    // Fetches metadata for the package, including name, version, maintainers, dependencies, and license
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
    // static getCommitHistory() {
    //     throw new Error('Method not implemented.');
    // }
    // static getPullRequests() {
    //     throw new Error('Method not implemented.');
    // }
    // static getIssues() {
    //     throw new Error('Method not implemented.');
    // }
    // static getContributors() {
    //     throw new Error('Method not implemented.');
    // }

    // Extract the package name
    private static getName(data: any) {
        return data.name || 'Unknown';
    }

    // Extract the latest version of the package
    private static getVersion(data: any) {
        return data['dist-tags']?.latest || 'Unknown';
    }

    // Extract the maintainers of the package
    private static getMaintainers(data: any) {
        return data.maintainers ? data.maintainers.map((m: any) => m.name) : [];
    }

    // Extract the dependencies of the package
    private static getDependencies(data: any) {
        return data.versions[data['dist-tags'].latest]?.dependencies || {};
    }

    // Extract the license information of the package
    private static getLicense(data: any) {
        return data.license || 'Unknown';
    }

    //extract gitUrl if present
    private static getGitRepositoryUrl(data: any): string {
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
                console.debug("npm url converted to: ", normalizedUrl);
    
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

