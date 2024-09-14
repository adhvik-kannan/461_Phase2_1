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
import { subDays } from 'date-fns';



export async function temp_bus_factor_calc(repoUrl:string): Promise<number> {
    
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-')); //make temp directory to clone repo
    await cloneRepository(tempDir, repoUrl); //clone repo

    const files = await getFiles(tempDir); //get files
    const file_length = files.length; //number of files
    console.log(files)
    //const commits = await getCommits(tempDir);//get commit history

    var abandoned_files = 0;
    //for each file go through all engineers on file and determine if file is abandoned or not based on DOA(Degree of Authorship)
    for (const file of files){
      if (await abandoned(file, tempDir, repoUrl) === true){
        abandoned_files += 1;
      }
    }
    console.log("ab: ",  abandoned_files)
    console.log("length: ",file_length)
    //console.log("commits: ", commits.length)
    
    return 1 - abandoned_files/file_length; //final bus score
}

async function getFiles(dir: string): Promise<string[]> {
  let jsFiles: string[] = [];

  async function readDirRecursive(currentDir: string): Promise<void> {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await readDirRecursive(fullPath); // Recurse into subdirectory
      } else if (entry.isFile() && path.extname(entry.name) === '.js') {
        const relativePath = path.relative(dir, fullPath).replace(/\\/g, '/');
        jsFiles.push(relativePath); // Push relative path
      }
    }
  }

  await readDirRecursive(dir);
  return jsFiles;
}

async function abandoned(file:string, tempDir, repoUrl): Promise<Boolean>{
  let commits = await getCommits(tempDir, file,true);
  console.log(commits, file)
  
  let engineers = await getContributors(tempDir, file);
  
  let engineers_dict : {[key:string]:number} = {}
  let max = 0;
  let total_doa = 0;

  for (var engineer of engineers){
    let doa = await getDOA(engineer, file, tempDir, commits);
    engineers_dict[engineer] = doa;
    if(doa > max){
      max = doa;
    }
    total_doa += doa;
  }

  //console.log("engineers->doa: ", engineers_dict, "file: ", file)

  //if any engineer has a degree of authorship on file, file is not abandoned, return false
  for (let key in engineers_dict){
    let doa_ef = engineers_dict[key];
    // if(doa_ef > 3.293 && doa_ef > .75 * max){
    //   return false;
    // }
    if(doa_ef >= .75*(total_doa)){
      return true;
    }
  }

  return false;
}

async function getContributors(tempDir: string, file): Promise<Set<string>> {
  let commits = await getCommits(tempDir, file, false)
  const contributors = new Set<string>();

  // loop through all commits and extract author names
  commits.forEach(commit => {
      const author = commit.commit.author.name;
      contributors.add(author); 
  });

  return contributors;  // return the set of unique engineers
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


// calcualte degree of authorship from engineer e on file f
//   DOA(e,f)=3.293+1.098FA+0.164DL−0.321log(1+AC)  (Sotovalero).
//   FA: (first authorship) is 1 for f file creator and 0 otherwise
//   DL: is the number of commits to the file f made by the engineer e
//   AC: is the number of commits to the file f made by the other project members
async function getDOA(engineer, file:string, tempDir, commits){
    if(commits.length === 0){
      return 3.293;
    }
    const FA = commits[0].commit.author.name === engineer? 1 : 0;
    const DL = commits.filter(commit => commit.commit.author.name === engineer).length;
    const AC = commits.length - DL;
    return 3.293+1.098*FA+0.164*DL - 0.321*Math.log(1+AC);

}
  
async function getCommits(tempDir, file, time){
  if(time === true){  
    try{
      const now = new Date();
      const yearAgo = subDays(now, 365);
      let commits = await git.log({
          fs,
          dir: tempDir,
          ref: 'HEAD',
          filepath: file,
          since: yearAgo
        })
      return commits
    }
    catch (error){
      console.error("Error finding commits", error);
      return [];
    }
  }
  else{
    try{
      let commits = await git.log({
          fs,
          dir: tempDir,
          ref: 'HEAD',
          filepath: file,
        })
      return commits
    }
    catch (error){
      console.error("Error finding commits", error);
      return [];
    }
  }
}


async function listBranches(tempDir: string) {
    let branches = await git.listBranches({ fs, dir: tempDir });
    console.log('Available branches:', branches);
}
