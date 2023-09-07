// Import required Node.js modules and packages
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const express = require('express');
const {v4: uuid} = require('uuid');
const {promisify} = require('util');
const httpStatus = require('http-status');
const jsonFileDB = require("@webcoader/jsonfiledb");

// Create an instance of the Express application
const app = express();

// Specify the port the server will listen on
const port = 3000;

// Enable Cross-Origin Resource Sharing (CORS) for the Express app
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static('public'));

// Initialize a JSON file database
const db = jsonFileDB('database');
db.setStorage("files");

const getFilePath = (fileId, fileExt) => {
    return path.join(__dirname, 'uploads', `${fileId}.${fileExt}`);
};

const getFileDetails = promisify(fs.stat);

//Define API endpoints for initiating new file upload request
app.post('/requestFileUpload', async (req, res) => {

    //Fetch the request body
    const requestBody = req.body;

    // Validate the request body
    if (!requestBody || !requestBody.fileName) {
        res.status(httpStatus.BAD_REQUEST).json({
            error: 'Invalid request body'
        });
        return;
    }

    // Generate file ID & create write stream
    const fileId = uuid();
    const filePath = getFilePath(fileId, requestBody.fileExt);
    fs.createWriteStream(filePath);

    //Save the file metadata in the database
    const fileRecord = await db.insert({
        id: fileId,
        name: requestBody.fileName,
        ext: requestBody.fileExt,
        path: filePath,
        size: 0,
        uploadedAt: new Date().toISOString(),
        status: 'initiated'
    });

    delete fileRecord.path;

    //Send the response
    res.status(httpStatus.OK).json(fileRecord);

});

//Define API endpoints for getting file upload status
app.get('/getFileStatus', async (req, res) => {

    try {
        //Fetch the request query parameters
        const fileId = req.query.fileId;

        // Validate the request query parameters
        if (!fileId) {
            res.status(httpStatus.BAD_REQUEST).json({
                error: 'Invalid request query parameters'
            });
            return;
        }

        //Fetch the file record from the database
        const fileRecord = await db.find({id: fileId});

        //Validate the file record
        if (!fileRecord) {
            res.status(httpStatus.NOT_FOUND).json({
                error: 'File not found'
            });
            return;
        }

        //Prepare file data object
        const fileData = fileRecord[0];

        //Fetch the file stats
        const fileStats = await getFileDetails(fileData.path);

        //Remove the file path from the file data object
        delete fileData.path;

        //Update the file record in the database if size has changed
        if (fileData.size !== fileStats.size) {
            db.update(
                {id: fileId},
                {size: fileStats.size}
            );
            fileData.size = fileStats.size;
        }

        //Send the success response
        res.status(httpStatus.OK).json(fileData);

    } catch (error) {
        //Send the error response
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            error: error.message
        });
    }

});

// Start the Express server and listen on the specified port
app.listen(port, () =>
    console.log(`App is listening on port http://localhost:${port}`)
);
