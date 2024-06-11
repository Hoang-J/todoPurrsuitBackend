const pg = require('pg-promise')();
const db = pg("postgres://tlfinihp:d6pjYPQkXxUBwASmDSV5bnmzpr8uXviv@raja.db.elephantsql.com/tlfinihp")
const express = require('express');
const winston = require('winston');

const app = express()
const bodyParser = require("body-parser") // for parsing application/json
app.use(bodyParser.json())

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      // - Write all logs with importance level of `error` or less to `error.log`
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      // - Write all logs with importance level of `info` or less to `combined.log`
      new winston.transports.File({ filename: 'combined.log' }),
    ],
  });

function clientError(req, message, errorCode) {
    logger.log({
        level: "info",
        endpoint: req.path,
        method: req.method,
        query_parameters: req.query,
        path_parameters: req.params,
        body: req.body,
        ip: req.ip,
        errorCode: errorCode,
        message: message,
        timestamp: new Date(),
    })
}

/*
Middleware:
    Creates a log for every API call
*/
let clientID = 0;
app.all('/*', (req, res, next) => {
    clientID++;
    logger.log({
        level: "info",
        endpoint: req.path,
        method: req.method,
        query_parameters: req.query,
        path_parameters: req.params,
        body: req.body,
        ip: req.ip,
        // errorCode: 400,
        timestamp: new Date(),
    });
    next();
})

// ----------------------------------------------------- GET ENDPOINT ------------------------------------------------

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


// ----------------------------------------------------- POST ENDPOINT ------------------------------------------------
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


// ----------------------------------------------------- PATCH ENDPOINT ------------------------------------------------
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

// ----------------------------------------------------- DELETE ENDPOINT ------------------------------------------------
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

// ----------------------------------------------------- app.listen on server 3000 ------------------------------------------------
app.listen(3000, () => {
    console.log('Server is running on port 3000')
});
