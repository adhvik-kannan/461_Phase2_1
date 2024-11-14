import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import * as util from './utils.js';
import * as db from './database';
import { rate } from './rate.js';
import logger from './logging.js';
import AdmZip from 'adm-zip';
// import * as userDB from './userDB.js';
import SHA256 from 'crypto-js/sha256';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';
import { json } from 'stream/consumers';
// import { GetObjectCommand } from '@aws-sdk/client-s3';
// import { BUCKET_NAME, s3, streamToBuffer } from './s3_utils.js';
// import { Readable } from 'stream';
import * as s3 from './s3_utils';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// For TypeScript, you might need to cast to string
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const monkeyBusiness = '\"bearer 66abf860f10edcdd512e9f3f9fdc8af1bdc676503922312f8323f5090ef09a6a\"'

const packageDB = db.connectToMongoDB("Packages");
const userDB = db.connectToMongoDB("Users");

// console.log(packageDB);
const Package = packageDB[1].model('Package', db.packageSchema);
const UserModel = userDB[1].model('User', db.userSchema);
const app = express();
// app.use(express.json()); // parse incoming requests with JSON payloads
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));
// app.use(express.json()); // parse incoming requests with JSON payloads
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.2',
        info: {
            title: 'PackageManagerAPI',
            description: 'API to handle package manager requests',
            contact: {
                name: 'nkim12303@gmail.com, atharvarao100@gmail.com, andrewtu517@gmail.com, adhvik.kannan@gmail.com'
            },
            version: '1.0.0',
            servers: [
                {
                    url: 'http://localhost:3000',
                },
                {
                    url: 'https://aws-web-server-here',
                }
            ]
        }
    },
    apis: ['./src/*.ts'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 *  /delete:
 *      delete:
 *          summary: Deletes the database
 *          responses:
 *              200:
 *                  description: Database deleted successfully
 *              500:
 *                  description: Error deleting database
 */
// TODO: HAVE TO ADD AUTHENTICATION PARSING
app.delete('/reset', async (req, res) => {
    const authToken = req.headers['X-Authorization'] || req.headers['x-authorization'];
    if(authToken == '' || authToken == null) {
        logger.error('Missing Authentication Header');
        res.status(403).send('Missing Authentication Header');
    }
    if (authToken != monkeyBusiness) {
        logger.error('You do not have the correct permissions to delete the database.');
        res.status(401).send('You do not have the correct permissions to delete the database.');
    } else {
        try {
            const result = await db.deleteDB(packageDB[1]);
            const result2 = await db.deleteUsersExcept(UserModel);
            if (result[0] == true && result2[0] == true) {
                logger.info('Registry is reset.');
                return res.status(200).send('Registry is reset.');
            } else if(result[0] == false) {
                logger.error('Error deleting database:', result[1]);
                return res.status(500).send('Error deleting database');
            } else if(result2[0] == false) {
                logger.error('Error deleting user:', result2[1]);
                return res.status(500).send('Error deleting user');
            }
            
            
        } catch (error) {
            logger.error('Error deleting database:', error);
            res.status(500).send('Error deleting database');
        }
    }
});

/**
 * @swagger
 *  /upload/{url}:
 *     post:
 *      summary: Uploads a package and calculates the score
 *      parameters:
 *          - name: url
 *            in: path
 *            required: true
 *            schema:
 *              type: string
 *            description: The URL of the package to upload
 *      responses:
 *          200:
 *              description: Package uploaded successfully
 *              content:
 *                  text/plain:
 *                    schema:
 *                      type: number
 *                      description: The score of the package
 *          403:
 *              description: Package rating too low
 *          500:
 *              description: Error uploading package
 */
app.post('/package', async (req, res) => {
    // console.log(req.headers);
    const token = req.headers['X-Authorization'] || req.headers['x-authorization'];
    // console.log(token);
    if(token == '' || token == null) {
        logger.error('Missing Authentication Header');
        return res.status(403).send('Missing Authentication Header');
    }
    console.log(token);
    console.log(monkeyBusiness);
    if (token != monkeyBusiness) {
        logger.error('You do not have the correct permissions to upload to the database.');
        return res.status(403).send('You do not have the correct permissions to upload to the database.');
    }
    const { Name, Content, URL, debloat, JSProgram } = req.body
    console.log(URL);
    if ((Content && URL) || (!Content && !URL)) {
        return res.status(400).json({
            error: "Either 'Content' or 'URL' must be set, but not both.",
        });
    }

    if (!Name && Content) {
        return res.status(400).json({ error: "'Name' is required with Content." });
    }

    // Process the uploaded package (dummy processing for this example)
    if (Content) {
        // Handle the base64-encoded content
        console.log("Processing package from content.");
        try {
            // Decode the base64-encoded zip file
            const buffer = Buffer.from(Content, 'base64');
    
            // Load the zip file using adm-zip
            // const AdmZip = require('adm-zip');
            const zip = new AdmZip(buffer);
    
            // Find the package.json file within the zip entries
            let packageJsonEntry = null;
            zip.getEntries().forEach(function(zipEntry) {
                if (zipEntry.entryName.endsWith('package.json')) {
                    packageJsonEntry = zipEntry;
                }
            });
    
            if (!packageJsonEntry) {
                return res.status(400).json({ error: "package.json not found in the provided content." });
            }
    
            // Read and parse the package.json file
            const packageJsonContent = packageJsonEntry.getData().toString('utf8');
            const packageJson = JSON.parse(packageJsonContent);
    
            // Extract the repository link and package name
            const repository = packageJson.repository;
            let repoUrl = '';
            if (typeof repository === 'string') {
                repoUrl = repository;
            } else if (repository && repository.url) {
                repoUrl = repository.url;
            }
            repoUrl = util.parseRepositoryUrl(repoUrl).toString();
            const packageName = packageJson.name;
    
            // Log or use the extracted information as needed
            console.log('Package Name:', packageName);
            console.log('Repository URL:', repoUrl);
            
            // TODO: Rework the get into get all packages and then get the latest one
            const pkg = await db.getPackagesByNameOrHash(packageName, Package);
            if(pkg[0] == true) {
                logger.info(`Package ${packageName} already exists with score: ${pkg[1]["score"]}`);
                const version = pkg[1]["version"];
                const packageId = SHA256(packageName + version).toString();
                const jsonResponse = {
                    metadata: {
                        Name: packageName,
                        Version: version,
                        ID: packageId,
                    },
                    data: {
                        Content: Content,
                        JSProgram: JSProgram || '',
                    },
                };
                return res.status(409).send(jsonResponse);
            } else {
                let version = packageJson.version;
                if(version == null || version == "") {
                    version = '1.0.0';
                }
                const packageId = SHA256(packageName + version).toString();
                const jsonResponse = {
                    metadata: {
                        Name: packageName,
                        Version: version,
                        ID: packageId,
                    },
                    data: {
                        Content: Content,
                        JSProgram: JSProgram || '',
                    },
                };
                const [package_rating, package_net] = await rate(repoUrl);
                if (package_net >= 0.5) {
                    await s3.uploadContentToS3(Content, packageId);
                    const result = await db.addNewPackage(packageName, URL, Package, packageId, package_rating, version, package_net, "Content");
                    if (result[0] == true) {
                        logger.info(`Package ${packageName} uploaded with score: ${package_rating}`);

                        return res.status(201).send(jsonResponse);
                    } else {
                        logger.error(`Error uploading package:`, packageName);
                        return res.status(500).send('Error uploading package');
                    }
                } else {
                    logger.info(`Package ${packageName} rating too low: ${package_rating}`);
                    return res.status(424).send('Package rating too low');
                }
            }
        } catch (error) {
            console.error('Error processing package content:', error);
            return res.status(500).json({ error: 'Failed to process package content.' });
        }
    } else if (URL) {
    // Handle the URL for the package
        console.log("Processing package from URL.");
        try {
            const tempDir = path.join(__dirname, 'tmp', 'repo-' + Date.now());
            fs.mkdirSync(tempDir, { recursive: true });

            await git.clone({
                fs,
                http,
                dir: tempDir,
                url: URL,
                singleBranch: true,
                depth: 1,
            });

            const packageJsonPath = path.join(tempDir, 'package.json');
            
            if (!fs.existsSync(packageJsonPath)) {
                // Clean up the temporary directory
                fs.rmSync(tempDir, { recursive: true, force: true });
                return res.status(400).json({
                    error: 'package.json not found in the repository.',
                });
            }
            
            const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
            const packageJson = JSON.parse(packageJsonContent);
            const package_name = packageJson.name;

            const zip = new AdmZip();
            zip.addLocalFolder(tempDir);

            // Get the zip content as a buffer
            const zipBuffer = zip.toBuffer();

            // Encode the zip buffer as Base64
            const base64Zip = zipBuffer.toString('base64');

            // Log or use the extracted information as needed
            console.log('Package Name:', package_name);

            fs.rmSync(tempDir, { recursive: true, force: true });
            const pkg = await db.getPackagesByNameOrHash(package_name, Package);
            if (pkg[0] == true) { // if the package already exists, just return the score
                logger.info(`Package ${package_name} already exists with score: ${pkg[1]["score"]}`);
                const version = pkg[1]["version"];
                const packageId = SHA256(package_name + version).toString();
                const jsonResponse = {
                    metadata: {
                        Name: package_name,
                        Version: version,
                        ID: packageId,
                    },
                    data: {
                        Content: Content,
                        JSProgram: JSProgram || '',
                    },
                };
                return res.status(409).send(jsonResponse);
            } else {
                const [package_rating, package_net] = await rate(URL);
                let version = packageJson.version;
                if(version == null || version == "") {
                    version = '1.0.0';
                }
                const packageId = SHA256(package_name + version).toString();
                const jsonResponse = {
                    metadata: {
                        Name: package_name,
                        Version: version,
                        ID: packageId,
                    },
                    data: {
                        Content: base64Zip,
                        URL: URL,
                        JSProgram: JSProgram || '',
                    },
                };
                if (package_net >= 0.5) {
                    await s3.uploadContentToS3(base64Zip, packageId);
                    const result = await db.addNewPackage(package_name, URL, Package, packageId, package_rating, version, package_net, "URL");
                    if (result[0] == true) {
                        logger.info(`Package ${package_name} uploaded with score: ${package_rating}`);
                        return res.status(201).send(jsonResponse);
                    } else {
                        logger.error(`Error uploading package:`, package_name);
                        return res.status(500).send('Error uploading package');
                    }
                } else {
                    logger.info(`Package ${package_name} rating too low: ${package_rating}`);
                    return res.status(424).send('Package rating too low');
                }
            }
        } catch (error) {
            logger.error(`Error uploading package:`, error);
            console.log(error);
            return res.status(500).send('Error uploading package');
        }
    }
    
});

/**
 * @swagger
 * /rate/{url}:
 *      post:
 *          summary: Rates a package
 *          parameters:
 *              - name: url
 *                in: path
 *                required: true
 *                schema:
 *                  type: string
 *                description: The URL of the package to rate
 *          responses:
 *              200:
 *                  description: Package rated successfully   
 *                  content:
 *                      text/plain:
 *                        schema:
 *                          type: number
 *                          description: The score of the package
 *              500:
 *                  description: Error rating package
 */
app.get('/package/:id/rate', async (req, res) => {
    const authToken = req.headers['X-Authorization'] || req.headers['x-authorization'];
    if(authToken == '' || authToken == null) {
        logger.error('Missing Authentication Header');
        return res.status(403).send('Missing Authentication Header');
    }
    if (authToken != monkeyBusiness) {
        logger.error('You do not have the correct permissions to delete the database.');
        return res.status(403).send('You do not have the correct permissions to delete the database.');
    }
    const packageId = req.params.id;
    if(packageId == '' || packageId == null) {
        logger.error('Missing package ID');
        return res.status(400).send('Missing package ID');
    }
    const pkg = await db.getPackagesByNameOrHash(packageId, Package);
    if(pkg[0] == false) {
        logger.error('Package not found');
        return res.status(404).send('Package not found');
    }
    const scoreObject = JSON.parse(pkg[1]["score"]);
    const nullFields = Object.keys(scoreObject).filter(key => scoreObject[key] === null);
    if(nullFields.length > 0) {
        logger.error('Package rating choked');
        return res.status(500).send('Package rating choked');
    }
    const jsonResponse = {
        BusFactor: scoreObject["BusFactor"],
        BusFactorLatency: scoreObject["BusFactorLatency"],
        Correctnesss: scoreObject["Correctness"],
        CorrectnessLatency: scoreObject["Correctness_Latency"],
        RampUp: scoreObject["RampUp"],
        RampUpLatency: scoreObject["RampUp_Latency"],
        ResponsiveMaintainer: scoreObject["ResponsiveMaintainer"],
        ResponsiveMaintainerLatency: scoreObject["ResponsiveMaintainer_Latency"],
        LicenseScore: scoreObject["License"],
        LicenseScoreLatency: scoreObject["License_Latency"],
        GoodPinningPractice: scoreObject["GoodPinningPractice"],
        GoodPinningPracticeLatency: scoreObject["GoodPinningPractice_Latency"],
        PullRequest: scoreObject["PullRequest"],
        PullRequestLatency: scoreObject["PullRequest_Latency"],
        NetScore: scoreObject["NetScore"],
        NetScoreLatency: scoreObject["NetScore_Latency"],
    };
    return res.status(200).send(jsonResponse);
});

app.put('/authenticate', async (req, res) => {
    try {
        const { User, Secret } = req.body;
    
        // Validate request structure
        if (
          !User ||
          typeof User.name !== 'string' ||
          typeof User.isAdmin !== 'boolean' ||
          !Secret ||
          typeof Secret.password !== 'string'
        ) {
          return res.status(400).json({ error: 'Malformed AuthenticationRequest' });
        }
    
        const { name, isAdmin } = User;
        const { password } = Secret;
    
        // Hash the provided password using SHA-256
        const hashedPassword = SHA256(password).toString()
        
        let x = "";
        // Query the database for the user
        const [found, user] = await db.getUserByName(name, UserModel);
        if(!found) {
          return res.status(401).json({ error: 'Invalid username' });
        }
        if(user.userHash !== hashedPassword) {
          return res.status(401).json({ error: 'Invalid password' });
        }
        if(user.isAdmin == true) {
            x = "isAdmin=1";
        } else {
            x = "isAdmin=0";
        }
        console.log(user.isAdmin);
        const hashh = SHA256(x).toString();
        const authToken = `bearer ${hashh}`;
        return res.status(200).json({ authToken: `"${authToken}"` });
      } catch (error) {
        console.error(error);
        return res.status(400).json({ error: 'Bad Request' });
      }
});


app.get('/package/:id', async (req, res) => {
    try {
        const token = req.headers['X-Authorization'] || req.headers['x-authorization']
        if (token == '' || token == null) { 
            logger.info('Authentication failed due to invalid or missing AuthenticationToken');
            return res.status(403).send('Authentication failed due to invalid or missing AuthenticationToken');
        } else if (token != monkeyBusiness) {
            logger.info(`Authentication failed due to insufficient permissions`);
            return res.status(403).send(`Authentication failed due to insufficient permissions`);
        }
        const packageID = req.params.id;
        if (!packageID || typeof packageID !== 'string') {
            logger.info('There is missing field(s) in the PackageID or it is iformed improperly, or it is invalid.');
            return res.status(400).send('There is missing field(s) in the PackageID or it is iformed improperly, or it is invalid.');
        }
        
        const packageInfo = await db.getPackagesByNameOrHash(packageID, Package);
        if (!packageInfo[0]) {
            return res.status(404).send('Package not found: ' + packageInfo[1]);
        }

        const packageContent = s3.requestContentFromS3(packageID);

        logger.info('Successfully retrieved package content and info');
        return res.status(200).json({ package: packageContent, info: packageInfo[1] });

    } catch (error) {
        logger.error(error);
        return res.status(400).json({ error: 'Bad Request' });
    }

});


app.post('/package/:id', async (req, res) => {
    try {
        
    } catch (error) {
        logger.error(error);
        return res.status(400).json({ error: 'Bad Request' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


