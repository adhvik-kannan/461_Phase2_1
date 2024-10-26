import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import * as util from './utils.js';
import * as db from './database_test.js';
import { rate } from './rate.js';
import logger from './logging.js';

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
    if (!authToken) {
        logger.error('There is missing field(s) in the AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid.');
        res.status(400).send('There is missing field(s) in the AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid.');
    } else {
        try {
            const result = await db.deleteDB();
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
            console.error('Could not get package name');
            res.status(500).send('Could not get package name');    
            return;
        }
        const pkg = await db.getPackageByName(package_name);
        if (pkg[0] == true) { // if the package already exists, just return the score
            res.status(200).send(pkg[1]["score"].toString());
            logger.info(`Package ${package_name} already exists with score: ${pkg[1]["score"]}`);
        } else {
            const [package_rating, package_net] = await rate(url);
            if (package_net >= 0.5) {
                const result = await db.addNewPackage(package_name, url, package_rating);
                if (result[0] == true) {
                    logger.info(`Package ${package_name} uploaded with score: ${package_rating}`);
                    res.status(200).send(package_rating.toString());
                    return;
                } else {
                    logger.error(`Error uploading package:`, package_name);
                    res.status(500).send('Error uploading package');
                    return;
                }
            } else {
                logger.info(`Package ${package_name} rating too low: ${package_rating}`);
                res.status(403).send('Package rating too low');
                return;
            }
        }
    } catch (error) {
        logger.error(`Error uploading package:`, error);
        res.status(500).send('Error uploading package');
        return;
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
            return;
        }
        const pkg = await db.getPackageByName(package_name);
        if (pkg[0] == true) { // if the package already exists, just return the score
            logger.info(`Package ${package_name} already exists with score: ${pkg[1]["score"]}`); 
            res.status(200).send(pkg[1]["score"].toString());
            return;
        } else {
            const [package_rating, package_net] = await rate(url);
            res.status(200).send(package_rating.toString());
            logger.info(`Package ${package_name} rated with score: ${package_rating}`);
            return;
        }
    } catch (error) {
        res.status(500).send('Error rating package');
        logger.error(`Error rating package:`, error);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});