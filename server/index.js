import cors from 'cors';
import express from 'express';
import fs from 'fs';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
    cors:{
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
  // console.log(`User ${socket.id} connected`);
  socket.on("log_in", (data)=>{
    console.log(`USER ${data} with ID ${socket.id} logged in`);
  })

  socket.on("send_message", (data) => {
    //broadcast to everyone on the network 
    socket.broadcast.emit("receive_message", data)
  });

  socket.on("disconnect", ()=> {
    console.log("User Disconnected", socket.id)
  });
});

server.listen(3001, () => {
  console.log('Server running on port 3001');
});
