import { Octokit } from '@octokit/rest';

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
            console.error('Invalid GitHub token');
            return false;
        }
        ; // Handle other types of errors (network, etc.)
    }
  }
  
      