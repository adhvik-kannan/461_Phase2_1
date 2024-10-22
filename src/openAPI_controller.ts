import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import * as util from './utils';
import * as db from './database_test';
import { rate } from './rate';
import logger from './logging';


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
                    url: 'http://localhost:3000', // server URL - temporary
                },
                {
                    url: 'https://aws-web-server-here', // where serve will be hosted
                }]
        }
    },
    apis: ['./src/*.ts'], // where the doc strings are located to automatically generate API documentation
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


app.delete('/delete', async (res) => {
    try {
        const result = await db.deleteDB();
        if (result[0] == true) {
            res.status(200).send('Database deleted successfully');
        } else {
            res.status(500).send('Error deleting database');
        }
    } catch (error) {
        logger.error('Error deleting database:', error);
        res.status(500).send('Error deleting package');
    }
});

app.post('/upload/:url', async (req, res) => {
    try {
        const url = req.params.url;
        const package_name = await util.extractPackageName(url);
        const pkg = await db.getPackageByName(package_name);
        if (pkg[0] == true) { // if the package already exists, just return the score
            res.status(200).send(pkg[1]["score"]);
        } else {
            const [package_rating, package_net] = await rate(url);
            if  (package_net >= 0.5) {
                const result = await db.addNewPackage(package_name, url, package_rating);
                if (result[0] == true) {
                    res.status(200).send(package_rating);
                } else {
                    res.status(500).send('Error uploading package');
                }
            } else {
                res.status(403).send('Package rating too low');
            }
        }
    } catch (error) {
        logger.error(`Error uploading package:`, error);
        res.status(500).send('Error uploading package');
    }
});

app.post('/rate/:url', async (req, res) => {
    try {
        const url = req.params.url;
        const package_name = await util.extractPackageName(url);
        const pkg = await db.getPackageByName(package_name);
        if (pkg[0] == true) { // if the package already exists, just return the score
            res.status(200).send(pkg[1]["score"]);
        } else {
            const [package_rating, package_net] = await rate(url);
            res.status(200).send(package_rating);
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