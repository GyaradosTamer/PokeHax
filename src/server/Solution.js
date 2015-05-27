var MySql = require('./MySql.js');
var util = require('util');
var config = require('./Config.js');
var Account = require('./Account.js');

// **** Constructor ****
var Solution = function(id, owner, gameLevel, dataBlob, starsEarned, 
    timeExecuted) {
  this._id = id;
  this._owner = owner;
  this._gameLevel = gameLevel;
  this._dataBlob = dataBlob;
  this._starsEarned = starsEarned;
  this._timeExecuted = timeExecuted;
  return this;
};

// **** Page handler functions ****
Solution.attachPageHandlers = function (app) {

  //Gets the solution for the given user at the given level
  app.get("/solution/get", function (req, res) {
    try {
      var cookieKey = req.query.cookieKey;
      var level = parseInt(req.query.level);
      if (isNaN(level) || cookieKey == undefined) {
        return;
      }
      Account.loadFromCookie(cookieKey, function (account) {
        getSolution(account.getId(), level, function (solution) {
          res.json(solution);
        });
      })
    } catch(ignored) {}
  });

  //Allows user to save his/her solution to a level. Takes care of
  //both updates and inserts.
  app.post("/solution/save", function (req, res) {
    try {
      var cookieKey = req.body.cookieKey;
      var solution = req.body.solution;
      if (solution == undefined || cookieKey == undefined) {
        return;
      }
      var level = parseInt(solution._level);
      var stars = parseInt(solution._stars);
      var data = solution._data;
      var time = solution._time;
      if (isNaN(level) || isNaN(stars) || data == undefined || 
          time == undefined) {
        return;
      }
      Account.loadFromCookie(cookieKey, function (account) {
        updateSolution(account.getId(), level, data, stars, 
            new Date(time), function (solution) {
          res.send(solution);
        });
      });
    } catch (ignored) {}
  });
};

module.exports = Solution;

// **** Private functions ****
var getSolution = function(owner, level, callback) {
  owner = parseInt(owner);
  if (isNaN(owner)) {
    callback(null);
  }
  var query = util.format('SELECT * FROM Solutions WHERE Owner= %d AND ' + 
      'GameLevel = %d;', owner, level);
  MySql.query(query, function(rows) {
    var solution;
    if (rows.length > 0) {
      solution = parseSolutionFromRow(rows[0]);
      solution.status = "Success";
    }
    else {
      solution = {status: "Failure"};
    }
    callback(solution);
  });
};

/*
 * Overwrites the solution in the DB with the passed if there's already 
 * a solution for the level. Otherwise, insert the solution in the DB for that 
 * specific level.
 */
var updateSolution = function(owner, level, data, stars, time, callback) {
  owner = parseInt(owner);
  if (isNaN(owner)) {
    callback(null);
  }
  var updateQuery = util.format('UPDATE Solutions SET Datablob = %s, ' + 
      'StarsEarned = %d, TimeExecuted = "%s" WHERE ' + 
      'Owner = %d AND GameLevel = %d;', MySql.escape(data), stars, 
      MySql.dateToTime(time), owner, level);
  MySql.query(updateQuery, function (updateRows) {
    if (updateRows.changedRows == 1) {
      getSolution(owner, level, callback);
    }
    else {
      insertSolution(owner, level, data, stars, time, callback);
    }
  });
};

var insertSolution = function(owner, level, data, stars, time, callback) {
  var insertQuery = util.format('INSERT INTO Solutions (Owner, GameLevel, ' + 
      'Datablob, StarsEarned, TimeExecuted)' + 
      ' VALUES (%d, %d, %s, %d, "%s");', owner, level, MySql.escape(data), 
      stars, MySql.dateToTime(time));
  MySql.query(insertQuery, function (insertRows){
    if (insertRows.affectedRows == 1) {
      getSolution(owner, level, callback);
    }
  });
};

var parseSolutionFromRow = function(row){
  return new Solution(parseInt(row.ID), parseInt(row.Owner), 
      parseInt(row.GameLevel), row.Datablob, 
      parseInt(row.StarsEarned), row.TimeExecuted);
};