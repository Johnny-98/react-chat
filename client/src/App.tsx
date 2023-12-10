import React, { useEffect, useState } from 'react';
import * as io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import "./App.css";
import Chat from './Chat';

const App: React.FC = () => {
  const socket: Socket = io.connect("http://localhost:3001")
  const[username, setUsername] = useState("");

  const login = () => {
    if(username !== ""){
      socket.emit("log_in", username)
    }
  };

  return (
    <div className="App">

        <div>
          {/* accessing value of input */}
          <input 
            type="text"  
            placeholder='type username' 
            onChange={(event) => { setUsername(event.target.value)}}/>
          <button onClick={login} >Login</button>
        </div>

        <Chat socket={socket} username={username} />

    </div>
  );
}

export default App;
