// requires "npm install request"
 var request = require('request');
 var util = require('util');
 var MySql = require('./MySql.js');

// Values used. Feel free to change them!
 var USERNAME = 'jtliang';
 var PASSWORD = 'hello';
 var PET_NAME = 'Chase';

 var ServerTest = {};

 ServerTest.attachPageHandlers = function(app) {

  app.get('/test', function (req, res) {
    var cookieKey;
    console.log("Starting server tests.");

    // Runs through a series of callbacks/tests to ensure that
    // the existing server backend calls are functional.
    request.post({
          uri: 'http://localhost:3750/account/create',
          json: {username: USERNAME, password: PASSWORD}
        }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log("CREATE ACCOUNT: ");
          console.log(body);
          console.log('\n');
          cookieKey = body._cookieKey;
          makePet(cookieKey, updatePet);
          var insertLevel = 'INSERT INTO GameLevel (Name, Description, Datablob)' + 
          'VALUES ("TestLevel", "Testing", "Merely a Test");';
          MySql.query(insertLevel, function (rows) {
            if (rows.affectedRows == 1) {
              insertSolution(rows.insertId, cookieKey, updateSolution);
            }
          })
        }
    });
  });
};

module.exports = ServerTest;

// Tests the creation of pets
// NOTE: Noticed that the name of the pets never get unescaped
// as its returned. Constant back-and-forth between server and client
// leads to pet name being escaped multiple times. 
var makePet = function(cookieKey, callback) {
  request.post({
          uri: 'http://localhost:3750/pet/create',
          json: {
            _name: PET_NAME,
            _species: 1,
            _color: 1,
            cookieKey: cookieKey
          }
        }, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            console.log("CREATE PET: ");
            console.log(body);
            console.log('\n');
            callback(body, cookieKey, function (cookieKey) {
              getPet(cookieKey);
            });
          }
    });
};

// Tests the ability to update the pet
var updatePet = function(pet, cookieKey, callback) {
    pet._color = 2;
    request.post({
          uri: 'http://localhost:3750/pet/save',
          json: {
            pet: JSON.stringify(pet),
            cookieKey: cookieKey
          }
        }, function(error, response, body) {
          if (!error && response.statusCode == 200) {
            console.log("UPDATE PET: ");
            console.log(body);
            console.log('\n');
            callback(cookieKey);
          }
    });
};

// Tests the ability to retrieve pet
var getPet = function(cookieKey) {
  request('http://localhost:3750/pet/get?cookieKey=' + encodeURI(cookieKey),
      function(error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log("GET PET: ");
          console.log(body);
          console.log('\n');
        }
  });
};

// Tests the ability to insert a solution
var insertSolution = function(id, cookieKey, callback) {
  request.post({
        uri: 'http://localhost:3750/solution/save',
        json: {
          _level: id,
          _stars: 2,
          _data: "Pretend this is a datablob.",
          _time: new Date(),
          cookieKey: cookieKey
        }
      }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("INSERT SOLUTION: ");
            console.log(body);
            console.log('\n');
            callback(id, cookieKey, function (id, cookieKey) {
              getSolution(id, cookieKey);
            });
        }
  });
};

// Tests the ability to update a solution
// NOTE: Currently experiencing some asynchronous behavior
// between the insert/update queries.
var updateSolution = function(id, cookieKey, callback) {
  request.post({
        uri: 'http://localhost:3750/solution/save',
        json: {
          _level: id,
          _stars: 3,
          _data: "This was updated.",
          _time: new Date(),
          cookieKey: cookieKey
        }
      }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("UPDATE SOLUTION: ");
            console.log(body);
            console.log('\n');
            callback(id, cookieKey);
          }
  })
};

// Tests the ability to retrieve a solution
var getSolution = function(id, cookieKey) {
  request({
        uri: 'http://localhost:3750/solution/get',
        qs: {
          _level: id,
          cookieKey: cookieKey
        }
      }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("GET SOLUTION: ");
            console.log(body);
            console.log('\n');
            cleanup(id);
        }
  })
};

// Cleans up any mess left in the database as a result of the tests
var cleanup = function(id) {
  // var cleanupAccount = util.format('DELETE FROM Account WHERE ' + 
  //     'Username = %s;', MySql.escape(USERNAME));
  // var cleanupLevel = util.format('DELETE FROM GameLevel WHERE ID = %d;', id);
  // MySql.query(cleanupAccount, function (rows) {
  //   MySql.query(cleanupLevel, function (rows) {
  //     console.log("Cleanup is done.");
  //   })
  // });
}