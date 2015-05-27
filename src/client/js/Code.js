// Structure representing a basic code instruction. Type determines what
// instruction this block encodes
var Block = function (type) {
	this.type = type;
};

// Constants representing types of blocks
Block.UNDEF = 0;
Block.MOVE = 1;
Block.TURNLEFT = 2;
Block.TURNRIGHT = 3;
Block.PICKUP = 4;
Block.DROP = 5;

// Convert block to storable JSON format
Block.prototype.toJSON = function () {
	return {
		objClass: 'Block',
		type: this.type
	};
};

// Structure representing a sequential code segment. Type determines what
// type of page this is. Pages correspond with branches and loops in programming
var Page = function (type) {
	this.type = type;
	this.components = [];
	// Used specifically for IF/THEN for holding THEN components
	this.altComponents = [];
	this.condition = null;
	// Specific field for FOR pages; FOR pages have no condition
	this.loopCount = 0;
};

// Constants representing types of pages
Page.MAIN = 0;
Page.IFTHEN = 1;
Page.WHILE = 2;
Page.FOR = 3;

// Converts the page into a storable JSON format
Page.prototype.toJSON = function () {
	if (this.type == Page.MAIN) {
		var results = {
			objClass: 'Page',
			type: Page.MAIN,
			components: []
		};
		for (var i = 0; i < this.components.length; i++) {
			results.components.push(this.components[i].toJSON());
		}
		return results;
	} else if (this.type == Page.IFTHEN) {
		var results = {
			objClass: 'Page',
			type: Page.IFTHEN,
			condition: this.condition.toJSON(),
			components: [],
			altComponents: []
		};
		for (var i = 0; i < this.components.length; i++) {
			results.components.push(this.components[i].toJSON());
		}
		for (var i = 0; i < this.altComponents.length; i++) {
			results.altComponents.push(this.altComponents[i].toJSON());
		}
		return results;
	} else if (this.type == Page.WHILE) {
		var results = {
			objClass: 'Page',
			type: Page.WHILE,
			condition: this.condition.toJSON(),
			components: []
		};
		for (var i = 0; i < this.components.length; i++) {
			results.components.push(this.components[i].toJSON());
		}
		return results;
	} else if (this.type == Page.FOR) {
		var results = {
			objClass: 'Page',
			type: Page.FOR,
			loopCount: this.loopCount,
			components: []
		};
		for (var i = 0; i < this.components.length; i++) {
			results.components.push(this.components[i].toJSON());
		}
		return results;
	}
};

// Converts a page into executable eval JS code. If converting a MAIN page,
// the callbackCode argument is ignored. All code external to this lib should
// only convert MAIN pages and thus don't need to provide any params.
Page.prototype.toCode = function (callbackCode) {
	if (this.type == Page.MAIN) {
		return componentsToCode(this.components, 0, 'GridPet.runComplete();');
	} else if (this.type == Page.IFTHEN) {
		var randBranchFn = 'bnFn' + Math.floor(Math.random() * 1000000);
		return 'var ' + randBranchFn + ' = function() {'+callbackCode+'}; if (' + 
      this.condition.toCode() + ') {' + componentsToCode(this.components, 0, 
      randBranchFn + '();') + '} else {' + 
      componentsToCode(this.altComponents, 0, randBranchFn + '();') + '}';
    } else if (this.type == Page.WHILE) {
      var randLoopFn = 'whFn'+Math.floor(Math.random() * 1000000);
      return 'var ' + randLoopFn + ' = function() {' + 
      componentsToCode(this.components, 0, 'if (' + this.condition.toCode() + 
        '){' + randLoopFn + '();} else {' + callbackCode+'}') + '}; if (' + 
      this.condition.toCode() + '){' + randLoopFn + '();}';
} else if (this.type == Page.FOR) {
  var randLoopId = Math.floor(Math.random() * 1000000);
  var randLoopFn = 'frFn'+randLoopId;
  var randLoopCtr = 'frCtr'+randLoopId;
  return 'var ' + randLoopCtr + ' = 0; var ' + randLoopFn + 
  ' = function() {' + componentsToCode(this.components, 0, randLoopCtr + 
    '++; if (' + randLoopCtr + ' != ' + this.loopCount + '){' + randLoopFn + 
    '();}else{' + callbackCode+'}') + '}; if (' + 
    this.condition.toCode() + '){' + randLoopFn + '();}';
}
}

// Helper function to turn sequential components into sequential js code
var componentsToCode = function (components, index, callbackCode) {
	var curComponent = components[index];
	var nextComponent = index == components.length - 1 ? null : 
 components[index + 1];
 if (curComponent instanceof Block) {
  var commandName = '';
  if (curComponent.type == Block.MOVE) {
   commandName = 'move';
 } else if (curComponent.type == Block.TURNLEFT) {
   commandName = 'turnLeft';
 } else if (curComponent.type == Block.TURNRIGHT) {
   commandName = 'turnRight';
 } else if (curComponent.type == Block.PICKUP) {
   commandName = 'pickUp';
 } else if (curComponent.type == Block.DROP) {
   commandName = 'drop';
 }
 return 'GridPet.' + commandName + '(function () {' + 
  (nextComponent == null ? callbackCode : 
    componentsToCode(components, index + 1, callbackCode)) + '});';
} else if (curComponent instanceof Page) {
  return curComponent.toCode((nextComponent == null ? 
    callbackCode : componentsToCode(components, index + 1, callbackCode)));
} else if (curComponent instanceof Trick) {
  return curComponent.innerPage.toCode('function () {' + 
    (nextComponent == null ? callbackCode : 
      componentsToCode(components, index + 1, callbackCode)) + '}');
}
};

// Represents the set of all tricks a user has at their disposal. Loads all
// tricks from server before game starts. All references to tricks go here.
var Tricks = {};
Tricks.init = function () {
	// TODO: make call to server to load all trick code (one per level).
	// Tricks acts as a lookup to store all tricks. REMEMBER DO NOT ALLOW THE
	// LEVEL WHERE YOU EARN A TRICK TO CALL THAT TRICK (no recursion!)
};
Tricks.getTrick = function (level) {
	return null; // TODO: find the appropriate trick and return it
};

var Trick = function (type) {
	this.type = type;
	this.innerPage = null; // TODO: load inner page as needed
};

// Converts a trick instance to JSON for storage. This is a reference to a
// trick, not the actual source code of the trick being stored.
Trick.prototype.toJSON = function () {
	return {
		objClass: 'Trick',
		type: this.type
	};
};

// TODO: list the levels associated with tricks


// Represents a boolean evaluatable condition
var Condition = function (type, direction, itemType) {
	this.type = type;
	this.direction = direction;
	this.itemType = itemType;
	// For AND and OR
	this.leftInnerCond = null;
	this.rightInnerCond = null;
};

Condition.AND = -2;
Condition.OR = -1;
Condition.UNDEF = 0;
Condition.WALL = 1;
Condition.NOWALL = 2;
Condition.OBJECT = 3;
Condition.NOOBJECT = 4;
Condition.WALLFAR = 5;
Condition.NOWALLFAR = 6;
Condition.OBJECTFAR = 7;
Condition.NOOBJECTFAR = 8;

// Converts a condition into a javascript eval-able string
Condition.prototype.toCode = function () {
	if (this.leftInnerCond != null && this.rightInnerCond == null) {
		return this.leftInnerCond.toCode();
	} else if (this.leftInnerCond == null && this.rightInnerCond != null) {
		return this.rightInnerCond.toCode();
	} else if (this.leftInnerCond != null && this.rightInnerCond != null) {
		// Assumes that AND and OR are the only conditions with both components
		return '('+this.leftInnerCond.toCode() + ' ' + 
      (this.type == Condition.AND ? '&&' : '||') + ' ' + 
      this.rightInnerCond.toCode() + ')';
	} else {
		// Generate code for all single conditions
		if (this.type == Condition.WALL) {
			return 'GridPet.checkForWall(' + this.direction + ', 1)';
		} else if (this.type == Condition.NOWALL) {
			return '!GridPet.checkForWall(' + this.direction + ', 1)';
		} else if (this.type == Condition.OBJECT) {
			return 'GridPet.checkForObject(' + this.itemType + ', ' + 
					this.direction + ', 1)';
		} else if (this.type == Condition.NOOBJECT) {
			return '!GridPet.checkForObject(' + this.itemType + ', ' + 
			 this.direction + ', 1)';
		} else if (this.type == Condition.WALLFAR) {
			return 'GridPet.checkForWall(' + this.direction + ', GridPet.sight)';
		} else if (this.type == Condition.NOWALLFAR) {
			return '!GridPet.checkForWall(' + this.direction + ', GridPet.sight)';
		} else if (this.type == Condition.OBJECTFAR) {
			return 'GridPet.checkForObject(' + this.itemType + ', ' + 
					this.direction + ', GridPet.sight)';
		} else if (this.type == Condition.NOOBJECTFAR) {
			return '!GridPet.checkForObject(' + this.itemType + ', ' + 
					this.direction + ', GridPet.sight)';
		}
	}
};

// Converts a condition object to storable JSON
Condition.prototype.toJSON = function () {
	if (this.type == Condition.AND) {
		return {
			objClass: 'Condition',
			type: this.type,
			left: this.leftInnerCond.toJSON(),
			right: this.rightInnerCond.toJSON(),
		};
	} else if (this.type == Condition.OR) {
		return {
			objClass: 'Condition',
			type: this.type,
			left: this.leftInnerCond.toJSON(),
			right: this.rightInnerCond.toJSON(),
		};
	} else {
		// Generate JSON for all single conditions
		if (this.type == Condition.WALL) {
			return {
				objClass: 'Condition',
				type: this.type,
				direction: this.direction
			};
		} else if (this.type == Condition.NOWALL) {
			return {
				objClass: 'Condition',
				type: this.type,
				direction: this.direction
			};
		} else if (this.type == Condition.OBJECT) {
			return {
				objClass: 'Condition',
				type: this.type,
				direction: this.direction,
				itemType: this.itemType
			};
		} else if (this.type == Condition.NOOBJECT) {
			return {
				objClass: 'Condition',
				type: this.type,
				direction: this.direction,
				itemType: this.itemType
			};
		} else if (this.type == Condition.WALLFAR) {
			return {
				objClass: 'Condition',
				type: this.type,
				direction: this.direction
			};
		} else if (this.type == Condition.NOWALLFAR) {
			return {
				objClass: 'Condition',
				type: this.type,
				direction: this.direction
			};
		} else if (this.type == Condition.OBJECTFAR) {
			return {
				objClass: 'Condition',
				type: this.type,
				direction: this.direction,
				itemType: this.itemType
			};
		} else if (this.type == Condition.NOOBJECTFAR) {
			return {
				objClass: 'Condition',
				type: this.type,
				direction: this.direction,
				itemType: this.itemType
			};
		}
	}
};


