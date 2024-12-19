const http = require('http')
const express =require("express")
const socketIo = require('socket.io')
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
      origin: "https://web-conference-liard.vercel.app",  // Allow your frontend URL here
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"], // Specify headers if needed
      credentials: true, // Allow credentials like cookies if required
    }
  });
const cors = require("cors");
app.use(cors({
    origin: "https://web-conference-liard.vercel.app", // Allow your frontend URL here
    methods: ["GET", "POST"],
    credentials: true,
  }));


io.on('connection',(socket)=>{
    console.log("User connected");
    socket.on('disconnect',()=>{
        console.log("User Disconnected");
    })

    socket.on("offer",(offer)=>{
        socket.broadcast.emit('offer' , offer);
    });

    socket.on("answer",(answer)=>{
        socket.broadcast.emit('answer',answer);
    });

    socket.on('candidate',(candidate)=>{
        socket.broadcast.emit('candidate',candidate);
    });
});

server.listen(5000,()=>{
    console.log("Server running on port 5000")
})
