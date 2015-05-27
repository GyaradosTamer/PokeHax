var MySql = require('./MySql.js');
var util = require('util');
var config = require('./Config.js');

// **** Constructor ****
var Account = function (id, username, cookieKey, cookieExp, createdOn,
  currency) {
	this._id = id;
	this._username = username;
	this._cookieKey = cookieKey;
	this._cookieExp = cookieExp;
	this._createdOn = createdOn;
	this._currency = currency;
	return this;
};

// **** Static functions **** 

/* Creates a new account given a username and password. Calls callback
 * with an Account object corresponding to the created account on success
 * or null on failure.
 */
 Account.createNewAccount = function (username, password, callback) {
	// Check validity of parameters
	username = username.trim();
	password = password.trim();
	if (username.length < config.account.minUsernameLength || 
      password.length < config.account.minPassLength) {
		  callback(null);
    return;
  }
  Account.checkIfUsernameInUse(username, function (inUse) {
  if (inUse) {
    callback(null);
    return;
  }
	// Create account
	generateNewSalt(function(salt) {
		var hash = getHash(password, salt);
		generateNewCookieKey(function (cookieKey) {
			var cookieExp = generateCookieExpireDate();
			var query = util.format('INSERT INTO Account (Username, Passhash, ' + 
          'Salt, CookieKey, CookieExp) VALUES (%s, "%s", "%s", "%s", "%s")',
          MySql.escape(username), hash, salt, cookieKey, 
          MySql.dateToDateTime(cookieExp));
			MySql.query(query, function(rows) {
				if (rows.affectedRows == 1) {
					loadAccountFromId(rows.insertId, callback);
					return;
				} else {
					callback(null);
					return;
				}
			 });
	 	 });
	 })
  });
};

/* Checks if a given username is already taken. Calls callback with true
 * if taken and false if not.
 */
 Account.checkIfUsernameInUse = function(username, callback) {
   var query = 'SELECT COUNT(*) AS Count FROM Account WHERE Username = ' + 
   MySql.escape(username) + ';';
   MySql.query(query, function(rows) {
    callback(parseInt(rows[0]['Count']) != 0);
    return;
  });
 };

/* Loads an account given a cookie key. Returns an Account if the key is validity
 * or null if not.
 */
 Account.loadFromCookie = function (cookieKey, callback) {
   var query = util.format('SELECT ID, Username, CookieKey, CookieExp, ' + 
      'CreatedOn, Currency FROM Account WHERE CookieKey = %s AND ' + 
      'CookieExp > "%s";', MySql.escape(cookieKey), 
      MySql.dateToDateTime(new Date()));
   MySql.query(query, function(rows) {
    if (rows.length > 0) {
     var account = parseAccountFromRow(rows[0]);
			// Update cookieExp
			account.setCookieExp(generateCookieExpireDate());
			account.save(function () {
				callback(account);
			});
			return;
		} else {
			callback(null);
			return;
		}
	});
 };

/* Attempts to log a user in with a given username and password, returning an
 * Account object on success and null on failure.
 */
 Account.auth = function (username, password, callback) {
	// Check validity of parameters
	username = username.trim();
	password = password.trim();
	if (username.length < config.account.minUsernameLength || 
    password.length < config.account.minPassLength) {
    callback(null);
  return;
}
var query = util.format('SELECT * FROM Account WHERE Username = %s;', 
  MySql.escape(username));
MySql.query(query, function (rows) {
  if (rows.length > 0) {
			// Check password
			var row = rows[0]
			var salt = row["Salt"];
			var hash = getHash(password, salt);
			if (hash !== row["Passhash"]) {
				callback(null);
				return;
			}
			// Update cookie and cookieExp
			var account = parseAccountFromRow(rows[0]);
			generateNewCookieKey(function (cookieKey) {
				account.setCookieKey(cookieKey);
				account.setCookieExp(generateCookieExpireDate());
				account.save(function () {
					callback(account);
				});
				return;
			});
		} else {
			callback(null);
			return;
		}
	});
};

// **** Instance based functions **** 

Account.prototype.setCookieExp = function (date) {
	this._cookieExp = date;
};

Account.prototype.setCookieKey = function (key) {
	this._cookieKey = key;
};

Account.prototype.setCurrency = function (amount) {
	this._currency = amount;
};

Account.prototype.addCurrency = function (amount) {
	this._currency += amount;
};

Account.prototype.removeCurrency = function (amount) {
	this._currency = Math.max(this._currency - amount, 0);
};

Account.prototype.getCurrency = function () {
	return this._currency;
};

Account.prototype.getUsername = function () {
	return this._username;
};

Account.prototype.getCreatedOn = function () {
	return this._createdOn;
};

Account.prototype.getId = function () {
	return this._id;
};

/* Writes data stored in an Account object back into its slot in the SQL
 * Account table.
 */
 Account.prototype.save = function (callback) {
   var query = util.format('UPDATE Account SET Username="%s", CookieKey="%s", ' + 
     'CookieExp="%s", Currency=%d WHERE ID = %d;', this._username, 
     this._cookieKey, MySql.dateToDateTime(this._cookieExp), this._currency, 
     this._id);
   var that = this;
   MySql.query(query, function () {
    updateAccount(that, callback);
    return;
  });
 };

// **** Page handler functions **** 
Account.attachPageHandlers = function (app) {
	// Check username in use
	app.get('/account/checkusername', function (req, res) {
		var username = req.query.username;
		if (username != undefined && (username = username.trim()).length > 0) {
			Account.checkIfUsernameInUse(username, function(inUse) {
				res.json({
					inUse: inUse
				});
			});
		}
	});
	
	// Create account
	app.post('/account/create', function (req, res) {
		try {
			var username = req.body.username;
			var password = req.body.password;
			if (username != undefined && password != undefined) {
				Account.createNewAccount(username, password, function (account) {
					res.json(account);
				});
			}
		} catch (ignored) {}
	});
	
	// Load from cookie key
	app.post('/account/cookie', function (req, res) {
		try {
			var cookieKey = req.body.cookieKey;
			if (cookieKey != undefined && cookieKey.length == 32) {
				Account.loadFromCookie(cookieKey, function (account) {
					res.json(account);
				});
			}
		} catch (ignored) {}
	});
	
	// Login
	app.post('/account/login', function (req, res) {
		try {
			var username = req.body.username;
			var password = req.body.password;
			if (username != undefined && password != undefined) {
				Account.auth(username, password, function (account) {
					res.json(account);
				});
			}
		} catch (ignored) {}
	});
};

module.exports = Account;

// **** Private functions ****
var generateCookieExpireDate = function() {
	// Cookie expires in 2 weeks
	return new Date(new Date().getTime() + 2 * 7 * 24 * 60 * 60 * 1000);
};

// Hashing
var crypto = require('crypto');
var shasum = crypto.createHash('sha1');

var getHash = function (password, userSalt) {
	crypto.createHash('sha1').update(password + userSalt);
	return crypto.createHash('sha1').digest('hex');
};

var generateNewSalt = function (callback) {
	crypto.randomBytes(16, function (ex, buf) {
		callback(buf.toString('hex'));
		return;
	});
};

var generateNewCookieKey = function (callback) {
	crypto.randomBytes(16, function (ex, buf) {
		callback(buf.toString('hex'));
		return;
	});
};

var loadAccountFromId = function (id, callback) {
	var query = 'SELECT ID, Username, CookieKey, CookieExp, CreatedOn, ' + 
 'Currency FROM Account WHERE ID = ' + id + ';';
 MySql.query(query, function(rows) {
  if (rows.length > 0) {
   callback(parseAccountFromRow(rows[0]));
   return;
 } else {
   callback(null);
   return;
 }
});
};

var updateAccount = function (account, callback) {
	var query = 'SELECT ID, Username, CookieKey, CookieExp, CreatedOn, ' + 
 'Currency FROM Account WHERE ID = ' + account._id + ';';
 MySql.query(query, function(rows) {
  if (rows.length > 0) {
   updateAccountFromRow(account, rows[0]);
   callback();
   return;
 }
});
};

var parseAccountFromRow = function (row) {
	return new Account(parseInt(row.ID), row.Username, row.CookieKey, 
   row.CookieExp, row.CreatedOn, parseInt(row.Currency));
};

var updateAccountFromRow = function (account, row) {
	Account.apply(account, [parseInt(row.ID), row.Username, row.CookieKey, 
   row.CookieExp, row.CreatedOn, parseInt(row.Currency)]);
};

