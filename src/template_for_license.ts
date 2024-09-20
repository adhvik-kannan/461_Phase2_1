import logger from './logging.js'
import git, { clone } from 'isomorphic-git';
import os from 'os';
import fs from 'fs';
import http from 'isomorphic-git/http/node/index.cjs';
import path from 'path';


const compatible_licenses: RegExp[] = [/MIT\s[Ll]icense/, /GNU Lesser General Public License v2.0/,
    /GNU Lesser General Public License v2.1/, /GNU Lesser General Public License v3.0/];


export async function temp_license(repoUrl: string) {
  if (!repoUrl.toString().includes("github.com")) {
      console.error('Could not find GitHub URL from npm package: ', repoUrl);
      return false;
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temp-repo-'));
  console.log("Temporary directory created:", tempDir);

  try {
      await cloneRepository(tempDir, repoUrl); // Clone repo
      console.log("Repository cloned successfully.");
      const files = await getRootFiles(tempDir);
      logger.info('Files fetched from root: ', files.length);
      console.log("Files fetched from root: ", files.length);

      for (const file of files) {
          if (file.toLowerCase() === "readme.markdown" || file.toLowerCase() === "license" || file.toLowerCase() === "readme.md") {
              const content = await getFileContent(tempDir, file);
              logger.info(`Content of ${repoUrl}:`, content);
              const license = license_verifier(content);
              console.log(`License found: ${license}`);
              if(license)
                return license;
          }
      }
      console.log("License not found in the root directory");
      return false;
  } catch (error) {
      logger.error("Error during processing: ", error);
      return false;
  } finally {
      // Ensure the temp directory is cleaned up
      fs.rmSync(tempDir, { recursive: true, force: true });
      logger.info("Temporary repository directory removed:", tempDir);
  }
}


async function cloneRepository(tempDir, repoUrl: string) {
    
    await git.clone({
        fs,
        http,
        dir: tempDir,
        url: repoUrl,
        singleBranch: true,
        depth: 1,
        noCheckout: true,

      })
   
    logger.info("Repository cloned successfully", repoUrl);
  }

  async function getRootFiles(tempDir){

   let files = await git.listFiles({ fs, dir: tempDir, ref: 'HEAD' })
   
   
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
      //logger.debug(`Content of ${filepath}:`, content);
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