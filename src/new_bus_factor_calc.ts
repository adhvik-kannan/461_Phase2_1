import logger from './logging.js'

export async function temp_bus_factor_calc(repoUrl:string, commits: any[]): Promise<number>{
    const contributorCommits: { [key: string]: number } = {};
    //console.log("commits", commits.length);
    commits.forEach((commit: any) => {
        const author = commit.commit.author.name;
        contributorCommits[author] = (contributorCommits[author] || 0) + 1;
    });

    const sortedContributors = Object.entries(contributorCommits)
    .sort(([, a], [, b]) => b - a); // Sort by commit count

    

    const totalCommits = sortedContributors.reduce((sum, [, count]) => sum + count, 0);
    //const thresholdCommits = totalCommits* .5
    const topContributors = Math.ceil(sortedContributors.length/100); //top 5% of contributors
    // console.log(contributorCommits)
    // console.log(topContributors)
    // console.log(sortedContributors)
    let topContributors_commits = 0;

    for (let i = 0; i < topContributors; i += 1){
        topContributors_commits += sortedContributors[i][1]
    }

    //console.log("Top contributors commits", topContributors_commits)
    //console.log("Total commits", totalCommits)

    return 1 - topContributors_commits/totalCommits



}


  
  