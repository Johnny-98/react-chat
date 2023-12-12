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
      localStorage.setItem('username', username);
    }
  };

  const logout = () => {
    if(username !== '') {
      socket.emit('log_out', username);
      setShowChat(false);
      setUsername('');
      localStorage.removeItem('username');
    }
  };

  // Get a simple message from the server depending if new user or not
  useEffect(() => {
    socket.on('logged_in', setLoginMessage);
  }, [socket]);


  //browser remembers users who logged in
  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    const savedChatHistory = localStorage.getItem('chatHistory');
    if (savedUsername) {
      setUsername(savedUsername);
      setShowChat(true);
    }
    //when reloading chat history dissapears so storing in localStorage is needed
    // this isn't ideal but chat is saved in-memory 
    if (savedChatHistory) {
      setChatHistory(JSON.parse(savedChatHistory));
    }
  }, []);

  useEffect(() => {
    socket.on('chat_history', (history: Message[]) => {
        setChatHistory(history);
        localStorage.setItem('chatHistory', JSON.stringify(history));
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
