import { useState } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';
import { Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { Message } from './App';
interface chatType {
    socket: Socket;
    username: string; 
    chatHistory: Message[];
}


function Chat({socket, username, chatHistory}:chatType) {
    const [currentMessage, setCurrentMessage] = useState('');

    const sendMessage = () => {
        if(currentMessage!== '') {
            const messageData = {
                key: uuidv4(),
                author: username,
                message: currentMessage,
                time: 
                    new Date(Date.now()).getHours() +
                    ':' + 
                    new Date(Date.now()).getMinutes()
            };
            socket.emit('send_message', messageData );
            setCurrentMessage('')
        }
    };

    return (
        <div className='chat-window'>
            <div className='chat-header'>
                <p>Live chat</p>
            </div>
            <div className='chat-body'>
                <ScrollToBottom className='message-container'>
                    {chatHistory.map((messageContent)=>{
                        return <div className='message' id={username === messageContent.author ? 'you' : 'other'}>
                            <div>
                                <div className='message-content'>
                                    <p>{messageContent.message}</p>
                                </div>
                                <div className='message-meta'>
                                <p id='time'>{messageContent.time}</p>
                                <p id='author'>{messageContent.author}</p>
                                </div>
                            </div>
                        </div>
                    })}
                </ScrollToBottom>
            </div>
            <div className='chat-footer'>
                <input 
                    type='text'  
                    placeholder='Type your message here...'
                    value={currentMessage}
                    onChange={(event) => { 
                        setCurrentMessage(event.target.value)
                    }}
                    onKeyDown={(event) =>{
                        event.key === 'Enter' && sendMessage()
                    }}
                />
                <button onClick={sendMessage}>&#9658;</button>
            </div>
        </div>
    );
}

export default Chat;
