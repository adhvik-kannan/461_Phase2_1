import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { metric_manager } from './metric_manager';

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

app.post('/upload/:url/:version', (req, res) => {
    const url = req.params.url;
    const version = req.params.version;
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});