//the npmHandler should provide name, version, maintainers, dependendencies,
//and liscence informaiton so that the metric manager can use this
//and create the score

//how to webscrape info from websites

import axios from 'axios';

export class npmHandler {

    static async processPackage(packageName: string) {
        try {
            console.log('Processing NPM Package:', packageName);
            const metaData = await this.fetchNpmPackageMetadata(packageName);
            console.log('Processed NPM Package:', metaData);
        } catch (error) {
            console.error('Error processing NPM package:', error);
        }

    }

    //asynchronously get name, version, maintainers, dependencies, and licenseInformation
    private static async fetchNpmPackageMetadata(packageName: string) {
        console.log(`Fetching metadata for package: ${packageName}`);
        const url = 'https://registry.npmjs.org/${packageName}';

        try{
            const response = await axios.get(url);

            const data = response.data
            
        //call each function so that it can do async processing

            const version = await this.getVersion(data);
            const maintainers = await this.getMaintainers(data);
            const dependencies = await this.getDependencies(data);
            const license = await this.getLicense(data);
            const name = await this.getName(data);

        // structured metadata, we can use this in our metric manager and for our metrics
        return {
            name,
            version,
            maintainers,
            dependencies,
            license,
        };

    } catch (error) {
        console.error('Error fetching metadata:', error);
        throw error;
    }

    
    }

    private static async getName(data: any) {
        try {
            return data.name || 'Unknown';
        } catch (error) {
            console.error('Error fetching package name:', error);
            return 'Unknown';
        }
    }

    // Get the package version
    private static async getVersion(data: any) {
        try {
            return data['dist-tags'].latest || 'Unknown';
        } catch (error) {
            console.error('Error fetching package version:', error);
            return 'Unknown';
        }
    }

    // Get the maintainers of the package
    private static async getMaintainers(data: any) {
        try {
            return data.maintainers ? data.maintainers.map((m: any) => m.name) : [];
        } catch (error) {
            console.error('Error fetching maintainers:', error);
            return [];
        }
    }

    // Get the dependencies of the package
    private static async getDependencies(data: any) {
        try {
            return data.versions[data['dist-tags'].latest].dependencies || {};
        } catch (error) {
            console.error('Error fetching dependencies:', error);
            return {};
        }
    }

    // Get the license information of the package
    private static async getLicense(data: any) {
        try {
            return data.license || 'Unknown';
        } catch (error) {
            console.error('Error fetching license information:', error);
            return 'Unknown';
        }
    }

}

