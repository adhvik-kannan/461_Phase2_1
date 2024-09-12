// import git, { clone } from 'isomorphic-git'
// import fs from 'fs';
// import http from 'isomorphic-git/http/node';
// import os from 'os';
// import path from 'path';
import git, { clone } from 'isomorphic-git';
import fs from 'fs';
import http from 'isomorphic-git/http/node/index.cjs';
import os from 'os';
import path from 'path';
import { get } from 'http';



export async function temp_bus_factor_calc(repoUrl:string): Promise<number> {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-'));
    await cloneRepository(tempDir, repoUrl);
    //await listBranches(tempDir);
    const commits = await getCommits(tempDir);
    //console.log(commits);
    return 1;
}


async function cloneRepository(tempDir, repoUrl: string) {
    
    await git.clone({
        fs,
        http,
        dir: tempDir,
        url: repoUrl,
        singleBranch: true,
        
      })
   
    console.log("cloned")
  }


//   DOA(e,f)=3.293+1.098FA+0.164DL−0.321log(1+AC)  (Sotovalero).
//   FA: (first authorship) is 1 for f file creator and 0 otherwise
//   DL: is the number of commits to the file f made by the engineer e
//   AC: is the number of commits to the file f made by the other project members
async function getDOA(engineer, file:string, tempDir){
    const commits =  await getCommits(tempDir);
    const FA = commits[0].commit.author.name === engineer? 1 : 0;
    const DL = commits.filter(commit => commit.commit.author.name === engineer).length;
    const AC = commits.length - DL;

}
  
async function getCommits(tempDir){
   
    let commits = await git.log({
        fs,
        dir: tempDir,
        ref: 'HEAD'
      })
    return commits
}

async function listBranches(tempDir: string) {
    let branches = await git.listBranches({ fs, dir: tempDir });
    console.log('Available branches:', branches);
}
