import {gitAPIHandler} from './gitAPIHandler.js'
import logger from './logging.js'


const compatible_licenses: RegExp[] = [/MIT\s[Ll]icense/, /GNU Lesser General Public License v2.0/,
    /GNU Lesser General Public License v2.1/, /GNU Lesser General Public License v3.0/];


export async function license_verifier(file_contents: string) {

        logger.debug("Checking for compatible licenses in file contents")
        for (let i=0; i<compatible_licenses.length; i++) {
            if (compatible_licenses[i].test(file_contents)) {
                return true;
            }
        }
        return false;

}