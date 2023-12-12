import React, { useEffect, useState } from 'react';
import * as io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import './App.css';
import Chat from './Chat';

export interface Message {
  key: string;
  author: string
  message: string;
  time: string
}

const App: React.FC = () => {
  const socket: Socket = io.connect('http://localhost:3001')
  const[username, setUsername] = useState('');
  const[loginMessage, setLoginMessage] = useState('');
  const[showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  const login = () => {
    if(username !== '') {
      socket.emit('log_in', username);
      setShowChat(true);
    }
  };

  const logout = () => {
    if(username !== '') {
      socket.emit('log_out', username);
      setShowChat(false);
      setUsername('');
    }
  };

  useEffect(() => {
    socket.on('logged_in', setLoginMessage);
  }, [socket]);

  useEffect(() => {
    socket.on('chat_history', (history: Message[]) => {
        setChatHistory(history);
    });
}, [socket]);

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
          <button onClick={login} >Log in</button>
        </div>
        ):(
          <div>
            <p>{loginMessage}</p>
            <button onClick={logout}>Log out</button>
            <p />
            <Chat socket={socket} username={username} chatHistory={chatHistory} /> 
          </div> 
      )}
    </div>
  );
}

export default App;
