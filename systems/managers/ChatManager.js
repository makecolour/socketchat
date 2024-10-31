module.exports = (io, db) => {
    io.on('connection', (socket) => {
        socket.on('disconnect', (reason) => {
            console.log(`user ${socket.username} disconnected due to: ${reason}`);
        });

        function receiveMessages(rows, room = 'general', mode = 'view') {
            switch (mode) {
                case "view":
                    socket.emit('load more messages', rows.map(row => ({
                        name: row.username,
                        message: row.message,
                        id: row.id,
                        timestamp: row.timestamp
                    })));
                    break;
                case "send":
                    socket.to(room).emit('load more messages', rows.map(row => ({
                        name: row.username,
                        message: row.message,
                        id: row.id,
                        timestamp: row.timestamp
                    })));
                    break;
                default:
                    return;
            }
        }

        socket.on('join room', async ({name: username, room: room}) => {
            if (!socket.rooms.has(room)) {
                socket.join(room);
                socket.username = username;
                console.log(`user ${username} joined room: ${room}`);
                try {
                    const [rows] = await db.promise().query(
                        'SELECT id, message, room, username, timestamp FROM chat WHERE room = ? ORDER BY id DESC LIMIT 20',
                        [room]
                    );
                    receiveMessages(rows, room)
                } catch (e) {
                    console.error('Error fetching messages:', e);
                }
            }
        });

        socket.on('send msg', async ({name: username, message: msg, timestamp: time}, room, clientOffset) => {
            let result;
            try {
                result = await db.promise().query('INSERT INTO chat (client_offset, username, message, room, timestamp) VALUES (?, ?, ?, ?, ?)', [clientOffset, username, msg, room, time]);
            } catch (e) {
                if (e.errno === 1062) {
                    return;
                } else {
                    console.error('Error inserting message:', e);
                    return;
                }
            }
            var newMessages = [{
                name: username,
                message: msg,
                id: result[0].insertId,
                timestamp: time
            }]
            receiveMessages(newMessages, room, 'send');
        });

        let isLoadingMoreMessages = false;

        socket.on('load more messages', async ({room, lastMessageId}) => {
            if (isLoadingMoreMessages) return;
            isLoadingMoreMessages = true;
            try {
                const [rows] = await db.promise().query(
                    'SELECT id, message, room, username, timestamp FROM chat WHERE room = ? AND id < ? ORDER BY id DESC LIMIT 20',
                    [room, lastMessageId]
                );
                receiveMessages(rows, room, 'view');
            } catch (e) {
                console.error('Error fetching more messages:', e);
            } finally {
                isLoadingMoreMessages = false;
            }
        });

        socket.on('leave room', (room) => {
            socket.leave(room);
            console.log(`user ${socket.username} left room: ${room}`);
        });
    });
};