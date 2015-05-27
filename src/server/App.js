var APP_PORT = 3750;

var MySql = require('./MySql.js');
MySql.init();

var Account = require('./Account.js');
var Solution = require('./Solution.js');
var Gift = require('./Gift.js');
var World = require('./World.js');
var Level = require('./Level.js');
var Pet = require('./Pet.js');
var ServerTest = require('./ServerTest.js');

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());

// Serve contents of client folder statically
app.use('/client', express.static('src/client'));
app.use('/test', express.static('src/test'));

app.get('/', function (req, res) {
	MySql.query('SELECT Message FROM Dummy;', function(rows) {
		res.send(rows[0]['Message']);
	});
});

// Attach all external page handlers
Account.attachPageHandlers(app);
Solution.attachPageHandlers(app);
Gift.attachPageHandlers(app);
World.attachPageHandlers(app);
Level.attachPageHandlers(app);
Pet.attachPageHandlers(app);
ServerTest.attachPageHandlers(app);

var server = app.listen(APP_PORT, function () {
	console.log('Petshow server live locally on port %s.', server.address().port);
});