import React, { useEffect, useState } from 'react';
import { Button, Card, Container } from 'react-bootstrap';
import * as io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import Chat from './Chat';
import './styles/App.css';
import './styles/login.css';

export interface Message {
  key: string;
  author: string
  message: string;
  time: string;
  updated: boolean;
  isEditing?: boolean;
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

  // login check
  useEffect(() => {
    socket.on('logged_in', (message: string) => {
      setLoginMessage(message);
      setShowChat(true); // Show the chat when the user is logged in
    });

    socket.on('users_update', (usersArray: string[]) => {
      if (usersArray.length === 0) {
        setShowChat(false); // Hide the chat when the users array is empty
      }
    });
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
  <div>
    {!showChat ? (
      <div className="app-background">
        <div className=" background">
          <div className="form-card">
            <h1 className="form-title">
                Welcome 🐶
            </h1>
            <div className="form-subtitle">
              Select your username to get started
            </div>
            <div className="auth">
                <div className="auth-label">Username</div>
                <div>
                <input 
                  className="auth-input" 
                  name="username" 
                  type='text'  
                  placeholder='type username' 
                  onChange={(event) => {
                    setUsername(event.target.value)
                  }}
                  onKeyDown={(event) => {
                    event.key === 'Enter' && login()
                  }}/>
                </div>
                <button className="auth-button" type="submit" onClick={login}>Authenticate</button>
            </div>
          </div>
        </div>
      </div>
      ):(
        <Container className="mt-4 chat-window">
          <Card>
            <Card.Header className='chat-header d-flex justify-content-between align-items-center'>
              <h5>Welcome {loginMessage || ('back ' + username + '!')}</h5>
              <Button className='logout-button' variant="success" onClick={logout}><b>Log out</b></Button>
            </Card.Header>
            <Chat socket={socket} username={username} chatHistory={chatHistory} setChatHistory={setChatHistory}/> 
          </Card>
        </Container>
    )}
  </div>
);
}

export default App;
