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

const compatible_licenses: RegExp[] = [/MIT\s[Ll]icense/, /GNU Lesser General Public License v2.0/,
    /GNU Lesser General Public License v2.1/, /GNU Lesser General Public License v3.0/];


export async function temp_license(repoUrl:string) {
    // console.log(repoUrl)
    if(!(repoUrl.toString().includes("github.com"))){
      console.error('Could not find github url from npm package:  ', repoUrl)
      return false;
    }
    // const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-')); //make temp directory to clone repo
    const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'temp-repo-'));
    await cloneRepository(tempDir, repoUrl); //clone repo
    const files = await getRootFiles(tempDir);

    for (const file of files){
        if(file.toLowerCase() === "readme.markdown" || file.toLowerCase() === "license" || file.toLowerCase() === "readme.md"){
          const content = await getFileContent(tempDir, file)
          logger.info(`Content of ${repoUrl}:`, content);
          const license = license_verifier(content)
          return license
        }
      }
    return false;
  
    
      
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
   
    logger.info("Repository cloned successfully", repoUrl);
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
      logger.debug(`Content of ${filepath}:`, content);
      return content;
    } catch (error) {
      console.error(`Failed to read file content: ${error}`);
      return undefined;
    }
  }



export async function license_verifier(file_contents: string) {
 
        for (let i=0; i<compatible_licenses.length; i++) {
            if (compatible_licenses[i].test(file_contents)) {
                return true;
            }
        }
        return false;

}