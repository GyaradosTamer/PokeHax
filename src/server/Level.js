var MySql = require('./MySql.js');
var util = require('util');
var config = require('./Config.js');

// **** Constructor ****
var Level = function(id, name, world, isTrick, description, datablob) {
  this._id = id;
  this._name = name;
  this._world = world;
  this._isTrick = isTrick;
  this._description = description;
  this._datablob = datablob;
  return this;
};

/* Creates a level object from the row returned by a SQL query
 * into the GameLevel table.
 */
Level.parseLevelFromRow = function(row) {
  return new Level(parseInt(row.ID), row.Name, parseInt(row.World), 
      parseInt(row.IsTrick) == 1, row.Description, row.Datablob);
};

// **** Page handler functions ****
Level.attachPageHandlers = function(app) {

  /* When given the name of the level, returns a response
   * that includes all the information about that level 
   * from the database in the form of JSON.
   */  
  app.get('/level/get', function (req, res) {
    try {
      var name = req.query.name;
      if (name == undefined) {
        return;
      }
      getLevel(name, function (level) {
        res.json(level);
      });
    }
    catch (ignored) {}
  });
};

module.exports = Level;

// **** Private functions ****
var getLevel = function(name, callback) {
  var query = util.format('SELECT * FROM GameLevel WHERE Name = %s;', 
      MySql.escape(name));
  MySql.query(query, function (rows) {
    var level;
    if (rows.length > 0) {
      level = Level.parseLevelFromRow(rows[0]);
      level.status = "Success"
    }
    else {
      level = {status: "Failure"};
    }
    callback(level);
  });
};