import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import * as util from './utils.js';
import * as db from './database';
import { rate } from './rate.js';
import cors from 'cors';
import logger from './logging.js';
import dotenv from 'dotenv';
// import * as userDB from './userDB.js';
import SHA256 from 'crypto-js/sha256';

const packageDB = db.connectToMongoDB("Packages");
const userDB = db.connectToMongoDB("Users");

// console.log(packageDB);
const Package = packageDB[1].model('Package', db.packageSchema);
const UserModel = userDB[1].model('User', db.userSchema);
const app = express();
app.use(express.json()); // parse incoming requests with JSON payloads

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
    const authToken = req.headers['X-Authorization'];
    if (!authToken) {
        logger.error('There is missing field(s) in the AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid.');
        res.status(400).send('There is missing field(s) in the AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid.');
    } else {
        try {
            const result = await db.deleteDB(packageDB[1]);
            if (result[0] == true) {
                logger.info('Registry is reset.');
                res.status(200).send('Registry is reset.');
            } else {
                logger.error('Error deleting database:', result[1]);
                res.status(500).send('Error deleting database');
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
app.post('/upload/:url', async (req, res) => {
    try {
        const url = req.params.url;
        const package_name = await util.extractPackageName(url);
        if (package_name == null) {
            logger.debug('Could not get package name');
            res.status(500).send('Could not get package name');    
        }
        const pkg = await db.getPackageByName(package_name, Package);
        if (pkg[0] == true) { // if the package already exists, just return the score
            logger.info(`Package ${package_name} already exists with score: ${pkg[1]["score"]}`);
            res.status(200).send(pkg[1]["score"].toString());
        } else {
            const [package_rating, package_net] = await rate(url);
            if (package_net >= 0.5) {
                const result = await db.addNewPackage(package_name, url, Package, package_rating);
                if (result[0] == true) {
                    logger.info(`Package ${package_name} uploaded with score: ${package_rating}`);
                    res.status(200).send(package_rating.toString());
                } else {
                    logger.error(`Error uploading package:`, package_name);
                    res.status(500).send('Error uploading package');
                }
            } else {
                logger.info(`Package ${package_name} rating too low: ${package_rating}`);
                res.status(403).send('Package rating too low');
            }
        }
    } catch (error) {
        logger.error(`Error uploading package:`, error);
        res.status(500).send('Error uploading package');
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
app.get('/rate/:url', async (req, res) => {
    try {
        const url = decodeURIComponent(req.params.url);
        const package_name = await util.extractPackageName(url);
        if (package_name == null) {
            logger.error('Could not get package name');
            res.status(500).send('Could not get package name');
        }
        const pkg = await db.getPackageByName(package_name, Package);
        if (pkg[0] == true) { // if the package already exists, just return the score
            logger.info(`Package ${package_name} already exists with score: ${pkg[1]["score"]}`); 
            res.status(200).send(pkg[1]["score"].toString());
        } else {
            const [package_rating, package_net] = await rate(url);
            logger.info(`Package ${package_name} rated with score: ${package_rating}`);
            res.status(200).send(package_rating.toString());
        }
    } catch (error) {
        logger.error(`Error rating package:`, error);
        res.status(500).send('Error rating package');
    }
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



