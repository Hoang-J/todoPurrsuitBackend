-- table for logininfo to keep track of new users information
CREATE TABLE logininfo (
    id SERIAL PRIMARY KEY,
    email VARCHAR(50),
    password VARCHAR(100),
    username VARCHAR(50),
    firstname VARCHAR(50),
    lastname VARCHAR(50)
);


INSERT INTO logininfo (email, password, username, firstname, lastname)
VALUES ('justinladams88@gmail.com', 'justin123', 'goodjuju', 'Justin', 'Adams');


-- table for the leaderboard to keep scores
CREATE TABLE leaderboard (
    playerid SERIAL NOT NULL,
    username VARCHAR(50),
    score INTEGER
);

INSERT INTO leaderboard (username, score)
VALUES ('goodjuiju', '30');