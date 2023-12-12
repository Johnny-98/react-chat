import React, { useEffect, useMemo, useState } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';
import { Socket } from 'socket.io-client';
interface chatType {
    socket: Socket;
    username: string; 
}
interface Message {
    key: string;
    author: string
    message: string;
    time: string
}

function Chat({socket, username}:chatType) {
    const [currentMessage, setCurrentMessage] = useState('');
    const [messageList, setMessageList] = useState<Message[]>([]);

    const sendMessage = async () => {
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
            await socket.emit('send_message', messageData );
            //when message sends add that message to my list 
            setMessageList((list) => [...list, messageData])
            setCurrentMessage('')
        }
    };

    // The messageListener is added as a dependency to useEffect to ensure it's recreated only when necessary
    // Tldr: messages don't repeat
    const messageListener = useMemo(() => {
        const listener = (data: Message) => {
            //get the current message and add it to an array 
            setMessageList((list) => [...list, data])
        };
        return listener;
    }, []);

    useEffect(() => {
        socket.on('receive_message', messageListener);

        return () => {
            // Clean up socket listener when component unmounts to prevent memory leaks.
            socket.off('receive_message', messageListener);
        };
    }, [socket, messageListener]);

    return (
        <div className='chat-window'>
            <div className='chat-header'>
                <p>Live chat</p>
            </div>
            <div className='chat-body'>
                <ScrollToBottom className='message-container'>
                    {/* accessisng the data just like vue  */}
                    {messageList.map((messageContent)=>{
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
