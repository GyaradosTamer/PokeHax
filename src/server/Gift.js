var MySql = require('./MySql.js');
var util = require('util');
var config = require('./Config.js');
var Account = require('./Account.js');

// **** Constructor ****
var Gift = function(item, sender, receiver, received) {
  this._item = item;
  this._sender = sender;
  this._receiver = receiver;
  this._received = received;
  return this;
};

// **** Page handler functions ****
Gift.attachPageHandlers = function (app) {

    //Allows users to send gifts to each other.
  app.post("/gift/send", function (req, res) {
    try {
      var sender = parseInt(req.body.sender);
      var cookieKey = req.body.cookieKey;
      var item = parseInt(req.body.item);
      var receiver = parseInt(req.body.receiver);
      if (isNaN(receiver) || isNaN(item) || isNaN(sender) || 
          cookieKey == undefined) {
        return;
      }
      Account.validateAccount(cookieKey, sender, function () {
        sendGift(sender, receiver, item, function() {
          res.send("Done");
        });
      });
    } catch (ignored) {}
  });

   //Returns the list of all unreceived gifts for the given user
  app.get("/gift/list", function (req, res) {
    try {
      var receiver = parseInt(req.query.receiver);
      if (isNaN(receiver)) {
        return;
      }
      var cookieKey = req.query.cookieKey;
      Account.loadFromCookie(cookieKey, function (account) {
        showGifts(receiver, function (array) {
            res.json(array);
        });
      });
    } catch (ignored) {res.json("HELLO!"); }
  });

  //Allows the given user to receive a gift, marking that item as received in the DB
  app.post("/gift/receive", function (req, res) {
    try {
      var receiver = parseInt(req.body.receiver);
      var cookieKey = req.body.cookieKey;
      var item = parseInt(req.body.item);
      if (isNaN(item) || isNaN(receiver) || cookieKey == undefined) {
        return;
      }
      Account.loadFromCookie(cookieKey, function (account) {
        receiveGift(receiver, item, function() {
          showGifts(receiver, function (array) {
            res.json(array);
          });
        });
      });
    } catch (ignored) {}
  });
};

module.exports = Gift;

var showGifts = function(receiver, callback) {
  var selectQuery = util.format('SELECT * FROM Gift WHERE Received = false ' + 
      'AND Receiver = %d;', receiver);
  MySql.query(selectQuery, function (selectRows) {
    var giftArray = [];
    if (selectRows.length > 0) {
      for (var i = 0; i < selectRows.length; i++) {
        giftArray.push(parseGiftFromRow(selectRows[i]));
      }
    }
    callback(giftArray);
  });
};

var receiveGift = function(receiver, item, callback) {
  var updateQuery = util.format('UPDATE Gift SET Received = true WHERE ' + 
      'Receiver = %d AND Item = %d AND Received = false;', receiver, item);
  MySql.query(updateQuery, function (rows) {
    callback();
  });
};

var sendGift = function(sender, receiver, item, callback) {
  var insertQuery = util.format('INSERT INTO Gift VALUES (%d, %d, %d, false);',
    item, sender, receiver);
  MySql.query(insertQuery, function (rows) {
    callback();
  });
};

var parseGiftFromRow = function(row) {
  return new Gift(parseInt(row.Item), parseInt(row.Sender), 
      parseInt(row.Receiver), parseInt(row.Received));
};