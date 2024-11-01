angular.module('chatApp', [])
    .controller('ChatController', function ($scope) {
        let counter = 0;
        let lastMessageId = null;
        const socket = io({
            auth: {
                serverOffset: 0
            },
            ackTimeout: 2000,
            retries: 3,
        });

        $scope.connected = false;
        $scope.messages = [];
        $scope.myId = '';
        $scope.friendId = '';
        $scope.newMessage = '';
        $scope.room = '';

        $scope.connect = function () {
            if ($scope.myId && $scope.friendId) {
                if ($scope.myId < $scope.friendId) {
                    $scope.room = $scope.myId + '_' + $scope.friendId;
                } else {
                    $scope.room = $scope.friendId + '_' + $scope.myId;
                }
                socket.emit('join room', {name: $scope.myId, room: $scope.room}, (error) => {
                    if (error) {
                        console.error(error);
                        return;
                    }
                });
                console.log('Connected to room:', $scope.room);
                $scope.connected = true;
            } else {
                alert('Please enter both IDs to start the chat');
            }
        };

        $scope.sendMessage = function (newMessage = '') {
            if (newMessage) {
                const clientOffset = `${socket.id}-${counter++}`;
                var message = {
                    name: $scope.myId,
                    message: newMessage,
                    timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
                };
                socket.emit('send msg', message, $scope.room, clientOffset);
                $scope.$applyAsync(() => {
                    $scope.messages.push(message);
                    $scope.newMessage = '';
                    $scope.scrollToBottom();
                });
            }
        };

        $scope.loadMoreMessages = function () {
            if (lastMessageId && $scope.room) {
                socket.emit('load more messages', {room: $scope.room, lastMessageId: lastMessageId});
            }
        };

        socket.on('load more messages', function (messages) {
            $scope.$apply(function () {
                $scope.messages = messages.concat($scope.messages).filter((message, index, self) =>
                    index === self.findIndex((m) => m.id === message.id)
                );
                $scope.messages.sort((a, b) => a.id - b.id);
                lastMessageId = $scope.messages[0].id;
                $scope.scrollToBottom();
            });
        });

        $scope.scrollToBottom = function () {
            setTimeout(() => {
                const chatWindow = document.querySelector('.chat-window');
                if (chatWindow) {
                    chatWindow.scrollTo({
                        top: chatWindow.scrollHeight,
                        behavior: 'smooth',
                        speed: 1000
                    });
                }
            }, 100);
        };

        $scope.reset = function () {
            socket.emit('leave room', $scope.room);
            $scope.$applyAsync(() => {
                $scope.connected = false;
                $scope.messages = [];
                $scope.myId = '';
                $scope.friendId = '';
                $scope.newMessage = '';
                $scope.room = '';
            });
        };

        $scope.checkEnter = function (event, element) {
            if (event.key === 'Enter') {
                $scope.sendMessage(element);
                element = '';
            }
        };
    });
