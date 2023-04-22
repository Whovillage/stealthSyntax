const router = express.Router();

// MySQL database configuration
const dbConfig = {
  host: 'localhost',
  user: 'your_mysql_username',
  password: 'your_mysql_password',
  database: 'your_mysql_database_name'
};

// Create MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Register new user route
router.post('/register', (req, res) => {
  // Get user input from request body
  const { username, password, email } = req.body;

  // Check if user already exists
  const checkUserQuery = `SELECT * FROM users WHERE username = '${username}' OR email = '${email}'`;
  pool.query(checkUserQuery, (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (result.length > 0) {
      // User already exists
      return res.status(409).send('User already exists');
    } else {
      // Insert new user into database
      const insertUserQuery = `INSERT INTO users (username, password, email) VALUES ('${username}', '${password}', '${email}')`;
      pool.query(insertUserQuery, (err, result) => {
        if (err) {
          return res.status(500).send(err);
        }
        return res.status(201).send('User created successfully');
      });
    }
  });
});

module.exports = router;