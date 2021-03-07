const express = require("express");
const socketSr = require("socket.io");
var bodyParser = require('body-parser');
const http = require("http");
const fs = require('fs');
const cors = require('cors');

const {
    addUser, 
    removeUser, 
    getAllUsers, 
    getUser, 
    getUserInRoom
} = require('./users');

const {
    encodeString,
    decodeString,
    getMessage,
} = require('./helper');
const PORT = process.env.PORT || 5000;

const app = express();

var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200 
}
app.use(cors(corsOptions))
app.use(bodyParser.json());
app.use(express.static('Videos'));

const router = require("./router");
app.use(router)

const uploadRoutes = require("./uploadRoutes");
app.use("/upload", uploadRoutes)

const server = http.createServer(app);

const io = socketSr(server,{
    cors: {
        origin: '*',
    }
});
//Routes

io.on("connection", (socket)=>{

    console.log("we havee a new connection!!!!");
    
        socket.on("join", ({name, room}, callback)=>{
            try {
                console.log(name,room);
                const {error, user} = addUser({id:socket.id, name, room});
                
                if(error) return callback(error);
                socket.emit('message', getMessage({user:"admin", text:`${user.name}, welcome to the room`}));
                socket.broadcast.to(user.room).emit("message", getMessage({user:'admin', text:`${user.name}, has joind!`}))
                socket.join(user.room);

                callback();
            } catch (error) {
                console.log( error.message);
                fs.appendFile('log.txt', error.message, function (err) {
                    if (err) throw err;
                    console.log('Saved!');
                }); 
            }
        });

        socket.on("sendMessage", (message, callback)=>{
            try {
                console.log(message,JSON.stringify(decodeString(message)));
                const user = getUser(socket.id);
                console.log(user, getAllUsers(),socket.id);
                socket.to(user.room).emit("message", getMessage({user:user.name, text:decodeString(message)}))
                callback();
                
            } catch (error) {
                console.log( error.message);
                fs.appendFile('log.txt', error.message, function (err) {
                    if (err) throw err;
                    console.log('Saved!');
                }); 
            }
        })
        socket.on('disconnect', ()=>{
            try {
                const user = removeUser(socket.id);
                if(user)
                console.log(`${user.name} had left !!!!`);
                    
            } catch (error) {
                console.log( error.message);
                fs.appendFile('log.txt', error.message, function (err) {
                    if (err) throw err;
                    console.log('Saved!');
                }); 
            }
        });  
    
});


server.listen(PORT, ()=>console.log(`Server has starte on port ${PORT}`));