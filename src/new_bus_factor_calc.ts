import logger from './logging.js'

/**
 * Calculates the bus factor for a given repository based on commit data.
 * The bus factor is a measure of the risk associated with the concentration of information
 * in individual contributors. A higher bus factor indicates lower risk.
 *
 * @param repoUrl - The URL of the repository.
 * @param commits - An array of commit objects. Each commit object should have a `commit` property
 *                  with an `author` property containing the author's name, and a `parents` property
 *                  which is an array of parent commits.
 * @returns A promise that resolves to the bus factor as a number.
 */
export async function temp_bus_factor_calc(repoUrl: string, commits: any[]): Promise<number> {
    const contributorCommits: { [key: string]: number } = {};

    commits.forEach((commit: any) => {
        // Check if the commit is not a merge commit by ensuring it has only one parent
        if (commit.parents.length === 1) {
            const author = commit.commit.author.name;
            contributorCommits[author] = (contributorCommits[author] || 0) + 1;
        }
    });

    const sortedContributors = Object.entries(contributorCommits)
        .sort(([, a], [, b]) => b - a); // Sort by commit count

    logger.debug(`sorted contributors ${sortedContributors}`);

    const totalCommits = sortedContributors.reduce((sum, [, count]) => sum + count, 0);
    logger.debug(`total commits for bus factor ${totalCommits}`);

    const topContributors = Math.ceil(sortedContributors.length / 100); // top 5% of contributors
    logger.debug(`top contributors ${topContributors}`);
    let topContributorsCommits = 0;

    for (let i = 0; i < topContributors; i += 1) {
        topContributorsCommits += sortedContributors[i][1];
    }

    logger.debug(`top contributors commits ${topContributorsCommits}`);
    logger.debug(`bus factor ${1 - (topContributorsCommits / totalCommits)}`);

    return 1 - (topContributorsCommits / totalCommits);
}
