const socket = io('http://localhost:3000');
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const chatMembers = document.getElementById('members-icons');
const roomsList = document.getElementById('chat-rooms-list');

const userName = prompt('What is your name?');
socket.emit('new-user', userName);
let currentChatRoomId = null;
let chatRoomsList = {};
let userId = null;

socket.on('user-connected', data => {
  const adminChatElement = addChatRoom(0, "Admin");
  adminChatElement.classList.add('selected-chat-room');
  chatRoomsList[0] = [];
  currentChatRoomId = 0;
  roomsList.appendChild(adminChatElement);

  userId = data.id;
  for (let socketId in data.usersList) {
    appendMember(data.usersList[socketId], socketId);
    if (socketId === data.id) {
      continue;
    }
    chatRoomsList[socketId] = [];
    const groupElement = addChatRoom(socketId, data.usersList[socketId]);
    roomsList.appendChild(groupElement);
  }
});

socket.on('chat-message', data => {
  chatRoomsList[data.targetRoomId].push(data.message);
  if (currentChatRoomId == data.targetRoomId) {
    appendMessage(data.message);
  }
});

socket.on("new-chat", data => {
  chatRoomsList[data.id] = [];
  let newGroup = addChatRoom(data.id, data.name);
  roomsList.append(newGroup);

  if(currentChatRoomId == 0) {
    appendMember(data.name, data.id);
  }
})

socket.on('all-members', allUsers => {
  let listOfMembers = {};
  listOfMembers = allUsers;
  setMembers(listOfMembers);
})

socket.on('user-disconnected', socketId => {
  delete chatRoomsList[socketId];
  let chatElements = document.querySelectorAll(`div[data-id=${socketId}]`);
    chatElements.forEach(chatElement => {
        chatElement.parentNode.removeChild(chatElement);
    });

  if(currentChatRoomId == socketId){
    openChatRoom(0, 'Admin');
  }
});

messageForm.addEventListener('submit', e => {
  e.preventDefault();
  const message = messageInput.value;
  let messageInfo = {id: userId, senderName: userName, message: message};
  chatRoomsList[currentChatRoomId].push(messageInfo);
  appendSelfMessage(messageInfo);

  const dataToSend = {messageInfo: messageInfo, targetRoomId: userId};
  if(currentChatRoomId == 0){
    dataToSend.targetRoomId = 0;
  }
  socket.emit('send-chat-message', dataToSend);

  messageInput.value = '';
})

roomsList.addEventListener('click', function(event) {
  if (event.target.classList.contains('room')) {
    let id = event.target.getAttribute('data-id');
    let name = event.target.getAttribute('data-name');
    openChatRoom(id, name);
  }
});

function openChatRoom(id, name) {
  if (currentChatRoomId === id) {
      return;
  }
  currentChatRoomId = id;

  const roomElements = document.querySelectorAll('.room');
  roomElements.forEach(room => {
      if (room.getAttribute('data-id') == id) {
          room.classList.add('selected-chat-room');
      } else {
          room.classList.remove('selected-chat-room');
      }
  });

  document.querySelector('.chat-name').textContent = `Chat room ${name}`;
  messageContainer.innerHTML = '';
  chatRoomsList[currentChatRoomId].forEach(messageInfo => {
      if (messageInfo.id === userId) {
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
    listOfMembers[userId] = userName;
    setMembers(listOfMembers);
  }
}

function addChatRoom(id, name) {
  const groupElement = document.createElement('div');
  groupElement.classList.add('room');
  groupElement.setAttribute('data-id', id);
  groupElement.setAttribute('data-name', name);
  groupElement.innerHTML = `
    <span>
      <i class="fa-solid fa-circle-user fa-2xl" style="color: #ffffff;"></i>
    </span> 
    <span>
      ${name}
    </span>
  `;
  return groupElement;
}

function setMembers(listOfMembers) {
  while (chatMembers.firstChild) {
    chatMembers.removeChild(chatMembers.firstChild);
  }
  for (let socketId in listOfMembers) {
    appendMember(listOfMembers[socketId], socketId);
  }
}

function appendMember(name, id) {
  const memberElement = document.createElement('div');
  memberElement.classList.add('chat-user');
  memberElement.setAttribute('data-id', id);
  memberElement.innerHTML = `
    <span>
      <i class="fa-solid fa-circle-user fa-2xl" style="color: #b3b3b3;"></i>
    </span> 
    <span class="member-name">
      ${name}
    </span>
  `;
  chatMembers.appendChild(memberElement);
}

function appendMessage(messageInfo) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message-box');
  messageElement.innerHTML = `
    <div class="chat-user">
      <span>
        <i class="fa-solid fa-circle-user fa-2xl" style="color: #b3b3b3;"></i>
      </span> 
      <span class="member-name">
        ${messageInfo.senderName}
      </span>
    </div>
    <div class="chat-message">
      <span>${messageInfo.message}</span>
    </div>
  `;
  messageContainer.appendChild(messageElement);
}

function appendSelfMessage(messageInfo) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message-box', 'self-message-box');
  messageElement.innerHTML = `
    <div class="chat-message self-message">
      <span>${messageInfo.message}</span>
    </div>
    <div class="chat-user">
      <span>
        <i class="fa-solid fa-circle-user fa-2xl" style="color: #b3b3b3;"></i>
      </span> 
      <span class="member-name">
        You
      </span>
    </div>
  `;  
  messageContainer.appendChild(messageElement);
}