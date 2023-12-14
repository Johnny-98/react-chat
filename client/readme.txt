Client:
    Build using React (typescript)
    Login page:
        A simple input field where users enter their names.
        Browser rememmbers users upon refresh.
        The server rememmbers previously logged in memmbers and adds a "Welcoome back" message when logging in again and when refreshing the page.
    Chat page:
        Messages are viewd in real time.
        Users are able to Send View Update and Delete messages.
        Edited messages have updated timestamps.
        Users are able to log out and are redirected to the login page

Libraries: 
    socket.io: client to establishes the connection between the backend and frontend in react
    react-scroll-to-bottom: manages messages scrolling
    uuid: generates unique ids
    bootstrap & bootstrap-react : Framework I am most familiar with

How to start:
    npm start