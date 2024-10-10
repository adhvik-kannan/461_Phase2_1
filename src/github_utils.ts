import { Octokit } from '@octokit/rest';
import logger from './logging.js'
import git from 'isomorphic-git';
import fs from 'fs';
import http from 'isomorphic-git/http/node/index.cjs';

/**
 * This function checks if the provided GitHub access token is valid
 * 
 * @param token - GitHub access token
 * @returns - Boolean indicating whether the token is valid
 */
export async function isGithubTokenValid(token: string): Promise<boolean> {
    try {
        const octokit = new Octokit({
            auth: token, // Provide the GitHub access token
        });
  
        // Test the token by making an authenticated request
        const { status } = await octokit.request('GET /user');
  
        // If we get a 200 status, the token is valid
        return status === 200;
    } catch (error: any) {
        // If we get a 401 status, the token is invalid
        if (error.status === 401) {
            console.error('Invalid GitHub token provided');
            return false;
        }
        ; // Handle other types of errors (network, etc.)
    }
};

/**
 * This function clones the specified repository to the specified directory
 * 
 * @param repoUrl - URL of the repository to clone
 * @param tempDir - Temporary directory to clone the repository to
 */
export  async function cloneRepository(repoUrl: string, tempDir: string) {
    try {
        
        await git.clone({
            fs,
            http,
            dir: tempDir,
            url: repoUrl,
            singleBranch: true,
            depth: 1,
           
          })
        logger.info("Repository cloned successfully", repoUrl);
       
          
        } 
        
     catch (error) {
        logger.error("Error cloning repository:", error);
        throw error;
    }
}
   

  
      