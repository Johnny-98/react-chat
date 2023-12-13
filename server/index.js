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

//handle message editing
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

// handle message removal
app.delete('/api/test/delete_message', (req, res) => {
  const { messageId } = req.body;
  const index = chathistory.findIndex((message) => message.key === messageId);
  if (index !== -1) {
    const deletedMessage = chathistory.splice(index, 1)[0]; // Remove the message from the chat history
    io.emit('message_deleted', deletedMessage); // Emit event notifying about message deletion
    res.status(200).send(deletedMessage);
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
    // js conventional way to determine if the element exists in the array or not
    if (index !== -1) {
        chathistory[index].message = newMessage;
        io.emit('updated_message', chathistory[index]); // Emit the updated message
    }
  });

  socket.on("delete_message", (data) => {
    const { messageId } = data;
    const index = chathistory.findIndex((message) => message.key === messageId);
    if (index !== -1) {
      const deletedMessage = chathistory.splice(index, 1)[0]; // Remove the message from the chat history
      io.emit('message_deleted', deletedMessage); // Emit event notifying about message deletion
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
