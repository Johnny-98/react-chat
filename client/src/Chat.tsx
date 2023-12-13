import axios from 'axios';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';
import { Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { Message } from './App';
interface chatType {
    socket: Socket;
    username: string; 
    chatHistory: Message[];
    //Dispatch and SetStateAction are used to define 
    //setChatHistory as a function that updates an array of Message types.
    setChatHistory: Dispatch<SetStateAction<Message[]>>;
}

function Chat({socket, username, chatHistory, setChatHistory}:chatType) {
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
            // Update local chat history
            setChatHistory([...chatHistory, messageData]);
            // Clear the input field after sending the message
            setCurrentMessage('')
        }
    };

    useEffect(() => {
        // Retrieve chat history from local storage when component mounts
        // it could return null if the key doesn't exist in the storage
        const storedChatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        setChatHistory(storedChatHistory);
    }, [setChatHistory]);

    useEffect(() => {
        socket.on('updated_message', (updatedMessage: Message) => {
            setChatHistory((prevChatHistory: Message[]) => {
                const updatedChatHistory = prevChatHistory.map((message) => {
                    if (message.key === updatedMessage.key) {
                        return updatedMessage;
                    }
                    return message;
                });
                return updatedChatHistory;
            });
        });
        
        return () => {
            socket.off('updated_message');
        };
    }, [socket, setChatHistory]);

    const editMessage = (messageId: string, newMessage: string) => {
        axios.put('http://localhost:3001/api/test/edit_message', { messageId, newMessage })
        .then((response) => {
            // Handle successful message edit
            const updatedMessage = response.data;
            setChatHistory((prevChatHistory: Message[]) => {
                return prevChatHistory.map((message) => {
                    if (message.key === updatedMessage.key) {
                        return updatedMessage;
                    }
                    return message;
                });
            });
            // Emit an event to the server indicating message edit
            socket.emit('edit_message', updatedMessage);                
        })
        .catch((error) => {
            // Handle error during message edit
            console.error('Error editing message:', error);
        });
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
                                <button onClick={() => { console.log('Button clicked!'); editMessage(messageContent.key, 'New message'); }}>TESTING</button>
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

export default React.memo(Chat);
