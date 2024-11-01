module.exports = (io, db) => {
    io.on('connection', (socket) => {
        socket.on('disconnect', (reason) => {
            console.log(`user ${socket.username} disconnected due to: ${reason}`);
        });

        let isLoadingMoreMessages = false;

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
                var limit = 20;
                if (room === 'general' || room === 'chat') {
                    limit = 50;
                }
                console.log(`user ${username} joined room: ${room}`);
                isLoadingMoreMessages = true;
                let rows = await db.getMessages(room, limit);
                receiveMessages(rows, room, 'view');
                isLoadingMoreMessages = false;
            }
        });

        socket.on('send msg', async ({name: username, message: msg, timestamp: time}, room, clientOffset) => {
            let result = await db.insertMessage(clientOffset, username, msg, room, time);
            if (result && result[0] && result[0].insertId) {
                var newMessages = [{
                    username: username,
                    message: msg,
                    id: result[0].insertId,
                    timestamp: time
                }];
                receiveMessages(newMessages, room, 'send');
            }
        });

        socket.on('load more messages', async ({room, lastMessageId}) => {
            if (isLoadingMoreMessages) return;
            isLoadingMoreMessages = true;
            var limit = 20;
            if (room === 'general' || room === 'chat') {
                limit = 50;
            }
            let rows = await db.getMessages(room, limit, lastMessageId);
            receiveMessages(rows, room, 'view');
            isLoadingMoreMessages = false;
        });

        socket.on('leave room', (room) => {
            socket.leave(room);
            console.log(`user ${socket.username} left room: ${room}`);
        });
    });
};