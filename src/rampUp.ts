import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';
import TextStatistics from 'text-statistics';
import { gitAPIHandler } from './gitAPIHandler.js'; // For GitHub repos
import { npmHandler } from './npmHandler.js'; // For npm packages

const execPromise = promisify(exec);

// Utility function to delete the directory if it exists
async function deleteDirectory(repoPath: string): Promise<void> {
    try {
        if (fs.existsSync(repoPath)) {
            fs.rmSync(repoPath, { recursive: true, force: true });
            console.log(`Deleted existing directory: ${repoPath}`);
        }
    } catch (error) {
        console.error(`Error deleting directory: ${repoPath}`, error);
    }
}

// Calculate readability of the text using text-statistics
function calculateReadability(textContent: string): { ease: number, gradeLevel: number } {
    const stats = new TextStatistics(textContent); // Create an instance of TextStatistics
    return {
        ease: stats.fleschKincaidReadingEase(),
        gradeLevel: stats.fleschKincaidGradeLevel()
    };
}

// Check Documentation Quality of README.md in the repository
async function checkDocumentationQuality(repoPath: string): Promise<number> {
    try {
        const readmePath = path.join(repoPath, 'README.md');
        if (!fs.existsSync(readmePath)) {
            console.error('README.md not found.');
            return 0;
        }

        const readmeContent = fs.readFileSync(readmePath, 'utf8');
        const plainTextContent = await marked.parse(readmeContent); // Convert Markdown to plain text for analysis
        const readabilityScores = calculateReadability(plainTextContent);

        console.log(`Readability Scores - Ease: ${readabilityScores.ease}, Grade Level: ${readabilityScores.gradeLevel}`);
        console.log('README.md content:', plainTextContent.substring(0, 200));

        const totalScore = readabilityScores.ease / 100;
        console.log(`Documentation quality checked successfully with readability assessment.`);
        return totalScore;

    } catch (error) {
        console.error('Error checking documentation quality:', error);
        return 0;
    }
}

function isGithubUrl(url: string): boolean {
    return url.includes('github.com');
}

function isNpmUrl(url: string): boolean {
    return url.includes('npmjs.com');
}

// Main function to calculate the ramp-up score based on URL type
export async function calculateRampUpScore(url: string | URL): Promise<number> {
    const repoPath = path.resolve(process.cwd(), 'repo'); // The repo will be cloned in the current directory

    try {
        // Clean up the repo directory first
        await deleteDirectory(repoPath);

        // Convert the URL object to a string if necessary
        const urlString = typeof url === 'string' ? url : url.toString();

        console.log(`Validating URL: ${urlString}`);

        let rampUpScore = 0;

        // Handle GitHub URLs
        if (isGithubUrl(urlString)) {
            console.log('Processing GitHub repository...');
            const gitHandler = new gitAPIHandler(urlString);
            await gitHandler.cloneRepository(repoPath);
            console.log("Repository cloned successfully.");

            // Check documentation quality
            rampUpScore = await checkDocumentationQuality(repoPath);
            console.log(`Ramp-Up Score (GitHub): ${rampUpScore}`);

        // Handle npm URLs
        } else if (isNpmUrl(urlString)) {
            console.log('Processing NPM package...');
            const packageName = urlString.split('/').pop(); // Get package name from URL
            const npmMetadata = await npmHandler.processPackage(packageName || '');

            console.log('NPM Metadata:', npmMetadata);

            // If there's a GitHub repository URL in the npm metadata, clone and analyze
            if (npmMetadata.gitUrl && isGithubUrl(npmMetadata.gitUrl)) {
                console.log('GitHub repository found in NPM metadata, processing GitHub repo...');
                const gitHandler = new gitAPIHandler(npmMetadata.gitUrl);
                await gitHandler.cloneRepository(repoPath);
                rampUpScore = await checkDocumentationQuality(repoPath);
            } else {
                // If no GitHub repo is available, base the score on npm metadata (e.g., maintainers, license)
                console.log('No GitHub repository found, scoring based on npm metadata...');
                rampUpScore = npmMetadata.maintainers.length / 10; // Example score based on maintainers
            }
            console.log(`Ramp-Up Score (NPM): ${rampUpScore}`);
        } else {
            console.error('Unsupported URL type. Please provide a GitHub or npm URL.');
            return 0;
        }

        // Clean up after analysis
        await deleteDirectory(repoPath);
        console.log(`Repository directory cleaned up: ${repoPath}`);

        return rampUpScore;
    } catch (error) {
        console.error('Error in ramp-up score calculation:', error);
        return 0; // Return 0 in case of error
    }
}
