document.addEventListener("DOMContentLoaded", () => {
  const chatList = document.getElementById("chatList");
  const chatMessages = document.getElementById("chatMessages");
  const chatWith = document.getElementById("chatWith");
  const sendBtn = document.getElementById("sendBtn");
  const messageInput = document.getElementById("messageInput");

  let currentChatUser = null;

  // Temporary sample users
  const users = [
    { id: 1, name: "Alien Engineer 👽" },
    { id: 2, name: "Cosmic Builder ⚡" },
    { id: 3, name: "Quantum Collaborator 🧬" },
  ];

  users.forEach(user => {
    const div = document.createElement("div");
    div.className = "chat-user";
    div.textContent = user.name;
    div.onclick = () => openChat(user);
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

    // Simulate reply
    setTimeout(() => {
      const reply = document.createElement("div");
      reply.className = "message received";
      reply.textContent = `Received: "${text}"`;
      chatMessages.appendChild(reply);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 700);
  };
});