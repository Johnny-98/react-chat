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

function Chat({ socket, username, chatHistory, setChatHistory }: chatType) {
    const [currentMessage, setCurrentMessage] = useState('');
    const [updateMessage, setUpdateMessage] = useState('');
    const [selectedMessageKey, setSelectedMessageKey] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const sendMessage = () => {
        if(currentMessage!== '') {
            const messageData = {
                key: uuidv4(),
                author: username,
                message: currentMessage,
                time: new Date(Date.now()).toLocaleTimeString(),
                updated: false
            };
            socket.emit('send_message', messageData );
            // Update local chat history
            setChatHistory([...chatHistory, messageData]);
            // Clear the input field after sending the message
            setCurrentMessage('')
        }
    };

    const editMessage = (messageId: string, newMessage: string) => {
        axios
            //specify the full server endpoint to avoid confusion 
            .put('http://localhost:3001/api/test/edit_message', { messageId, newMessage, updated: true })
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
                socket.emit('edit_message', updatedMessage); // Notify server about message edit
                // Clear updateMessage and reset editing state
                setUpdateMessage('');
                setSelectedMessageKey('');
                setIsEditing(false);
            })
            .catch((error) => {
                console.error('Error editing message:', error);
            });
    };

    const deleteMessage = (messageId: string) => {
        axios
            .delete('http://localhost:3001/api/test/delete_message', { data: { messageId } })
            .then((response) => {
            const deletedMessage = response.data;
            setChatHistory((prevChatHistory: Message[]) =>
                prevChatHistory.filter((message) => message.key !== deletedMessage.key)
            );
            // Remove deleted message from local storage 
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory.filter((message) => message.key !== deletedMessage.key)));
            socket.emit('delete_message', { messageId }); // Notify server about message deletion
        })
        .catch((error) => {
        console.error('Error deleting message:', error);
        });
    };

    useEffect(() => {
        // Retrieve chat history from local storage
        const storedChatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');

        // prevent the deleted messages from reappearing upon refresh
        if (storedChatHistory && storedChatHistory.length > 0) {
            setChatHistory(storedChatHistory);
        }
    }, [setChatHistory]); //Ensure that setChatHistory is not recreated on every render

    useEffect(() => {
        // Listen for updated_message event
        socket.on('updated_message', (updatedMessage: Message) => {
            setChatHistory((prevChatHistory: Message[]) => {
                const updatedChatHistory = prevChatHistory.map((message) => {
                    if (message.key === updatedMessage.key) {
                        return updatedMessage;
                    }
                    return message;
                });
                return updatedChatHistory; // Update the chat history with the updated message
            });
        });
        
        return () => {
            socket.off('updated_message');
        };
    }, [socket, setChatHistory]);

    useEffect(() => {
        socket.on('message_deleted', (deletedMessage: Message) => {
            setChatHistory((prevChatHistory: Message[]) =>
                prevChatHistory.filter((message) => message.key !== deletedMessage.key)
            );
        });
    });

    return (
        <div className='chat-window'>
            <div className='chat-header'>
                <p>Live chat</p>
            </div>
            <div className='chat-body'>
                <ScrollToBottom className='message-container'>
                    {chatHistory.map((messageContent) => (
                        <div key={messageContent.key} className='message' id={username === messageContent.author ? 'you' : 'other'}>
                            <div>
                                <div className='message-content'>
                                    <p>{messageContent.message}</p>
                                </div>
                                <div className='message-meta'>
                                <p id='time'>{messageContent.time}</p>
                                <p id='author'>{messageContent.author}</p>
                                </div>
                                <p>{messageContent.updated?'updated': ''}</p>
                            </div>
                            <div className='edit-button-container'>
                                <button onClick={() => {
                                    setUpdateMessage('');
                                    setSelectedMessageKey(messageContent.key); // Store the key of the message being edited
                                    setIsEditing(true);
                                }}>Edit</button>
                                <button onClick={() => deleteMessage(messageContent.key)}>Delete</button>
                                <p>{messageContent.updated ? 'updated' : ''}</p>
                            </div>
                        </div>
                    ))}
                </ScrollToBottom>
            </div>
            {isEditing ? (
                <div className='chat-footer'>
                    <input
                        type='text'
                        placeholder='Update message...'
                        value={updateMessage}
                        onChange={(event) => setUpdateMessage(event.target.value)}
                        onKeyDown={(event) => {
                            event.key === 'Enter' && editMessage(selectedMessageKey, updateMessage);
                        }}
                    />
                    <button onClick={() => editMessage(selectedMessageKey, updateMessage)}>Confirm</button>
                </div>
                ):(
                <div className='chat-footer'>
                    <input
                        type='text'
                        placeholder='Type your message here...'
                        value={currentMessage}
                        onChange={(event) => setCurrentMessage(event.target.value)}
                        onKeyDown={(event) => {
                            event.key === 'Enter' && sendMessage();
                        }}
                    />
                    <button onClick={sendMessage}>&#9658;</button>
                </div>
            )}
        </div>
    );
}
//helps to memoize the component and prevent unnecessary re-renders if its props remain the same.
export default React.memo(Chat);
