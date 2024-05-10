const socket = io('http://localhost:4444');
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const chatMembersNames = document.getElementById('members-names');
const roomsList = document.getElementById('chat-rooms-list');

const userName = prompt('What is your name?');
socket.emit('new-user', userName);
let currentChatRoomId = null;
let chatRoomList = {};
let myId = 0;

socket.on('user-connected', data => {
  const allChatElement = addGroup(0, "All");
  chatRoomList[0] = [];
  roomsList.appendChild(allChatElement);

  myId = data.id;

  for (let socketId in data.usersList) {
    if (socketId === data.id) {
      continue;
    }
    chatRoomList[socketId] = [];
    const groupElement = addGroup(socketId, data.usersList[socketId]);
    roomsList.appendChild(groupElement);
  }
});

function addGroup(id, name) {
  const groupElement = document.createElement('div');
  groupElement.classList.add('room');
  groupElement.setAttribute('data-id', id);
  groupElement.setAttribute('data-name', name);
  groupElement.innerHTML = `
    <span>${name}</span>
  `;
  return groupElement;
}

socket.on('chat-message', data => {
  console.log(data.targetRoomId);
  console.log(chatRoomList); 
  chatRoomList[data.targetRoomId].push(data.message);
  if (data.currentChatRoomId == data.targetRoomId) {
    appendMessage(data.message);
  }
});


socket.on("new-chat", data => {
  chatRoomList[data.id] = [];
  let newGroup = addGroup(data.id, data.name);
  roomsList.append(newGroup);

  if(currentChatRoomId == 0) {
    appendMember(data.name);
  }
})

messageForm.addEventListener('submit', e => {
  e.preventDefault();
  const message = messageInput.value;
  let messageInfo = {id: myId, senderName: userName, message: message};
  console.log(chatRoomList);
  chatRoomList[currentChatRoomId].push(messageInfo);
  appendSelfMessage(messageInfo);

  console.log("room : " + currentChatRoomId);
  const dataToSend = {messageInfo: messageInfo, targetRoomId: myId};
  if(currentChatRoomId == 0){
    dataToSend.targetRoomId = 0;
  }
  socket.emit('send-chat-message', dataToSend);

  messageInput.value = '';
})

function appendMessage(messageData) {
  const messageElement = document.createElement('div');
  messageElement.innerText = `${messageData.senderName}: ${messageData.message}`;
  messageContainer.appendChild(messageElement);
}

function appendSelfMessage(messageData) {
  const messageElement = document.createElement('div');
  messageElement.innerText = `You: ${messageData.message}`;
  messageContainer.append(messageElement);
}

roomsList.addEventListener('click', function(event) {
  if (event.target.classList.contains('room')) {
    let id = event.target.getAttribute('data-id');
    let name = event.target.getAttribute('data-name');

    if (currentChatRoomId == id) {
      return;
    }

    currentChatRoomId = id;

    document.querySelector('.chat-name').textContent = `Chat room ${name}`;

    messageContainer.innerHTML = '';

    chatRoomList[id].forEach(messageInfo => {
      if (messageInfo.id == myId) {
        appendSelfMessage(messageInfo);
      } else {
        appendMessage(messageInfo);
      }
    });

    if (id == 0) {
      socket.emit('get-all-members');
    } else {
      let listOfMembers = {};
      listOfMembers[id] = name;
      listOfMembers[myId] = userName;
      setMembers(listOfMembers);
    }
  }
});


socket.on('all-members', allUsers => {
  let listOfMembers = {};
  listOfMembers = allUsers;
  setMembers(listOfMembers);
})

function setMembers(listOfMembers) {
  while (chatMembersNames.firstChild) {
    chatMembersNames.removeChild(chatMembersNames.firstChild);
  }
  for (let socketId in listOfMembers) {
    appendMember(listOfMembers[socketId]);
  }
}

function appendMember(name) {
  const memberElement = document.createElement('div');
  memberElement.classList.add('chat-user');
  memberElement.innerHTML = `
    <span>
      ${name}
    </span>
  `;
  chatMembersNames.appendChild(memberElement);
}

socket.on('user-disconnected', socketId => {
  delete chatRoomList[socketId];
  let chatToDelete = document.querySelector('div[data-id="' + socketId + '"]');
  if (chatToDelete) {
    chatToDelete.parentNode.removeChild(chatToDelete);
  }
});