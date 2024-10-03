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
VALUES ('justinladams88@gmail.com', 'justin123', 'goodjuju', 'Justin', 'Adams'),
        ('jessiehoang18@gmail.com', 'jessie123', 'jessieeee', 'Jessie', 'Hoang')
        ('nicklazoya23@gmail.com', 'nick123', 'nicolas', 'Nick', 'Lazoya')
        ('joelluke65@gmail.com', 'joel123', 'oljoel', 'Joel', 'Luke');


-- table for the leaderboard to keep scores
CREATE TABLE leaderboard (
    playerid SERIAL NOT NULL,
    username VARCHAR(50),
    score INTEGER
);

INSERT INTO leaderboard (username, score)
VALUES ('goodjuiju', '30'),
        ('jessieeee', '30'),
        ('nicolas', '40'),
        ('oljoel', '25');