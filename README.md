# Petshow

### How to run
First, make sure you have nodejs and NPM installed. To do so, follow [this guide](http://blog.nodeknockout.com/post/65463770933/how-to-install-node-js-and-npm).

To verify that node and npm are installed, invoke the commands 
`node -v` and `npm -version` to check the version of node and npm installed. Mac and Linux users: the command for node may be `nodejs` instead of `node`.

Afterwards, ensure git is installed on your machine and clone the repository. Invoke `npm install` in the root directory of the project to ensure the required dependencies for the app are also installed locally. 

Finally, invoke `node src/server/App.js` or `nodejs src/server/App.js` to bring up the server.

Navigate to `localhost:<port>`, where port is displayed in the command prompt to see a Hello World page. Currently, only the hello world page and Account API have been implemented (see Account.js for outwards facing API) and can be played around with. 

### Interacting with the SQL database
Firstly, install MySQL client: [Windows Stackoverflow Instructions](http://stackoverflow.com/questions/3246482/mysql-command-line-client-for-windows) [Mac Instructions](https://dev.mysql.com/doc/refman/4.1/en/macosx-installation.html)

Open up the file `src/Config.js` and find credentials and database information. You will need this for the next steps.

Then, invoke the command `mysql -h <server-addr> -u <username> -p` (replacing the addr and username with values in config) and type in the password found in the config. Once prompted with the mysql client prompt, type `USE <database>` to specify the database in the config. From there you are able to execute SQL commands.

Included with the code are two SQL files, setup and teardown. These can be executed (assuming you are in the project root directory) in the mysql client prompt by calling `SOURCE setup.sql;` or `SOURCE teardown.sql;`. Teardown deletes all tables and setup recreates the tables as empty tables. At all times, assume tables are in place and teardown should be called before setup. Note that calling either essentially clears out the database and that the database is shared amongst all instances (adding a new account via one deployed instance of the app will appear on all deployed instances of the app).
