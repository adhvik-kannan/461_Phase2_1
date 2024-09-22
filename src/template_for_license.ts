import logger from './logging.js'
import git, { clone } from 'isomorphic-git';
import os from 'os';
import fs from 'fs';
import http from 'isomorphic-git/http/node/index.cjs';
import path from 'path';



const compatible_licenses: RegExp[] = [/MIT\s[Ll]icense/, /GNU Lesser General Public License v2.0/,
    /GNU Lesser General Public License v2.1/, /GNU Lesser General Public License v3.0/, /\bMIT\b/];


export async function temp_license(repoUrl: string, tempDir: string): Promise<boolean> {
  if (!repoUrl.toString().includes("github.com")) {
      console.error('Could not find GitHub URL from npm package: ', repoUrl);
      return false;
  }
  try {    
      const files = fs.readdirSync(tempDir);
     
      for (const file of files) {
          //console.log("file: ", file);
          if (file.toLowerCase() === "readme.markdown" || file.toLowerCase() === "license" || file.toLowerCase() === "readme.md" || file.toLowerCase() === "package.json") {
   
              if(file.toLowerCase() === "package.json"){
                const jsoncontent = await getFileContent(tempDir, file);
                const packagejson = JSON.parse(jsoncontent);
                const license = packagejson.license;
                if(license){
                  const has_lic = license_verifier(license.toString());
                  if(has_lic){
                    return has_lic;
                  }
                }}
              else{
                const content = await getFileContent(tempDir, file);
                logger.info(`Content of ${repoUrl}:`, content);
                const license = license_verifier(content);
                //console.log(`License found: ${license}`);
                if(license)
                  return license;
              }
            }
          }
          
      
      //console.log("License not found in the root directory");
      return false;
            

} catch (error) {
      console.error("Error during processing: ", error);
      return false;
  } 
      
  
}

 async function getFileContent(tempDir, filepath) {
  try {
    // Construct the full path to the file
    const filePath = path.join(tempDir, filepath);
    //console.log("trying to read file");

    // Read the file content
    const data = await fs.promises.readFile(filePath, 'utf-8');
    
    // Return the content
    return data;
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