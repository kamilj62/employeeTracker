const mySql = require('mysql2');

require('dotenv').config();


const db = mySql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Dromedar62!',
  database: 'employees_db'
},
    console.log(`Connected to the employees_db database.`)
);

module.exports = db;