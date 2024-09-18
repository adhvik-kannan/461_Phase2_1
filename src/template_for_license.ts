import logger from './logging.js'
import git, { clone } from 'isomorphic-git';
import fs from 'fs';
import http from 'isomorphic-git/http/node/index.cjs';
import os from 'os';
import path from 'path';
import { get } from 'http';
import { subDays } from 'date-fns';
import { all } from 'axios';
import { TREE, WORKDIR, STAGE } from 'isomorphic-git'

export async function temp_license(repoUrl:string) {
    if(repoUrl === "No repository URL found"){
      logger.info('Could not find github url from npm package')
      return -1;
    }
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-')); //make temp directory to clone repo
    await cloneRepository(tempDir, repoUrl); //clone repo
    const files = await getRootFiles(tempDir)
    for (const file of files){
        if(file.toLowerCase() === "readme.markdown" || file.toLowerCase() === "license" || file.toLowerCase() === "readme.md"){
          const content = await getFileContent(tempDir, file)
         break
        }
      }
  
    const license = check_content(content)
    return license
      
}

async function cloneRepository(tempDir, repoUrl: string) {
    
    await git.clone({
        fs,
        http,
        dir: tempDir,
        url: repoUrl,
        singleBranch: true,
        depth: 1
      })
   
    console.log("cloned")
  }

  async function getRootFiles(tempDir){
    // Walk the directory
   //  const files = await git.walk({
   //   fs,
   //   dir: tempDir,
   //   trees: [WORKDIR(), TREE({ ref: 'HEAD' })], // Walk through the working directory and Git tree
   //   map: async (filepath, [head, workdir]) => {
   //     // Return the file paths
   //     return filepath;
   //   }
   // });
   let files = await git.listFiles({ fs, dir: tempDir, ref: 'HEAD' })
   //const jsFiles = files.filter(file => file.endsWith('.js'));
   // console.log('Files in the root directory:', jsFiles);
   return files
 }

 async function getFileContent(tempDir, filepath){
    try {
      let commitOid = await git.resolveRef({ fs, dir: tempDir, ref: 'HEAD' })
      // Use readBlob to get the content of the file
      const { blob } = await git.readBlob({
        fs,
        dir: tempDir,
        oid: commitOid,  // Object ID of the commit (HEAD for the latest commit)
        filepath,    // Relative path of the file from the repository root
      });
  
      // Convert the Uint8Array to a string (assuming UTF-8 content)
      const content = new TextDecoder('utf-8').decode(blob);
      console.log(`Content of ${filepath}:`, content);
      return content;
    } catch (error) {
      console.error(`Failed to read file content: ${error}`);
      return undefined;
    }
  }