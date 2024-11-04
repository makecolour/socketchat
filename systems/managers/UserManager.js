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

db.getMessages = async (room, limit = 50, lastMessageId = null) => {
    let rows;
    try {
        if (lastMessageId) {
            [rows] = await db.promise().query(
                'SELECT id, message, room, username, timestamp FROM chat WHERE room = ? AND id < ? ORDER BY id DESC LIMIT ?',
                [room, lastMessageId, limit]
            );
        } else {
            [rows] = await db.promise().query(
                'SELECT id, message, room, username, timestamp FROM chat WHERE room = ? ORDER BY id DESC LIMIT ?',
                [room, limit]
            );
        }
    } catch (e) {
        if (e.errno === 1062) {
            return;
        } else {
            console.error('Error getting messages:', e);
            return;
        }
    }
    return rows;
};

db.insertMessage = async (clientOffset, username, message, room, timestamp) => {
    let result;
    try {
        result = await db.promise().query('INSERT INTO chat (client_offset, username, message, room, timestamp) VALUES (?, ?, ?, ?, ?)', [clientOffset, username, message, room, timestamp]);
    } catch (e) {
        if (e.errno === 1062) {
            return;
        } else {
            console.error('Error inserting message:', e);
            return;
        }
    }
    return result;
};

module.exports = db;