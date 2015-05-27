var config = require('./Config.js');

var mysql = require('mysql');
var connection = null;

module.exports.init = function () {
	if (connection == null) {
		connection = mysql.createConnection({
			host: config.mysql.host,
			user: config.mysql.user,
			password: config.mysql.password,
			database: config.mysql.database
		});
		
		connection.connect();
	}
};

module.exports.escape = function (str) {
	return mysql.escape(str);
};

module.exports.query = function (query, callback) {
	module.exports.init();
	connection.query(query, function (err, rows, fields) {
		if (err) {
			console.log('Error while performing query "%s":\n\t%s', query, err);
		} else {
			callback(rows);
		}
	});
};

module.exports.close = function () {
	if (connection != null) {
		connection.end();
	}
};

// Convert javascript Date to SQL DATETIME
function twoDigits(d) {
  if(0 <= d && d < 10) return "0" + d.toString();
  if(-10 < d && d < 0) return "-0" + (-1*d).toString();
  return d.toString();
}

module.exports.dateToDateTime = function (date) {
	return date.getUTCFullYear() + "-" + twoDigits(1 + date.getUTCMonth()) + 
			"-" + twoDigits(date.getUTCDate()) + " " + twoDigits(date.getUTCHours()) +
			":" + twoDigits(date.getUTCMinutes()) + ":" + 
			twoDigits(date.getUTCSeconds());
};

module.exports.dateToTime = function (date) {
    return twoDigits(date.getUTCHours()) +
            ":" + twoDigits(date.getUTCMinutes()) + ":" + 
            twoDigits(date.getUTCSeconds());
};