import axios from 'axios';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Button, Card, Dropdown, Form, InputGroup } from 'react-bootstrap';
import { TbDotsVertical } from "react-icons/tb";
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
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
        const editedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Get current time
        axios
            .put('http://localhost:3001/api/test/edit_message', { messageId, newMessage, updated: true, time: editedTime }) // Include edited time in the request
            .then((response) => {
                // Handle successful message edit
                const updatedMessage = response.data;
                setChatHistory((prevChatHistory: Message[]) => {
                    return prevChatHistory.map((message) => {
                        if (message.key === updatedMessage.key) {
                            return { ...updatedMessage, time: editedTime }; // Update time property
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

    const RxHamburgerMenu = <TbDotsVertical />;
    

    return (
        <div>
            <Card.Body className='chat-body'>
                <ScrollToBottom className='message-container'>
                    {chatHistory.map((messageContent) => (
                        <div key={messageContent.key} className="message-wrapper" >
                            <div id={username === messageContent.author ? 'you' : 'other'}>
                                
                                <div className='message-content'>
                                    <div className="message-box">
                                        <p>{messageContent.message}</p>
                                    </div>
                                    {username === messageContent.author &&
                                    <div className='pt-2'> 
                                    <Dropdown>
                                        <Dropdown.Toggle variant="light" id="dropdown-basic" className="custom-dropdown-toggle">
                                            {RxHamburgerMenu}
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu>
                                            <Dropdown.Item
                                                onClick={() => {
                                                    setUpdateMessage(messageContent.message);
                                                    setSelectedMessageKey(messageContent.key); // Store the key of the message being edited
                                                    setIsEditing(!isEditing);}}>
                                                        Edit
                                            </Dropdown.Item>
                                            <Dropdown.Item
                                                onClick={() => deleteMessage(messageContent.key)}>
                                                    Delete
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                    </div>
                                    }
                                    
                                </div>
                                <div className="message-info">
                                    <p><b>{messageContent.author}</b>, { messageContent.updated && 'updated' } {messageContent.time}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </ScrollToBottom>
            </Card.Body>
            <Card.Footer>
                {isEditing ? ( 
                    <div className='footer-content'>
                        <InputGroup>
                            <Form.Control
                                type='text'
                                placeholder='Press ESC to cansel...'
                                value={updateMessage}
                                onChange={(event) => setUpdateMessage(event.target.value)}
                                onKeyDown={(event) => {
                                    event.key === 'Enter' && editMessage(selectedMessageKey, updateMessage);
                                    event.key === 'Escape' && setIsEditing(false);
                                }}
                            />
                        </InputGroup>
                        <Button onClick={() => editMessage(selectedMessageKey, updateMessage)}>Edit</Button>
                    </div>
                    ):(
                    <div className='footer-content'>
                        <InputGroup>
                            <Form.Control
                                type='text'
                                placeholder='Type your message here...'
                                value={currentMessage}
                                onChange={(event) => setCurrentMessage(event.target.value)}
                                onKeyDown={(event) => {
                                    event.key === 'Enter' && sendMessage();
                                }}
                            />
                        </InputGroup>
                        <Button onClick={sendMessage}>Send</Button>
                    </div>
                )}   
            </Card.Footer>
        </div>
    );
}
//helps to memoize the component and prevent unnecessary re-renders if its props remain the same.
export default React.memo(Chat);
