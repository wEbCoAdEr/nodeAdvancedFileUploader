// Import required Node.js modules and packages
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const express = require('express');
const {v4: uuidv4} = require('uuid');
const httpStatus = require('http-status');
const jsonFileDB = require("@webcoader/jsonfiledb");

// Create an instance of the Express application
const app = express();

// Specify the port the server will listen on
const port = 3000;

// Initialize a JSON file database
const db = jsonFileDB('database');
db.setStorage("files");

// Enable Cross-Origin Resource Sharing (CORS) for the Express app
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static('public'));

const getFilePath = (fileId) => {
    return path.join(__dirname, 'uploads', fileId);
};

//Define API endpoints for handling file uploads
app.post('request-upload', (req, res) => {
    const requestBody = req.body;
    if(!requestBody || !requestBody.fileName){
        res.status(httpStatus.BAD_REQUEST).json();
    }
});

// Start the Express server and listen on the specified port
app.listen(port, () =>
    console.log(`App is listening on port http://localhost:${port}`)
);
