import React, { useEffect, useState } from 'react';
import * as io from 'socket.io-client';
import { Socket } from 'socket.io-client';

const App: React.FC = () => {
  const socket: Socket = io.connect("http://localhost:3001")

  const[message, setMessage] = useState("");
  const[messageReceived, setMessageReceived] = useState("");

  const sendMessage = () => {
    socket.emit("send_message",{message});
  }

  // funtion that runs every time any event is thrown to me on the socked.io server 
  useEffect(() => {
    socket.on("receive_message", (data: { message: string }) => {
      setMessageReceived(data.message)
    })
  }, [socket])

  return (
    <div className="App">
      <input onChange={(event) => {
        setMessage(event.target.value)
      }}/>
      <button onClick={sendMessage}>Send Message</button>
      <h1> Message:</h1>
      {messageReceived}
    </div>
  );
}

export default App;
