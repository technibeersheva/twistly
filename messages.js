// Messaging system

const MESSAGES_KEY = 'twistly-messages';

// Load all messages from localStorage
function loadMessages() {
  const msgs = localStorage.getItem(MESSAGES_KEY);
  return msgs ? JSON.parse(msgs) : [];
}

// Save messages to localStorage
function saveMessages(messages) {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

// Get conversations: unique pairs involving current user
function getConversations(currentEmail) {
  const messages = loadMessages();
  const convos = {};

  messages.forEach(msg => {
    if (msg.from === currentEmail || msg.to === currentEmail) {
      const other = msg.from === currentEmail ? msg.to : msg.from;
      if (!convos[other]) convos[other] = [];
      convos[other].push(msg);
    }
  });

  // Sort messages per conversation by time ascending
  Object.keys(convos).forEach(key => {
    convos[key].sort((a, b) => a.createdAt - b.createdAt);
  });

  return convos;
}

// Render conversations list
function renderConversations(currentEmail) {
  const list = document.getElementById('conversations-list');
  if (!list) return;

  list.innerHTML = '';
  const convos = getConversations(currentEmail);
  const otherEmails = Object.keys(convos);

  if (otherEmails.length === 0) {
    list.innerHTML = '<p style="color:#d996c6;">No conversations yet.</p>';
    return;
  }

  otherEmails.forEach(email => {
    const user = getUserByEmail(email);
    const li = document.createElement('div');
    li.className = 'conversation-item';
    li.textContent = user ? user.username : email;
    li.dataset.email = email;

    li.onclick = () => openChat(email);

    list.appendChild(li);
  });
}

// Render chat messages with selected user
function renderChat(currentEmail, otherEmail) {
  const chatMessages = document.getElementById('chat-messages');
  const chatHeader = document.getElementById('chat-header-username');
  if (!chatMessages || !chatHeader) return;

  const user = getUserByEmail(otherEmail);
  chatHeader.textContent = user ? user.username : otherEmail;

  const messages = loadMessages();
  const chatMsgs = messages.filter(m =>
    (m.from === currentEmail && m.to === otherEmail) ||
    (m.from === otherEmail && m.to === currentEmail)
  ).sort((a, b) => a.createdAt - b.createdAt);

  chatMessages.innerHTML = '';
  chatMsgs.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'chat-message';
    if (msg.from === currentEmail) div.classList.add('self');
    div.textContent = msg.text;
    chatMessages.appendChild(div);
  });

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message
function sendMessage(from, to, text) {
  if (!text.trim()) return;
  const messages = loadMessages();
  messages.push({
    id: 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    from,
    to,
    text: text.trim(),
    createdAt: Date.now()
  });
  saveMessages(messages);
}

// Open chat with user
function openChat(otherEmail) {
  const chatWindow = document.getElementById('chat-window');
  chatWindow.dataset.otherEmail = otherEmail;
  chatWindow.classList.remove('hidden');
  renderChat(getCurrentUser().email, otherEmail);
}

// Close chat window
function closeChat() {
  const chatWindow = document.getElementById('chat-window');
  chatWindow.classList.add('hidden');
  chatWindow.dataset.otherEmail = '';
}

// Get user by email (reuse)
function getUserByEmail(email) {
  const users = JSON.parse(localStorage.getItem('twistly-users') || '[]');
  return users.find(u => u.email === email) || null;
}

// Get current logged in user (reuse)
function getCurrentUser() {
  const session = localStorage.getItem('twistly-session');
  if (!session) return null;
  const users = JSON.parse(localStorage.getItem('twistly-users') || '[]');
  return users.find(u => u.email === session) || null;
}

// Init messaging page
document.addEventListener('DOMContentLoaded', () => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert('Please login first.');
    window.location.href = 'index.html';
    return;
  }

  renderConversations(currentUser.email);

  // Message form submit
  const msgForm = document.getElementById('message-form');
  if (msgForm) {
    msgForm.addEventListener('submit', e => {
      e.preventDefault();
      const chatWindow = document.getElementById('chat-window');
      const otherEmail = chatWindow.dataset.otherEmail;
      const input = msgForm['message-input'];
      if (!otherEmail) return alert('No chat open.');

      sendMessage(currentUser.email, otherEmail, input.value);
      input.value = '';
      renderChat(currentUser.email, otherEmail);
    });
  }

  // Close chat button
  const closeBtn = document.getElementById('chat-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeChat);
  }
});
