/*	---- Item Code Start
 *	Structure representing the board in the grid game
 */
var Item = function (type) {
	this.type = type;
};

// Constants for items
Item.NAMES = [
	'None',
	'Bone',
	'Flower'
	// TODO: add more items as needed
];
Item.DESC = [
	'No description.',
	'A bone to be picked up and placed elsewhere.',
	'A flower used to assemble a boquet.'
	// TODO: add more descriptions as needed
];
Item.IMG_PREFIX = '/client/assets/item/';

// Getters
Item.prototype.getName = function () {
	return Item.NAMES[this.type];
};

Item.prototype.getDesc = function () {
	return Item.DESC[this.type];
};

Item.prototype.getImagePath = function () {
	return Item.IMG_PREFIX + this.type + '.png';
};

/*	---- Grid Code Start
 *	Structure representing the board in the grid game
 */
var GridBoard = {};

/*	Notes on levelJSON:
 *		- Must have width and height fields that specify the board size
 *		- Must have a board field that matches the board size
 *			+ Must be a 2D array of squares that have properties
 *				- background: an integer representing what kind of background to display
 *				- item: an integer representing what kind of item is here
 *				- hasWall: array of booleans for walls in the cardinal directions
 *				- isEnd: true if the square is a winning square to end on
 */

// Loads the GridBoard with supplied level JSON object. See above for specs
// on what the object looks like. Should be loaded from an API call to server.
GridBoard.load = function (levelJSON) {
	GridBoard.levelJSON = levelJSON;
	GridBoard.reset();
};

// Resets the board back to normal in a level
GridBoard.reset = function() {
	// Clear out board
	GridBoard.board = [];
	for (var i = 0; i < GridBoard.levelJSON.width; i++) {
		GridBoard.board[i] = [];
		for (var j = 0; j < GridBoard.levelJSON.height; j++) {
			// Initialize each square on the grid
			var squareData = GridBoard.levelJSON.board[i][j];
			GridBoard.board[i][j] = {
				background: squareData.background,
				item: squareData.itemType < 0 ? null : new Item(squareData.itemType),
				hasWall: squareData.hasWall,
				isEnd: squareData.isEnd
				// TODO: add other properties of a square on the grid and load from
				// levelJSON
			};
		}	
	}
};

// Gets the item at a given location, if any
GridBoard.getItemAtLoc = function (loc) {
	if (loc.x >= 0 && loc.x < GridBoard.levelJSON.width && loc.y >=0 && 
			loc.y < GridBoard.levelJSON.height) {
		return GridBoard.board[loc.x][loc.y].item;
	}
	return null;
};

// Removes an item from the grid, if any
GridBoard.removeItemAtLoc = function (loc) {
	if (loc.x >= 0 && loc.x < GridBoard.levelJSON.width && loc.y >=0 && 
			loc.y < GridBoard.levelJSON.height) {
		GridBoard.board[loc.x][loc.y].item = null;
	}
};

// Places an item onto the grid, if possible
GridBoard.placeItemAtLoc = function (loc, item) {
	if (loc.x >= 0 && loc.x < GridBoard.levelJSON.width && loc.y >=0 && 
			loc.y < GridBoard.levelJSON.height && 
			GridBoard.board[loc.x][loc.y].item == null) {
		GridBoard.board[loc.x][loc.y].item = item;
	}
};

// Checks if a location on the grid is legally in bounds
GridBoard.checkIsLegalLoc = function (loc) {
	return loc.x >= 0 && loc.x < GridBoard.levelJSON.width && loc.y >=0 && 
			loc.y < GridBoard.levelJSON.height;
};

/*	---- Pet Code Start ----
 *	Structure representing the pet Avatar in the grid game
 */
var GridPet = {};

// Directions
var DIR_UP = 0;
var DIR_RIGHT = 1;
var DIR_DOWN = 2;
var DIR_LEFT = 3;

// Initializes the represented pet with given stats
GridPet.init = function (speed, strength, sight, happiness, fatigue) {
	GridPet.speed = speed;
	GridPet.strength = strength;
	GridPet.sight = sight;
	GridPet.happiness = happiness;
	GridPet.fatigue = fatigue;
	GridPet.reset();
};

// Resets the pet to an empty inventory and a position 0,0 facing upwards
GridPet.reset = function () {
	GridPet.dir = DIR_UP;
	GridPet.pos = {
		x: 0,
		y: 0
	};
	GridPet.inventory = [];
};

// Sets the pet's position to a given position
GridPet.setPos = function (pos) {
	GridPet.pos.x = pos.x;
	GridPet.pos.y = pos.y;
};

// Sets the direction that the pet faces
GridPet.setDir = function (dir) {
  GridPet.dir = dir;
}

/*
 *	Commands for basic actions a pet can perform on the grid. All commands
 * 	should move the pet and perform the appropriate animations and state
 *	changes, calling the callback on completion if any.
 */
 
// Debug flag turns on or off verbose printing during execution
var DEBUG = true;

GridPet.move = function (callback) {
	var canMove = true;
	var afterAnimation = function() {
		// TODO: set canMove appropriately as needed
		// TODO: animate move
		// On complete
		if (canMove) {
			GridPet.pos = getPosInDir(GridPet.pos, GridPet.dir, 1);
			if (DEBUG) {console.log('Moved to ['+GridPet.pos.x+', '+GridPet.pos.y+']');}
			if (callback) {
				callback();
			}
		}
	}

	GameDrawingUtil.animateMove(GridPet, canMove, afterAnimation);
	
};

GridPet.turnLeft = function (callback) {
	// TODO: animate turn
	// On complete
	var afterAnimation = function() {
		GridPet.dir = (GridPet.dir == DIR_UP) ? DIR_LEFT : (GridPet.dir - 1);
		if (DEBUG) {console.log('Turned to dir '+GridPet.dir);}
		if (callback) {
			callback();
		}
	}

	GameDrawingUtil.animateTurnLeft(GridPet, afterAnimation);
};

GridPet.turnRight = function (callback) {
	// TODO: animate turn
	// On complete
	var afterAnimation = function() {
		GridPet.dir = (GridPet.dir == DIR_LEFT) ? DIR_UP : (GridPet.dir + 1);
		if (DEBUG) {console.log('Turned to dir '+GridPet.dir);}
		if (callback) {
			callback();
		}
	}
	GameDrawingUtil.animateTurnRight(GridPet, afterAnimation);
};

GridPet.pickUp = function (callback) {
	// TODO: handle max inventory space
	var canPickup = GridBoard.getItemAtLoc(GridPet.pos) != null;
	// TODO: animate either pickup or failure to pickup

	var afterAnimation = function() {
		if (canPickup) {
			// Pick up item and remove it from the map
			var item = GridBoard.getItemAtLoc(GridPet.pos);
			GridBoard.removeItemAtLoc(GridPet.pos)
			GridPet.inventory.push(item);
			if (DEBUG) {console.log('Picked up item '+item.type);}
		}
		if (callback) {
			callback();
		}
	};
	
	GameDrawingUtil.animatePickup(GridPet, canPickup, afterAnimation);
};

GridPet.drop = function (callback) {
	var canDrop = GridBoard.getItemAtLoc(GridPet.pos) == null && 
			GridPet.inventory.length > 0;
	// TODO: animate either drop or failure to drop
	if (canDrop) {
		var item = GridPet.inventory.pop();
		GridBoard.placeItemAtLoc(GridPet.pos, item);
		if (DEBUG) {console.log('Dropped item '+item.type);}
	}
	if (callback) {
		callback();
	}
}

/*	Commands for basic conditionals that the pet can check. These do not have
 *	animations (as this would become complex).
 */
 
// Scans for a wall up to a certain distance in a direction. If the scan hits a
// boundary of the grid, it will report a wall as well
GridPet.checkForWall = function (direction, distance) {
	if (DEBUG) {console.log('Checked for wall in dir '+direction+' with dist '+distance);}
	var oppositeDir = (distance + 2) % 4;
	for (var i = 0; i < distance; i++) {
		var locToCheck = getPosInDir(GridPet.pos, direction, distance);
		// If scan goes off the edge of the board, report as wall
		if (!GridBoard.checkIsLegalLoc(locToCheck)) {
			return true;
		}
		var wallArray = GridBoard.board[locToCheck.x][locToCheck.y].hasWall;
		if ((i == 0 && wallArray[direction]) || (i != 0 && (wallArray[direction] || 
				wallArray[oppositeDir]))) {
			return true;
		}
	}
	return false;
};
 
// Scans for an item up to a certain distance in a direction. -1 for type
// denotes check for any object
GridPet.checkForObject = function (type, direction, distance) {
	if (DEBUG) {console.log('Checked for obj '+type+' in dir '+direction+' with dist '+distance);}
	for (var i = 1; i <= distance; i++) {
		var locToCheck = getPosInDir(GridPet.pos, direction, distance);
		if (!GridBoard.checkIsLegalLoc(locToCheck)) {
			return false;
		} else if (GridBoard.board[locToCheck.x][locToCheck.y].item != null && 
				(type == -1 || 
				GridBoard.board[locToCheck.x][locToCheck.y].item.type == type)) {
			return true;
		}
	}
	return false;
};

// Called at the end of an execution run. Contains code to check for win
// conditions after all pages are run
GridPet.runComplete = function () {
	$('#dog').spStop(true);
	if (DEBUG) {console.log('End run');}
	// TODO: fill in end game eval code
};

/*
 *	Helper Functions
 */
 
var getPosInDir = function (position, dir, distance) {
	var xOrigin = position.x; 
	var yOrigin = position.y;
	if (dir == DIR_UP) {
		return {
			x: xOrigin,
			y: yOrigin - distance
		};
	} else if (dir == DIR_RIGHT) {
		return {
			x: xOrigin + distance,
			y: yOrigin
		};
	} else if (dir == DIR_DOWN) {
		return {
			x: xOrigin,
			y: yOrigin + distance
		};
	} else if (dir == DIR_LEFT) {
		return {
			x: xOrigin - distance,
			y: yOrigin
		};
	}
};