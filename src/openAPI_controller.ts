import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import * as util from './utils';
import { metric_manager } from './metric_manager';
import * as db from './database_test';


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
                }
        }
    },
    apis: ['./src/*.ts'], // where the doc strings are located to automatically generate API documentation
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


app.post('/upload/:url', (req, res) => {
    // need to add error catching and make sure codes are correct
    try {
        const url = req.params.url;
        const package_name = util.extractPackageName(url);
        db.addNewPackage(package_name, url);
        // const rating = getRating(url);
        // if (rating >= 0.5) {
        //     const version = util.extractPackageVersion(url);
        //     db.addNewPackage(package_name, url, version, rating);
        // } else {
        //     res.status(400).send('Package rating is too low.');
        //     console.log('Package rating is too low.');
        // }
        res.status(200).send('Package uploaded successfully');
    } catch (error) {
        console.error(`Error uploading package:`, error);
        res.status(500).send('Error uploading package');
    }
});

app.post('/rate/:url', (req, res) => {
    try {
        const url = req.params.url;
        // const rating = x.getRating(url);
        // if (rating[0] != -1) { assuming rating[0] is net or something
        //  res.json({rating: rating})
        // }
        res.status(200).send('Package rated successfully');

    } catch (error) {
        console.error(`Error rating package:`, error);
        res.status(500).send('Error rating package');
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});