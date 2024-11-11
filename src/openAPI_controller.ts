import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import * as util from './utils.js';
import * as db from './database';
import { rate } from './rate.js';
import logger from './logging.js';
// import * as userDB from './userDB.js';
import SHA256 from 'crypto-js/sha256';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { BUCKET_NAME, s3, streamToBuffer } from './s3_utils.js';
import { Readable } from 'stream';

const security = '66abf860f10edcdd512e9f3f9fdc8af1bdc676503922312f8323f5090ef09a6a'

const security = '66abf860f10edcdd512e9f3f9fdc8af1bdc676503922312f8323f5090ef09a6a'

const packageDB = db.connectToMongoDB("Packages");
const userDB = db.connectToMongoDB("Users");

// console.log(packageDB);
const Package = packageDB[1].model('Package', db.packageSchema);
const UserModel = userDB[1].model('User', db.userSchema);

const app = express();
app.use(express.json()); // parse incoming requests with JSON payloads

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
    const authToken = req.headers['X-Authorization'];
    if(authToken == '' || authToken == null) {
        logger.error('Missing Authentication Header');
        res.status(403).send('Missing Authentication Header');
    }
    if (authToken != security) {
        logger.error('You do not have the correct permissions to delete the database.');
        res.status(401).send('You do not have the correct permissions to delete the database.');
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
            const result2 = await db.deleteUsersExcept(UserModel);
            if (result2[0] == true) {
                logger.info('Users are reset.');
                res.status(200).send('Users are reset.');
            } else {
                logger.error('Error deleting users:', result2[1]);
                res.status(500).send('Error deleting users');
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
        const pkg = await db.getPackage(package_name, "name", Package);
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
        const pkg = await db.getPackage(package_name, "name", Package);
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


app.get('/package/:id', async (req, res) => {
    try {
        const token = req.headers['X-Authorization'] || req.headers['x-authorization']
        // const [valid, user] = await db.getUserByHash(token, UserModel);
        if (token != security) {
            logger.info(`Authentication failed due to invalid or missing AuthenticationToken`);
            return res.status(403).send(`Authentication failed due to invalid or missing AuthenticationToken`);
        }
        const packageID = req.params.id;
        if (!packageID || typeof packageID !== 'string') {
            logger.info('There is missing field(s) in the PackageID or it is iformed improperly, or it is invalid.');
            return res.status(400).send('There is missing field(s) in the PackageID or it is iformed improperly, or it is invalid.');
        }
        
        const packageInfo = await db.getPackage(packageID, "id", Package);
        if (!packageInfo[0]) {
            return res.status(404).send('Package not found: ' + packageInfo[1]);
        }

        const getFromS3 = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: packageID,
        })

        const response = await s3.send(getFromS3);
        if (!response.Body) {
            logger.debug('Failed to retreive the package from S3');
            return res.status(500).send('Failed to retreive the package from S3');
        }

        const bodyStream = response.Body as Readable;
        const pkg = await streamToBuffer(bodyStream);

        return res.status(200).json({ package: pkg.toString(), info: packageInfo[1] });

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


