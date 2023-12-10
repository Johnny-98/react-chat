import React, { useEffect, useMemo, useState } from 'react';
import { Socket } from 'socket.io-client';

interface chatType {
    socket: Socket;
    username: string; 
}

// useMemo(() => )
function Chat({socket, username}:chatType) {
    const [currentMessage, setCurrentMessage] = useState("");

    const sendMessage = async () => {
        if(currentMessage!== "") {
            const messageData = {
                author: username,
                message: currentMessage,
                time: 
                    new Date(Date.now()).getHours() +
                    ":" + 
                    new Date(Date.now()).getMinutes()
            };
            await socket.emit("send_message", messageData );
        }
    };

    const messageListener = useMemo(() => {
        const listener = (data: any) => {
            console.log(data);
            // Handle received messages here
        };
        return listener;
    }, []);

    useEffect(() => {
        socket.on("receive_message", messageListener);

        return () => {
            // Clean up socket listener when component unmounts
            socket.off("receive_message", messageListener);
        };
    }, [socket, messageListener]);


    return (
        <div>
            <div className='chat-head'>Live chat
            </div>
            <div className='chat-body'>
            </div>
            <div className='chat-footer'>
                <input 
                    type="text"  
                    onChange={(event) => { setCurrentMessage(event.target.value)}}/>
                <button onClick={sendMessage}>&#9658;</button>
            </div>
        </div>
    );
}

export default Chat;
