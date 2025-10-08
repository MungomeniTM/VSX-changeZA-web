const API_BASE = "http://127.0.0.1:8000/api";

document.addEventListener("DOMContentLoaded", () => {
  const chatList = document.getElementById("chatList");
  const chatMessages = document.getElementById("chatMessages");
  const chatWith = document.getElementById("chatWith");
  const sendBtn = document.getElementById("sendBtn");
  const messageInput = document.getElementById("messageInput");

  let currentChatUser = null;

  // Fetch user list (fake for now)
  const users = [
    { id: 1, name: "Alien Engineer 👽" },
    { id: 2, name: "Cyber Coder 🧬" },
    { id: 3, name: "VSX Builder ⚡" }
  ];

  users.forEach(u => {
    const div = document.createElement("div");
    div.className = "chat-user";
    div.textContent = u.name;
    div.onclick = () => openChat(u);
    chatList.appendChild(div);
  });

  function openChat(user) {
    currentChatUser = user;
    chatWith.textContent = `Chat with ${user.name}`;
    chatMessages.innerHTML = "";
  }

  sendBtn.onclick = () => {
    const text = messageInput.value.trim();
    if (!text || !currentChatUser) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = "message sent";
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);

    messageInput.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };
});