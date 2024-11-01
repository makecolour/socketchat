let counter = 0;
let lastMessageId = null;
let messagesArr = [];
const socket = io({
    auth: {
        serverOffset: 0
    },
    ackTimeout: 2000,
    retries: 3,
});
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const username = prompt("Enter your username");
const room = 'chat';

socket.emit('join room', {name: username, room: room});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
        const clientOffset = `${socket.id}-${counter++}`;
        var message = {
            name: username,
            message: input.value,
            timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
        }
        socket.emit('send msg', message, room, clientOffset);
        messagesArr.push(message);
        renderMessages();
    }
});

socket.on('load more messages', (messages) => {
    messagesArr = messages.concat(messagesArr).filter((msg, index, self) =>
            index === self.findIndex((m) => (
                m.id === msg.id
            ))
    );
    renderMessages();
});

function loadMoreMessages() {
    if (lastMessageId && room) {
        socket.emit('load more messages', {room: room, lastMessageId: lastMessageId});
    }
}

function renderMessages() {
    messages.innerHTML = '';
    messagesArr.sort((a, b) => a.id - b.id).forEach((msg) => {
        const item = document.createElement('li');
        item.textContent = `${msg.name}: ${msg.message}`;
        item.title = msg.timestamp;
        if (msg.name === username) {
            item.style.textAlign = 'right';
        } else if (msg.name === 'System') {
            item.style.fontWeight = 'bold';
            item.style.textAlign = 'center';
        } else {
            item.style.textAlign = 'left';
        }
        messages.appendChild(item);
    });
    lastMessageId = messagesArr[0].id;
    window.scrollTo(0, document.body.scrollHeight);
}