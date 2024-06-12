/* 
-------------------------------------------------------------------------------------------------------------------
Initializer codes to use the different npms installed
-------------------------------------------------------------------------------------------------------------------
*/


// code to use express
const express = require('express');
const app = express();

// bcrypt 
const bcrypt = require('bcrypt');


// code to use body parser to see json in res
const bodyParser = require('body-parser');
app.use(bodyParser.json());

// code to use pg-promise
const pgp = require('pg-promise')();
// using elephantSQL to make it easier between team members to access the database
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
                                                 ROOT ENDPOINT
-------------------------------------------------------------------------------------------------------------------
*/

app.get('/', async (req, res) => {
  res.send("deploy check");
})


// ----------------------------------------------LOGIN SERVER -----------------------------------------------------

/* 
-------------------------------------------------------------------------------------------------------------------
                                                 GET ENDPOINTS
-------------------------------------------------------------------------------------------------------------------
*/

/*
Endpoint: 
    GET: returns a list of users and the information they provided on the registration page; users can also log into their account by providing 2 query params (their username and password)
Query Parameters:
    username[string]: username created by user on registration
    password[string]: password provided by user on registration
*/

app.get('/login', async (req, res) => {
    let formData = await db.manyOrNone('SELECT * FROM logininfo');
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
        // return the entire list of users if a username query is not provided
        if(req.query.username == undefined) {
          res.json(formData);
        }
        // when a user provides a username aka when logging in on the login page, will go through the code in the conditional below
        else if(req.query.username != undefined){
        // declaring a global variable for later access
        let usernameFound;
        // Checking if the username exists in the database
        for(let i = 0; i < formData.length; i++) {
            if(formData[i].username == req.query.username) {
            usernameFound = true;
            break;
            }
            else {
            usernameFound = false;
            }
        }
        // once the username is found, will go through the conditionals below to match the password for each respective accounts
        if(usernameFound === true) {
          // retrieving the stored hashed password from the logininfo database
          let storedHashedPass = await db.oneOrNone('SELECT password FROM logininfo WHERE username = $1', req.query.username)
          // compare the hashed password with the password entered in during login
          // using async method because it works better on a server because of the amount of information being exchanged
          let comparePass = bcrypt.compareSync(req.query.password, storedHashedPass.password)
          // bcrypt.compareSync will return a boolean (true or false)
            if(comparePass == true) {
              res.json("loggedin")
            }
            else {
              // return res.redirect("http://localhost:3000/homepage");
              res.json("wrong password")
            }

          
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
                                                 POST ENDPOINTS
-------------------------------------------------------------------------------------------------------------------
*/
/*
Endpoint: 
    POST: creates a new user account 
Body:
    username[string](required): username of user to be added into the database
    password[string](required): password of the user to be added into the database
    email[string](required): email of the user to be added into the database
    firstname[string](required): firstname of the user to be added into the database
    lastname[string](required): lastname of the user to be added into the database
*/

app.post('/register', async function(req, res) {
    // retrieving the list of user accounts and storing it in a global variable for later access
    let formData = await db.manyOrNone('SELECT * FROM logininfo');
    // this endpoint should not have any query params since it is POST
    if(Object.keys(req.query).length > 0) {
      clientError(req, "Query not permitted at this endpoint", 400);
      res.status(400).json({error: "Query not permitted at this endpoint"});
    }
    else{
      if(req.body != undefined){
        let userExist;
        // looping through the account list stored inside the formData variable 
        // checking if there is already an account that exists with the username provided
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
          // if username does not exist in the database yet, will create a new account with the information user provided and store it inside the database
          // using bcrypt to hash personal information such as the password for security sake
            const saltRounds = 10;
            let password = req.body.password;
            // take the password from the body and salt it 10 times
            bcrypt.hash(password, saltRounds)
            .then(hash => {
              // inserting the user information provided on the registration page into the logininfo database
              // take the hashed password and store it into the logininfo database
              db.none('INSERT INTO logininfo (email, password, username, firstname, lastname) VALUES($1, $2, $3, $4, $5)', [req.body.email, hash, req.body.username, req.body.firstname, req.body.lastname]);
          })
          .catch(err => console.error(err.message));
  
          // console.log(req.body.firstname)
          // alert("Successfully signed up!");
          // return res.redirect("");
          res.json("user registered")
        }
      } 
    }
  });

// ----------------------------------------------SCOREBOARD SERVER ------------------------------------------------

/* 
-------------------------------------------------------------------------------------------------------------------
                                                 GET ENDPOINTS
-------------------------------------------------------------------------------------------------------------------
*/

/*
Endpoint: 
    GET: returns a list of players and their scores on the leaderboard; if a playerid, username, or score is provided, only a players with the corresponding value are returned
Query Parameters:
    playerid[number]: assigned number of the player
    username[string]: name chosen by the player
    score[number]: player point total based on levels completed in-game
*/

app.get('/score', async (req, res) => {
  let scoreboard = await db.any('SELECT * FROM leaderboard');
  if(Object.keys(req.body).length != 0) {
      clientError(req, "Request body is not permitted", 400);
      // check if a body was provided in the request
      res.status(400).json({
          error: "Request body is not permitted"
      });
  } else if((Object.keys(req.query).length != 0) && (Object.keys(req.query)[0] != "playerid" && Object.keys(req.query)[0] != "username" && Object.keys(req.query)[0] != "score")) {
      clientError(req, "Query parameters do not meet requirements", 400);
      // checks if parameters other than id, name, etc. are passed
      res.status(400).json({
          error: "Query parameters do not meet requirements"
      });
  } else if(isNaN(req.query.playerid) && req.query.playerid != undefined) {
      clientError(req, "Query Parameter is NaN", 400);
      // checks to make sure that the id is a number
      res.status(400).json({
          error: "Query Parameter is NaN"
      });
  } else {
      if(req.query.playerid == undefined && req.query.username == undefined && req.query.score == undefined) {
          // check if an id was passed or not from the client
          // if not, return all events
          res.json(scoreboard)
      } else if(req.query.playerid !== undefined) {
          // selects data using image parameter
          let playerid = req.query.playerid;
          let leaderboardId = await db.query('SELECT * FROM leaderboard WHERE playerid = $1', [playerid])
          res.json(leaderboardId);
      } else if(req.query.username !== undefined) {
          // selects data using username parameter
          let username = req.query.username;
          let leaderboardName = await db.query('SELECT * FROM leaderboard WHERE username = $1', [username])
          res.json(leaderboardName);
      } else if(req.query.score !== undefined) {
          // selects data using location parameter
          let score = req.query.score;
          let leaderboardScore = await db.query('SELECT * FROM leaderboard WHERE score = $1', [score])
          res.json(leaderboardScore);
      }
  }
})


/* 
-------------------------------------------------------------------------------------------------------------------
                                                 POST ENDPOINTS
-------------------------------------------------------------------------------------------------------------------
*/

/*
Endpoint: 
    POST: creates a new entry on the leaderboard for a new player and/or score
Body:
    username[string](required): username of player to be added
    score[number](required): score the player earned in the game
*/

app.post('/score', async (req, res) => {
  if((!req.body|| typeof(req.body) !== 'object') || (!'username' in req.body || typeof(req.body.username) !== 'string') || (!'score' in req.body || typeof(req.body.score) !== 'number')){
      res.statusCode = 400
      res.json({error: "Invalid body Parameters"})
  } else {
      console.log(req.body)
      const { username, score } = req.body
      let newBoard = await db.one('INSERT INTO leaderboard(username, score) VALUES($1, $2) RETURNING *', [username, score]);
      res.json(newBoard);
  }
})


/* 
-------------------------------------------------------------------------------------------------------------------
                                                 PATCH ENDPOINTS
-------------------------------------------------------------------------------------------------------------------
*/

/*
Endpoint: 
    PATCH: updates a value of a leaderboard entry; if a username is provided, only entries with that username are returned
Query Parameters:
    username[string]: name of the player on the leaderboard
Body:
    name[string](required): username of player to be updated
    score[number](required): point value to be updated based on game level completion
*/
app.patch('/score/:username', async (req, res) => {
  if((!req.body || typeof(req.body) !== 'object') || (!'username' in req.body || typeof(req.body.username) !== 'string') || (!'score' in req.body || typeof(req.body.score) !== 'number')){
      res.statusCode = 400
      res.json({error: "Invalid body Parameters"})
  } else {
      const usernameInput = req.params.username;
      console.log(usernameInput);
      const {username, score} = req.body;
      let scoreBoard = await db.oneOrNone(`UPDATE leaderboard SET username = $1, score = $2 WHERE username = $3 RETURNING *`, [username, score, usernameInput]);
      res.json(scoreBoard);
  }
})


/* 
-------------------------------------------------------------------------------------------------------------------
                                                 DELETE ENDPOINTS
-------------------------------------------------------------------------------------------------------------------
*/

/*
Endpoint: 
    DELETE: deletes a leaderboard entry; if a name is provided, only entries with that name are deleted
Query Parameters:
    username[string]: name of the player on leaderboard
*/
app.delete('/score/:username', async (req, res) => {
  if(Object.keys(req.body).length != 0) {
      clientError(req, "Request body is not permitted", 400);
      // check if a body was provided in the request
      res.status(400).json({
          error: "Request body is not permitted"
      });
  } else {
      const usernameInput = (req.params.username);
      let scoreDelete = await db.query('DELETE FROM leaderboard WHERE username = $1 RETURNING *', [usernameInput]);
      res.json(scoreDelete);
  }
})


/* 
-------------------------------------------------------------------------------------------------------------------
                                                 APP.LISTEN
-------------------------------------------------------------------------------------------------------------------
*/

// To run server on port 5000
app.listen(5000, () => {
  console.log("Server is running on port 5000");
})

module.exports = app;