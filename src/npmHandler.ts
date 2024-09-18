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
    private static getGitRepositoryUrl(data: any) {
        try{
        if (data.repository && data.repository.url) {
            let url_info = gitUrlParse(data.repository.url).pathname
            let url = getgithuburl(url_info)
            
            logger.debug("npm url converted to: ", url)
            
            // Check if the URL includes 'https' 
            if (!url.includes('https')) {
              
                console.error("Invalid github URL from npm")
                return '';
            }
            
            return url; // Return normalized URL
        }
        else{
            return '';
        }}
        catch(error){
            console.error("Error getting GitHub URL: ", error)
            return '';
        }
        
        
    }
    //get the issues from the npm package from the github url for the past 6 months
    // public async getIssues(url : string) {
    //     const sixMonthsAgo = new Date();
    //     sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    //     const issues = await axios.get(url + '/issues', {
    //         params: {
    //             since: sixMonthsAgo.toISOString(),
    //             state: 'all'
    //         }
    //     });
    //     return issues.data;
    // }
    // //get the pull requests from the npm package from the github url for the past 6 months
    // public async getPullRequests(url : string) {
    //     const sixMonthsAgo = new Date();
    //     sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    //     const pullRequests = await axios.get(url + '/pulls', {
    //         params: {
    //             state: 'all',
    //             per_page: 100
    //         }
    //     });
    //     return pullRequests.data;
    // }

    // //get the commit history from the npm package from the github url from the last 90 days
    // public async getCommitHistory(url : string) {
    //     const ninetyDaysAgo = new Date();
    //     ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    //     const commits = await axios.get(url + '/commits', {
    //         params: {
    //             since: ninetyDaysAgo.toISOString()
    //         }
    //     });
    //     return commits.data;
    // }

}
