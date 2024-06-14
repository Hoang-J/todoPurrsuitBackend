CREATE TABLE logininfo (
    id SERIAL PRIMARY KEY,
    email VARCHAR(50),
    password VARCHAR(100),
    username VARCHAR(50),
    firstname VARCHAR(50),
    lastname VARCHAR(50)
);