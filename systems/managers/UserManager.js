const mysql = require('mysql2');
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database.');

    const createChatTableQuery = `
        CREATE TABLE IF NOT EXISTS chat
        (
            id
            INT
            AUTO_INCREMENT
            PRIMARY
            KEY,
            client_offset
            VARCHAR
        (
            255
        ) UNIQUE DEFAULT NULL,
            username VARCHAR
        (
            255
        ) NOT NULL,
            message TEXT NOT NULL,
            room VARCHAR
        (
            255
        ) NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
    `;

    db.query(createChatTableQuery, (err, result) => {
        if (err) {
            console.error('Error creating chat table:', err);
            return;
        }
        console.log('Chat table created or already exists.');
    });
});

module.exports = db;