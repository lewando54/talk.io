const express = require('express')
var morgan = require('morgan')
const app = express()
const server = app.listen(3000)
const cookieParser = require('cookie-parser')


let users = []
let online = 0

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'))


const io = require('socket.io')(server, {
  cors: {
    origin: "localhost",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
})

io.on('connection', socket => {
    socket.emit('connected', socket.id)
    socket.join("queue");
    online++;
    io.emit('update-online-amount', online)

    socket.on('find-someone', () => {
        if(!users.includes(socket))
            users.push(socket)
        users.forEach((user) => {
            console.log(user.id)
        })
        let rand = getRandomIntInclusive(0, users.length - 1)
        online = users.length
        if (users[rand].id != socket.id) {
            const roomId = socket.id+'+'+users[rand].id
            socket.emit('search', roomId)
            io.to(users[rand].id).emit('search', roomId)
        }
        else {
            socket.emit('search', "fail")
        }
        
    })
    socket.on('join-partner', roomId => {
        socket.join(roomId)
        console.log(roomId)
    })
    socket.on('send-msg', (msg, roomId) => {
        socket.to(roomId).emit('new-msg', msg)
    })
    socket.on('leave-room', roomId => {
        socket.leave(roomId)
        io.in(roomId).emit('partner-left')
    })
    socket.on('leave-queue', () => {
        users.splice(socket.id, 1)
    })
    socket.on("typing-on", (roomId) => {
        socket.to(roomId).emit("someone-typing", true)
    })
    socket.on("typing-off", (roomId) => {
        socket.to(roomId).emit("someone-typing", false)
    })
    socket.on('disconnect', () => {
        online--;
    })
})

app.get('/', (req, res) => {
    
    res.render('index.ejs')
})

app.post('/leave', (req, res) => {
    online--;
    let who = users.indexOf(req.body.id)
    users.splice(who, 1)
    console.log('closed')
    io.emit('update-online-amount', online)
    res.send("closed")
})

app.get('/chat', (req, res) => {
    const id = req.params.id
    console.log()
    // if(id.match('/([A-z]|[0-9]|[-]|[_])+[+]([A-z]|[0-9]|[-]|[_])+/g'))
        res.render('chat.ejs')
    // else
    //     res.redirect('/')
})

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

