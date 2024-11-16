import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import * as util from './utils.js';
import * as db from './database';
import { rate } from './rate.js';
import cors from 'cors';
import logger from './logging.js';
import AdmZip from 'adm-zip';
import dotenv from 'dotenv';
import SHA256 from 'crypto-js/sha256';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';
import * as s3 from './s3_utils';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// For TypeScript, you might need to cast to string
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const possibleReadmeFiles = [
    'README.md',
    'README',
    'README.txt',
    'README.rst',
    'README.markdown',
    'README.html',
];

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
dotenv.config();
// Frontend connnection setup
const FRONTEND_PORT = process.env.PORT || 3001;
app.use(cors({
    origin: `http://localhost:${FRONTEND_PORT}`, // Frontend's URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true, // If you need to send cookies or auth headers
  }));
console.log(`Frontend is running on port ${FRONTEND_PORT}`);

// Backend config setup
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || 3000;

app.listen(BACKEND_PORT, () => {
    console.log(`Server is running on port ${BACKEND_PORT}`);
});
//XXX:
console.log(`OpenAPI_controller.ts(40): ADD "PORT=${FRONTEND_PORT}" and "REACT_APP_BACKEND_PORT=${BACKEND_PORT}" to your .env or things could potentially break. Then delete this console.log.`);
console.log("Also add BACKEND_PORT to be forwarded in Vscode ports");
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
                    url: `http://localhost:${BACKEND_PORT}`,
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
    if (token != monkeyBusiness) {
        logger.error('You do not have the correct permissions to upload to the database.');
        return res.status(403).send('You do not have the correct permissions to upload to the database.');
    }
    let { Name, Content, URL, debloat, JSProgram } = req.body
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
            let readMeContent = '';
            zip.getEntries().forEach(function(zipEntry) {
                if (zipEntry.entryName.endsWith('package.json')) {
                    packageJsonEntry = zipEntry;
                }
                for (const file of possibleReadmeFiles) {
                    if (zipEntry.entryName.endsWith(file)) {
                        readMeContent = zipEntry.getData().toString('utf8');
                    }
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
                    const result = await db.addNewPackage(packageName, URL, Package, packageId, package_rating, version, package_net, "Content", readMeContent);
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
            if (URL.includes('npmjs.com')) {
                URL = await util.processNPMUrl(URL);
            }
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
            
            const readmeContent = util.findAndReadReadme(possibleReadmeFiles, tempDir);
            if(readmeContent == '') {
                logger.error('No README file found');
                return res.status(400).send('No README file found');
            }

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
                console.log(package_net);
                if (package_net >= 0.5) {
                    await s3.uploadContentToS3(base64Zip, packageId);
                    const result = await db.addNewPackage(package_name, URL, Package, packageId, package_rating, version, package_net, "URL", readmeContent);
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

// === New /package/:id/cost Endpoint ===

/**
 * @swagger
 * /package/{id}/cost:
 *   get:
 *     summary: Get the cost of a package
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the package (hashKey)
 *       - name: dependency
 *         in: query
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to include dependencies in the cost calculation
 *       - name: X-Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *         description: The authentication token
 *     responses:
 *       200:
 *         description: Returns the cost of the package and its dependencies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   standaloneCost:
 *                     type: number
 *                     description: The stand-alone cost of this package excluding dependencies. Required if `dependency=true`.
 *                   totalCost:
 *                     type: number
 *                     description: >
 *                       The total cost of the package. If `dependency=false`, it's equal to `standaloneCost`.
 *                       If `dependency=true`, it's the sum of `standaloneCost` and all dependencies' costs.
 *               example:
 *                 "357898765": {
 *                   "standaloneCost": 50.0,
 *                   "totalCost": 95.0
 *                 },
 *                 "988645763": {
 *                   "standaloneCost": 20.0,
 *                   "totalCost": 45.0
 *                 }
 *       400:
 *         description: Missing or invalid Package ID
 *       403:
 *         description: Authentication failed due to invalid or missing AuthenticationToken.
 *       404:
 *         description: Package does not exist or package.json not found.
 *       500:
 *         description: Server-side errors during cost computation.
 */
app.get('/package/:id/cost', async (req, res) => {
    // Extract Authentication Token
    const authToken = req.headers['x-authorization'] || req.headers['X-Authorization'];
    const dependencyParam = req.query.dependency;
    const dependency = dependencyParam === 'true'; // Defaults to false

    // Authentication Check
    if (!authToken) {
        logger.error('Missing Authentication Header');
        return res.status(403).send('Missing Authentication Header');
    }
    if (authToken !== monkeyBusiness) {
        logger.error('Invalid Authentication Token');
        return res.status(403).send('Invalid Authentication Token');
    }

    const packageId = req.params.id;

    // Validate Package ID
    if (!packageId || typeof packageId !== 'string') {
        logger.error('Missing or invalid Package ID');
        return res.status(400).send('Missing or invalid Package ID');
    }

    try {
        const buffer = await s3.requestContentFromS3(packageId);
        const base64Content = buffer.toString('utf8');

        const binaryContent = Buffer.from(base64Content, 'base64');

        const zip = new AdmZip(binaryContent);

        const packageJsonEntry = zip.getEntry('package.json');
        if (!packageJsonEntry) {
            logger.error(`package.json not found in package ${packageId}`);
            return res.status(404).send('package.json not found in the package.');
        }

        const packageJsonContent = packageJsonEntry.getData().toString('utf8');
        const packageJson: util.PackageJson = JSON.parse(packageJsonContent);

        const dependencies = packageJson.dependencies ? Object.keys(packageJson.dependencies) : [];

        const standaloneCost = await util.calculatePackageSize(packageId);
        const packageCost: { [key: string]: { standaloneCost?: number; totalCost: number } } = {
            [packageId]: {
                totalCost: standaloneCost,
            },
        };

        if (dependency && dependencies.length > 0) {
            for (const depId of dependencies) {
                try {
                    const depBuffer = await s3.requestContentFromS3(depId);
                    const depBase64Content = depBuffer.toString('utf8');

                    const depBinaryContent = Buffer.from(depBase64Content, 'base64');

                    const depZip = new AdmZip(depBinaryContent);

                    const depPackageJsonEntry = depZip.getEntry('package.json');
                    if (!depPackageJsonEntry) {
                        logger.error(`package.json not found in dependency package ${depId}`);
                        continue;
                    }

                    const depPackageJsonContent = depPackageJsonEntry.getData().toString('utf8');
                    const depPackageJson: util.PackageJson = JSON.parse(depPackageJsonContent);
                    const depStandaloneCost = await util.calculatePackageSize(depId);

                    packageCost[depId] = {
                        standaloneCost: depStandaloneCost,
                        totalCost: depStandaloneCost,
                    };

                    packageCost[packageId].totalCost += depStandaloneCost;
                } catch (depError) {
                    logger.error(`Error processing dependency ${depId}:`, depError);
                }
            }
        }

        return res.status(200).json(packageCost);
    } catch (error: any) {
        if (error.name === 'NoSuchKey' || error.message.includes('NotFound')) { // AWS S3 specific error for missing objects
            logger.error(`Package not found in S3: ${packageId}`);
            return res.status(404).send('Package not found in S3.');
        }
        logger.error('Error retrieving package cost:', error);
        return res.status(500).send('Server error while retrieving package cost.');
    }
});



// app.post('/package/:id', async (req, res) => {
//     try {
        
//     } catch (error) {
//         logger.error(error);
//         return res.status(400).json({ error: 'Bad Request' });
//     }
// });

/**
 * @swagger
 * /packages:
 *   post:
 *     summary: Get the packages from the registry.
 *     description: >
 *       Get any packages fitting the query. Search for packages satisfying the indicated query.
 *       If you want to enumerate all packages, provide an array with a single PackageQuery whose name is "*".
 *       The response is paginated; the response header includes the offset to use in the next query.
 *       In the Request Body below, "Version" has all the possible inputs. The "Version" cannot be a combination of the different possibilities.
 *     parameters:
 *       - in: query
 *         name: offset
 *         schema:
 *           type: string
 *         description: Provide this for pagination. If not provided, returns the first page of results.
 *       - in: header
 *         name: X-Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: Authentication token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - Version
 *                 - Name
 *               properties:
 *                 Version:
 *                   type: string
 *                   description: "Exact (1.2.3), Bounded range (1.2.3-2.1.0), Carat (^1.2.3), Tilde (~1.2.0)"
 *                 Name:
 *                   type: string
 *     responses:
 *       200:
 *         description: List of packages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Version:
 *                     type: string
 *                   Name:
 *                     type: string
 *                   ID:
 *                     type: string
 *       400:
 *         description: There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.
 *       403:
 *         description: Authentication failed due to invalid or missing AuthenticationToken.
 *       413:
 *         description: Too many packages returned.
 */

// app.post('/packages', async (req, res) => {
//     //FIXME: needs to be tweaked to add db functions 
//     const authToken = req.headers['x-authorization'] as string | undefined;
//     if (!authToken) {
//         logger.error('Missing or invalid AuthenticationToken.');
//         return res.status(403).send('Authentication failed due to invalid or missing AuthenticationToken.');
//     }

//     try {
//         const queries: PackageQuery[] = req.body;

//         // Validate that queries is a non-empty array
//         if (!Array.isArray(queries) || queries.length === 0) {
//             logger.error('Request body must be a non-empty array of PackageQuery.');
//             return res.status(400).send('There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.');
//         }

//         // Validate each query
//         for (const query of queries) {
//             if (!query.Name || !query.Version) {
//                 logger.error('Each PackageQuery must have Name and Version.');
//                 return res.status(400).send('There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.');
//             }
//             // Further validation on Version
//             const versionRegex = /^(?:\^|~)?\d+\.\d+\.\d+(?:-\d+\.\d+\.\d+)?$/;
//             if (!versionRegex.test(query.Version)) {
//                 logger.error(`Invalid version format: ${query.Version}`);
//                 return res.status(400).send('There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.');
//             }
//         }

//         // Handle the case where Name is "*"
//         if (queries.length === 1 && queries[0].Name === '*') {
//             // Enumerate all packages
//             const packages = await db.getAllPackages();
//             const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
//             const limit = 50; // Define a suitable limit

//             const paginatedPackages = packages.slice(offset, offset + limit);
//             res.setHeader('offset', (offset + limit).toString());
//             return res.status(200).json(paginatedPackages);
//         }
//         //FIXME: spec update maybe gone?
//         // Perform search based on queries
//         const result = await db.searchPackages(queries);

//         if (result.length > 1000) { // Define a suitable threshold
//             logger.warn('Too many packages returned.');
//             return res.status(413).send('Too many packages returned.');
//         }

//         // Pagination
//         const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
//         const limit = 50; // Define a suitable limit
//         const paginatedPackages = result.slice(offset, offset + limit);
//         res.setHeader('offset', (offset + limit).toString());

//         return res.status(200).json(paginatedPackages);

//     } catch (error) {
//         logger.error('Error fetching packages:', error);
//         return res.status(500).send('Error fetching packages');
//     }
// });

/*------------------ Extra APIs not in spec ------------------*/

/**
 * @swagger
 * /create-account:
 *   post:
 *     summary: Create a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               isAdmin:
 *                 type: boolean
 *             required:
 *               - username
 *               - password
 *               - isAdmin
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     isAdmin:
 *                       type: boolean
 *                     userHash:
 *                       type: string
 *                     _id:
 *                       type: string
 *                     __v:
 *                       type: number
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
app.post('/create-account', async (req, res) => {
    const { username, password, isAdmin } = req.body;

    // Validate request data
    if (!username || !password || typeof isAdmin !== 'boolean') {
        return res.status(400).json({ error: 'Invalid request data' });
    }

    // Hash the password using SHA-256
    const hashedPassword = SHA256(password).toString();

    try {
        const [success, result] = await db.addUser(username, hashedPassword, isAdmin, UserModel);
        if (success) {
            return res.status(201).json({ message: 'User created successfully', user: result });
        } else {
            return res.status(500).json({ error: 'Failed to create user', details: result });
        }
    } catch (error) {
        console.error('Error in /create-account:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

app.post('/package/byRegEx', async (req, res) => {
    // Auth heaader stuff
    const { RegEx } = req.body;
    if (!RegEx) {
        return res.status(400).json({ error: 'Malformed Request' });
    }
    const [success, packages] = await db.findPackageByRegEx(RegEx, Package);
    if (!success) {
        return res.status(500).send('Error retrieving packages');
    }
    if(packages.length == 0) {
        logger.info('No packages found');
        return res.status(404).send('No packages found');
    }
    const formattedPackages = packages.map((pkg: any) => ({
        Version: pkg.version,
        Name: pkg.name,
        ID: pkg.packageId, // Use packageId if available, fallback to id
    }));
    return res.status(200).json(formattedPackages);
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



