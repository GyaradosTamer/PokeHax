var MySql = require('./MySql.js');
var util = require('util');
var config = require('./Config.js');
var Account = require('./Account.js');
var Level = require('./Level.js');

// *** Constructor ***
var World = function(id, name, levels) {
  this._id = id;
  this._name = name;
  this._levels = levels;
  return this;
};

World.attachPageHandlers = function(app) {

  /* Given a world and a cookieKey, calculates how many levels in that
   * world the user has a solution for.
   */
  app.get('/world/percent', function (req, res) {
    var world = parseInt(req.query.world);
    var cookieKey = req.query.cookieKey;
    if (isNaN(world) || cookieKey == undefined) {
      return;
    }
    Account.loadFromCookie(cookieKey, function (account) {
      getPercentage(world, function (obj) {
        res.json(obj);
      });
    });
  });

  /* Gets information about the worlds and its respective, nested
   * levels.
   */
  app.get('/world/all', function (req, res) {
    getWorlds(function(hash) {
      res.json(hash);
    });
  });

  /* Given a world number, returns a JSON object containing
   * that world and all the levels associated with the world.
   */
  app.get('/world/get', function (req, res) {
    var world = parseInt(req.query.world);
    if (isNaN(world)) {
      return;
    }
    getWorld(world, function (object) {
      res.json(object);
    });
  });
};

module.exports = World;

// Creates a JSON object that nests all the levels within 
// their respective worlds. Calls the callback on this JSON object.
var getWorlds = function(callback) {
  var query = util.format('SELECT * FROM World ORDER BY ID ASC;');
  MySql.query(query, function(rows) {
    var worlds = [];
    if (rows.length > 0) {
      var numWorlds = rows.length;
      for (var i = 0; i < rows.length; i++) {
        worlds.push(new World(rows[i].ID, rows[i].Name, []));
        var levelQuery = util.format('SELECT * FROM GameLevel WHERE World = %d ' + 
            'ORDER BY ID ASC;', parseInt(rows[i].ID));
        MySql.query(levelQuery, function(levelRows) {
          for (var j = 0; j < levelRows.length; j++) {
            var worldID = parseInt(levelRows[j].World);
            worlds[worldID-1]._levels.push(Level.parseLevelFromRow(levelRows[j])); 
          }
          if (--numWorlds == 0) {
            callback({worlds: worlds});
          }
        });
      }
    }
  });
};

var getPercentage = function(world, callback) {
  var query = util.format('SELECT * FROM GameLevel WHERE World = %d', world);
  MySql.query(query, function (rows) {
    var numLevels = rows.length;
    if (rows.length > 0) {
      var progressQuery = util.format('SELECT * From Solutions WHERE GameLevel ' + 
          'IN (SELECT ID FROM GameLevel WHERE World = %d);', world);
      MySql.query(progressQuery, function (progressRows) {
        callback({
          percent: parseFloat(progressRows.length)/parseFloat(rows.length)
        });
      });
    }
  });
};

var getWorld = function(world, callback) {
  var query = util.format('SELECT * FROM World WHERE ID = %d;', world);
  MySql.query(query, function(rows) {
    if (rows.length > 0) {
      getLevels(parseInt(rows[0].ID), rows[0].Name, callback);
    }
  })
};

var getLevels = function(world, name, callback) {
  var query = util.format('SELECT * FROM GameLevel WHERE World  = %d' + 
      ' ORDER BY ID;', world);
  MySql.query(query, function(rows) {
    var levelsArray = [];
    if (rows.length > 0) {
      for (var i = 0; i < rows.length; i++) {
        levelsArray.push(Level.parseLevelFromRow(rows[i]));
      }
    }
    callback(new World(world, name, levelsArray));
  });
};