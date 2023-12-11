import React, { useState } from 'react';
import * as io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import './App.css';
import Chat from './Chat';

const App: React.FC = () => {
  const socket: Socket = io.connect('http://localhost:3001')
  const[username, setUsername] = useState('');
  const[showChat, setShowChat] = useState(false);

  const login = () => {
    if(username !== ''){
      socket.emit('log_in', username)
      setShowChat(true);
    }
  };

  return (
    <div className='App'>
      {!showChat ? (
        <div className='joinChatContainer'>
          <h3>Join chat</h3>
          <input 
            type='text'  
            placeholder='type username' 
            //accessing value of input
            onChange={(event) => {
              setUsername(event.target.value)
            }}
            onKeyDown={(event) => {
              event.key === 'Enter' && login()
            }}
          />
          <button onClick={login} >Login</button>
        </div>
        ):(
          <div>
            <p>Hello {username}</p>
            <button>Log  out</button>
            <p />
            <Chat socket={socket} username={username} />
          </div> 
      )}
    </div>
  );
}

export default App;
