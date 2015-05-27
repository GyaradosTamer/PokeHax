-- Specify which database to use
USE c_cs108_hzheng1;

-- Account represents each user account as well as credential information and
-- session data used to authenticate cookie sessions.
CREATE TABLE Account (
	-- The ID of the account. This is not the username. This uniquely identifies
	-- the account and should be used in all table cells referencing account.
	ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	-- The unique username of the account. This is used by users to login.
	Username VARCHAR(255) NOT NULL UNIQUE,
	-- Password hashed using SHA-1 with salt appended.
	Passhash CHAR(40) NOT NULL,
	-- Account-specific salt appended before hashing.
	Salt CHAR(32) NOT NULL,
	-- Cookie key used to hold user session.
	CookieKey CHAR(32),
	-- Expiration for the cookie key.
	CookieExp DATETIME,
	-- When the account was created.
	CreatedOn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	Currency INT NOT NULL DEFAULT 0
);

-- Pet represents each pet as well as statistics, owner data, and properties of
-- the pet.
CREATE TABLE Pet (
	-- Unique identifier for the pet
	ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	-- Non-unique user assigned name
	Name VARCHAR(255) NOT NULL,
	-- ID of the Account owning this pet
	Owner INT NOT NULL,
	FOREIGN KEY (Owner) REFERENCES Account (ID)
		ON DELETE CASCADE,
	-- Date when pet was created
	CreatedOn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	-- Species of pet (index of species)
	Species INT NOT NULL DEFAULT 0,
	-- Color of pet (index of color)
	Color INT NOT NULL DEFAULT 0,
	-- Speed of pet (default 1, can increment, affects time taken to move)
	Speed INT DEFAULT 1,
	-- Strength of pet (default 1, can increment, affects carrying capacity)
	Strength INT DEFAULT 1,
	-- Sight of pet (default 1, can increment (hard), affects sight range)
	Sight INT DEFAULT 1,
	-- Fatigue of pet (default 0, max 100, negatively affects performance)
	Fatigue INT DEFAULT 0,
	-- Happiness of pet (default 100, max changed by attentiveness, affects rewards)
	Happiness INT DEFAULT 100,
	-- Happiness cap of pet (default 100, max increased by attentiveness)
	HappinessCap INT DEFAULT 100,
	LastInteracted TIMESTAMP DEFAULT 0,
	LastGroomed TIMESTAMP DEFAULT 0,
	LastFed TIMESTAMP DEFAULT 0
);

-- Holds the worlds in the game (levels belong to worlds)
CREATE TABLE World (
	ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	-- Name of world
	Name VARCHAR(255) NOT NULL
);

-- Holds the specifications for each level
CREATE TABLE GameLevel (
	ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	-- Name of the level
	Name VARCHAR(255) NOT NULL,
	-- World this leve belongs to
	World INT NOT NULL,
	-- Whether or not this level introduces trick
	IsTrick BOOLEAN NOT NULL,
	-- Blurb description about the level
	Description VARCHAR(2000) NOT NULL,
	-- Encoded level map data with objectives
	Datablob TEXT NOT NULL
);

-- Holds each user's attempt to solve a level.
CREATE TABLE Solutions (
	ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	-- ID of the owner of this solution
	Owner INT NOT NULL,
	FOREIGN KEY (Owner) REFERENCES Account (ID)
		ON DELETE CASCADE,
	-- ID of the game level this solution was created for
	GameLevel INT NOT NULL,
	FOREIGN KEY (GameLevel) REFERENCES GameLevel (ID)
		ON DELETE CASCADE,
	-- Encoded solution (not stored in rawtext)
	Datablob TEXT NOT NULL,
	-- Stars earned by solution
	StarsEarned INT DEFAULT 0,
	-- Time it took to execute program
	TimeExecuted TIME DEFAULT 0
);

-- Holds a catalogue of all items in game
CREATE TABLE Item (
	ID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	-- Name of the item
	Name VARCHAR(255) NOT NULL,
	-- Whether the item is wearable or not
	Wearable BOOLEAN DEFAULT FALSE
	-- TODO: Add other potential properties
);

-- Holds individual instances of items that pets own
CREATE TABLE ItemInstance (
  -- ID of the item this is an instance of
	Item INT NOT NULL,
	FOREIGN KEY (Item) REFERENCES Item (ID)
		ON DELETE CASCADE, 
	-- Owner of that item
	Owner INT NOT NULL,
	FOREIGN KEY (Owner) REFERENCES Account (ID)
		ON DELETE CASCADE,
	-- Whether the item is equipped
	Worn BOOLEAN
);

-- Holds challenges made by friends
CREATE TABLE Challenge (
	-- Encoded snapshot of pet (including stats, hunger level, etc) at time
	-- of challenge
	PetSnapshotBlob TEXT NOT NULL,
	-- Code blob, just like the ones found in Solution table
	CodeBlob TEXT NOT NULL,
	-- ID of the account being challenged
	Target INT NOT NULL,
	FOREIGN KEY (Target) REFERENCES Account (ID)
		ON DELETE CASCADE,
	-- ID of the account doing the challenge
	Challenger INT NOT NULL,
	FOREIGN KEY (Challenger) REFERENCES Account (ID)
		ON DELETE CASCADE
);

-- Holds instances of users giving gifts to other users
CREATE TABLE Gift (
	-- The ID of the item being gifted
	Item INT NOT NULL,
	FOREIGN KEY (Item) REFERENCES Item (ID)
		ON DELETE CASCADE, 
	-- The ID of the sender
	Sender INT NOT NULL,
	FOREIGN KEY (Sender) REFERENCES Account (ID)
		ON DELETE CASCADE,
	-- The ID of the receiver
	Receiver INT NOT NULL,
	FOREIGN KEY (Receiver) REFERENCES Account (ID)
		ON DELETE CASCADE,
	-- Whether or not the receiver has acknowledged the gift
	Received BOOLEAN DEFAULT FALSE
);
