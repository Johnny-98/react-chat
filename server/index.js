import cors from 'cors';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);

//server holds user and chat info
const users = []; 
const chathistory = [];

app.use(cors());
app.use(express.json()); // Parse JSON requests

const io = new Server(server, {
    cors:{
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.put('/api/test/edit_message', (req, res) => {
  const { messageId, newMessage } = req.body;
  const index = chathistory.findIndex((message) => message.key === messageId);
  if (index !== -1) {
      chathistory[index].message = newMessage;
      // Emit updated chat history to all clients
      io.emit('chat_history', chathistory);
      res.status(200).send(chathistory[index]); // Sending the updated message back to the client
  } else {
      res.status(404).send('Message not found');
  }
});

io.on('connection', (socket) => {

  socket.on("log_in", (data)=> {
    if (users.includes(data)) {
      socket.emit('logged_in', `back ${data}!`);
    } else {
      socket.emit('logged_in', `${data}`);
      users.push(data); // Store the new username
    }
    socket.emit('chat_history', chathistory);
  })

  socket.on("send_message", (data) => {
    chathistory.push(data);
    socket.broadcast.emit('chat_history', chathistory);
  });

  socket.on("edit_message", (data) => {
    const { messageId, newMessage } = data;
    const index = chathistory.findIndex((message) => message.key === messageId);
    if (index !== -1) {
        chathistory[index].message = newMessage;
        io.emit('updated_message', chathistory[index]); // Emit the updated message
    }
});

  socket.on("log_out", (data)=>{
    //console.log(`USER ${data} with ID ${socket.id} logged out`);
  })

  socket.on("disconnect", ()=> {
    // console.log("User Disconnected", socket.id)
  });
});

server.listen(3001, () => {
  console.log('Server running on port 3001');
});
