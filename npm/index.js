/* 
-------------------------------------------------------------------------------------------------------------------
Initializer codes to use the different npms installed
-------------------------------------------------------------------------------------------------------------------
*/

// code to use express
const express = require('express');
const app = express();
// path lets us work with directories and file paths
// lets us redirect to our html files from this server file based on their paths
// const path = require('path');
// bcrypt 
const bcrypt = require('bcrypt');


// code to use body parser to see json in res
const bodyParser = require('body-parser');
app.use(bodyParser.json());
// code to use body parser to parse through urlencoded (x-www-form-urlencoded) body
// form data sent from web will be body type x-www-form-urlencoded
// app.use(bodyParser.urlencoded({extended: false}))

// code to use pg-promise
const pgp = require('pg-promise')();
const db = pgp("postgres://tlfinihp:d6pjYPQkXxUBwASmDSV5bnmzpr8uXviv@raja.db.elephantsql.com/tlfinihp");

// code to use winston (error logging)
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    // - Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // - Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// function for when a client makes a error, will collect specific data regarding that error
function clientError (req, message, errorCode) {
  logger.log({
    level: 'info',
    endpoint: req.path,
    method: req.method,
    query: req.query,
    pathParameters: req.params,
    body: req.body,
    ip: req.ip,
    error: errorCode,
    message: message,
    timestamp: new Date().toUTCString(),
  });
}

// Middleware to create a log for every API call 
let clientID = 0;

app.all('/*', (req, res, next) => {
  clientID++;
  logger.log({
    level: 'info',
    endpoint: req.path,
    method: req.method,
    query: req.query,
    pathParameters: req.params,
    body: req.body,
    ip: req.ip,
    timestamp: new Date().toUTCString(),
  });
  next()
    
})

/* 
-------------------------------------------------------------------------------------------------------------------
GET endpoints
-------------------------------------------------------------------------------------------------------------------
*/

/*
Endpoint:
    
Query Parameters:
  
*/

app.get('/login', async (req, res) => {
  console.log("get endpoint called");
    let formData = await db.manyOrNone('SELECT * FROM testlogin');
    // Makes sure that there are no body parameters at this GET endpoint
    if(Object.keys(req.body).length != 0) {
        clientError(req, "Request body is not permitted at this endpoint", 400);
        res.status(400).json({error: "Request body is not permitted at this endpoint"});
    } 
    // Makes sure that user only use up to 2 query param (username and password)
    else if(Object.keys(req.query).length > 3) {
        clientError(req, "Query parameters do not meet the requirements", 400);
        res.status(400).json({error: "Query parameters do not meet the requirements length"});
    } 
    else{
        if(req.query.username != undefined){
        let usernameFound;
        // Checking if the username exists
        for(let i = 0; i < formData.length; i++) {
            if(formData[i].username == req.query.username) {
            usernameFound = true;
            break;
            }
            else {
            usernameFound = false;
            }
        }
        // Redirect user to the game page if account exists
        if(usernameFound === true) {
            // return res.redirect("http://localhost:3000/homepage");
            res.json("loggedin")
        }
        // Redirect user to the registration page if account does not exists
        else if(usernameFound === false) {
            // return res.redirect("http://localhost:3000/registerpage");
            res.json("no log in")
        }
    } 
  }
});


/* 
-------------------------------------------------------------------------------------------------------------------
POST endpoints
-------------------------------------------------------------------------------------------------------------------
*/

/*
Endpoint:
  Adds the new user information to the logins database
Body parameters:

*/

app.post('/register', async function(req, res) {
    let formData = await db.manyOrNone('SELECT * FROM testlogin');
    // console.log(formData);
    if(Object.keys(req.query).length > 0) {
      clientError(req, "Query not permitted at this endpoint", 400);
      res.status(400).json({error: "Query not permitted at this endpoint"});
    }
    else{
      if(req.body != undefined){
        let userExist;
        // console.log(req.body.username);
        // console.log(formData[0].username);
        for(let i = 0; i < formData.length; i++) {
          if(formData[i].username == req.body.username) {
            userExist = true;
            break;
          }
          else {
            userExist = false;
          }
        }
        if(userExist === true) {
          // return res.redirect("http://localhost:3000/loginpage");
          res.json("user exists")
        }
        else if(userExist === false) {
          // const password = await bcrypt.hash(req.body.password, 10);
          // const email = await bcrypt.hash(req.body.email, 10);
          // const firstName = await bcrypt.hash(req.body.firstName, 10);
          // const lastName = await bcrypt.hash(req.body.lastName, 10);
  
          await db.none('INSERT INTO testlogin(username, password) VALUES($1, $2)', [req.body.username, req.body.password]);
          // alert("Successfully signed up!");
          // return res.redirect("");
          res.json("user registered")
        }
    
      } 
    }
  
  });

// To run server on port 5000
app.listen(5000, () => {
  console.log("Server is running on port 5000");
})

