var MySql = require('./MySql.js');
var util = require('util');
var config = require('./Config.js');
var Account = require('./Account.js');

// **** Constructor ****
var Pet = function (id, name, owner, createdOn, species, color, speed,
    strength, sight, fatigue, happiness, happinessCap, lastInteracted, 
    lastGroomed, lastFed) {
	this._id = id;
	this._name = name;
	this._owner = owner;
	this._createdOn = createdOn;
	this._species = species;
	this._color = color;
	this._speed = speed;
	this._strength = strength;
	this._sight = sight;
	this._fatigue = fatigue;
	this._happiness = happiness;
	this._happinessCap = happinessCap;
	this._lastInteracted = lastInteracted;
	this._lastGroomed = lastGroomed;
	this._lastFed = lastFed;
	return this;
};

/* Given a name, an owner, a species, and a color, generates a new pet
 * associated with the given owner in the database. Calls the callback
 * function on the pet on success and on null if there's a failure.
 */
Pet.createNewPet = function(name, owner, species, color, callback) {
	name = name.trim();
  species = parseInt(species);
  color = parseInt(color);
  owner = parseInt(owner);
  if (isNaN(species) || isNaN(color) || isNaN(owner)) {
    callback(null);
  }
	var query = util.format('INSERT INTO Pet (Name, Owner, Species, Color) ' + 
      'VALUES (%s, %d, %d, %d);', 
		  MySql.escape(name), owner, species, color);
	MySql.query(query, function (rows) {
		if (rows.affectedRows != 1) {
			callback(null);
		}
		else {
      loadPetFromId(rows.insertId, callback);
    }
  });
};

// **** Instance based functions **** 

Pet.prototype.getId = function() {
  return this._id;
}
Pet.prototype.getName = function() {
  return this._name;
}
Pet.prototype.getOwner = function() {
  return this._owner;
}
Pet.prototype.getSpecies = function() {
  return this._species;
}
Pet.prototype.getColor = function() {
  return this._color;
}
Pet.prototype.getSpeed = function() {
  return this._speed;
}
Pet.prototype.getStrength = function() {
  return this._strength;
}
Pet.prototype.getSight = function() {
  return this._sight;
}
Pet.prototype.getFatigue = function() {
  return this._fatigue;
}
Pet.prototype.getHappiness = function() {
  return this._happiness;
}
Pet.prototype.getHappinessCap = function() {
  return this._happinessCap;
}
Pet.prototype.getLastInteracted = function() {
  return this._lastInteracted;
}
Pet.prototype.getLastGroomed = function() {
  return this._lastGroomed;
}
Pet.prototype.getLastFed = function() {
  return this._lastFed;
}

Pet.prototype.feed = function(amount) {
  this._fatigue = Math.max(this._fatigue - amount, 0);
  this._lastFed = new Date();
  this._lastInteracted = this._lastFed;
}

Pet.prototype.pet = function(amount) {
  this._happiness = Math.max(this._happiness + amount, this._happinessCap);
  this._lastInteracted = new Date();
}

Pet.prototype.setHappinessCap = function(amount) {
  this._happinessCap = amount;
}

Pet.prototype.setSpeed = function(speed) {
  this._speed = speed;
}

Pet.prototype.setSight = function(sight) {
  this._sight = sight;
}

Pet.prototype.setStrength = function(strength) {
  this._strength = strength;
}

Pet.prototype.setColor = function(color) {
  this._color = color;
}

Pet.prototype.wearItem = function(item, callback) {
  var query = util.format('UPDATE ItemInstance SET Worn = true WHERE Item=%d ' + 
      'AND Owner=%d;', item, this._owner);
  var self = this;
  MySql.query(query, function() {
    self._lastGroomed = new Date();
    self._lastInteracted = self._lastGroomed;
    callback(this);
  });
}

Pet.prototype.removeItem = function(item, callback) {
  var query = util.format('UPDATE ItemInstance SET Worn = false WHERE Item=%d ' + 
      'AND Owner=%d;', item, this._owner);
  var self = this;
  MySql.query(query, function() {
    self._lastGroomed = new Date();
    self._lastInteracted = self._lastGroomed;
    callback(this);
  });
}

/* Writes data stored in a Pet object back into its slot in the SQL
 * Pet table.
 */
Pet.prototype.save = function(callback) {
  var query = util.format('UPDATE Pet SET Name=%s, Color=%d, Speed=%d, ' + 
      'Strength=%d, Sight=%d, Fatigue=%d, Happiness=%d, HappinessCap=%d, ' + 
      'lastInteracted="%s", lastGroomed="%s", lastFed="%s" WHERE ID=%d;',
      MySql.escape(this._name), this._color, this._speed, this._strength, 
      this._sight, this._fatigue, this._happiness, this._happinessCap, 
      MySql.dateToDateTime(this._lastInteracted), 
      MySql.dateToDateTime(this._lastGroomed), 
      MySql.dateToDateTime(this._lastFed), this._id);
  var self = this;
  MySql.query(query, function() {
    updatePet(self, callback);
  });
};

// **** Page handler functions ****
Pet.attachPageHandlers = function(app) {

  /* Given the name of the pet, its species, and its color,
   * enters the pet into the database and sends a response to the client
   * in the form of JSON.
  */
  app.post('/pet/create', function (req, res) {
    try {
      var name = req.body._name;
      var species = parseInt(req.body._species);
      var color = parseInt(req.body._color);
      var cookieKey = req.body.cookieKey;
      if (name == undefined || cookieKey == undefined|| isNaN(species) || 
          isNaN(color)) {
        return;
      }
      Account.loadFromCookie(cookieKey, function (account) {
        Pet.createNewPet(name, account.getId(), species, color, function (pet) {
          res.json(pet);
        });
      });
    } catch (ignored) {}
  });

  /* When sent a POST request with a pet represented as JSON, updates
   * the database and sends a response of this new pet to the client
   * in the form of JSON.
   */
  app.post('/pet/save', function(req, res) {
    try {
      var cookieKey = req.body.cookieKey;
      if (req.body.pet == undefined || cookieKey == undefined) {
        return;
      }
      Account.loadFromCookie(cookieKey, function (account) {
        var pet = parsePetFromJSON(account.getId(), req.body.pet);
        if (pet == null) {
          return;
        }
        pet.save(function (returnedPet) {
          res.json(returnedPet);
        });
      });
    } catch (ignored) {}
  });

  /* Given a valid cookie, returns the pet (in JSON form) associated with 
   * the account for which that cookie is valid. 
   * (Might have to rethink this one. Do we allow friends to visit your pets?)
   */
  app.get('/pet/get', function (req, res) {
    try {
      var cookieKey = req.query.cookieKey;
      if (cookieKey == undefined) {
        return;
      }
      Account.loadFromCookie(cookieKey, function (account) {
        loadPetFromOwnerId(account.getId(), function(pet) {
          res.json(pet);
        })
      });
    } catch (ignored) {}
  });
};

module.exports = Pet;

// **** Private functions ****
var loadPetFromOwnerId = function(owner, callback) {
  owner = parseInt(owner);
  if (isNaN(owner)) {
    callback(null);
  }
	var query = 'SELECT * FROM Pet WHERE Owner = ' + owner + ';';
	MySql.query(query, function(rows) {
		if (rows.length > 0) {
			callback(parsePetFromRow(rows[0]));
		}
		else {
			callback(null);
		}
	}); 
};

var loadPetFromId = function(id, callback) {
  id = parseInt(id);
  if (isNaN(id)) {
    callback(null);
  }
  var query = 'SELECT * FROM Pet WHERE Owner = ' + id + ';';
  MySql.query(query, function(rows) {
    if (rows.length > 0) {
      callback(parsePetFromRow(rows[0]));
    }
    else {
      callback(null);
    }
  }); 
};

var updatePet = function(pet, callback) {
  var query = 'SELECT * FROM Pet WHERE ID = ' + parseInt(pet.getId()) + ';';
  MySql.query(query, function(rows) {
    if(rows.length > 0) {
      updatePetFromRow(pet, rows[0]);
      callback(pet);
      return;
    }
  });
};

var parsePetFromRow = function(row) {
	return new Pet(parseInt(row.ID), row.Name, parseInt(row.Owner), row.CreatedOn, 
      parseInt(row.Species), parseInt(row.Color), parseInt(row.Speed), 
      parseInt(row.Strength), parseInt(row.Sight), parseInt(row.Fatigue), 
      parseInt(row.Happiness), parseInt(row.HappinessCap), row.LastInteracted, 
      row.LastGroomed, row.LastFed);
};

var updatePetFromRow = function(pet, row) {
  Pet.apply(pet, [parseInt(row.ID), row.Name, parseInt(row.Owner), row.CreatedOn, 
      parseInt(row.Species), parseInt(row.Color), parseInt(row.Speed), 
      parseInt(row.Strength), parseInt(row.Sight), parseInt(row.Fatigue), 
      parseInt(row.Happiness), parseInt(row.HappinessCap), row.LastInteracted, 
      row.LastGroomed, row.LastFed]);
};

var parsePetFromJSON = function(id, pet) {
  if (pet == undefined) {
    return null;
  }
  pet = JSON.parse(pet);
  return new Pet(parseInt(id), pet._name, parseInt(pet._owner), pet._createdOn, 
      parseInt(pet._species), parseInt(pet._color), parseInt(pet._speed), 
      parseInt(pet._strength), parseInt(pet._sight), parseInt(pet._fatigue),
      parseInt(pet._happiness), parseInt(pet._happinessCap), 
      new Date(pet._lastInteracted), new Date(pet._lastGroomed), 
      new Date(pet._lastFed));
};