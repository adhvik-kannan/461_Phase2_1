import {gitAPIHandler} from './gitAPIHandler.js'

const compatible_licenses: RegExp[] = [/MIT\s[Ll]icense/, /GNU Lesser General Public License v2.0/,
    /GNU Lesser General Public License v2.1/, /GNU Lesser General Public License v3.0/];


export async function license_verifier(file_contents: string) {

    // console.log(file_contents);
    // if (file_type == 'readme') {
        for (let i=0; i<compatible_licenses.length; i++) {
            if (compatible_licenses[i].test(file_contents)) {
                return true;
            }
        }
        return false;
    // }

    // if (file_type == 'license') {

    // }

}