const socket = io();
let roomId = ''
let uid = ''
let time = ''

function talk() {
    showLoading();
    clearInterval(time)
    time = setInterval(async () => { socket.emit('find-someone') }, 1000)
}

socket.on('update-online-amount', (howMany) => {
    online.innerHTML = howMany
})

if (!document.querySelector('#spinner')) {
    roomId = window.location.pathname
    console.log(roomId, "TEST")
    socket.emit('join-partner', roomId)
}

socket.on('connected', (id) => {
    uid = id
    console.log("your-id", uid)
})

socket.on('search', (data) => {
    if (data == 'fail') {
        console.log("fail")
    }
    else {
        console.log("partner-id:", data)
        roomId = data
        window.location.href = '/' + data
    }
})

socket.on('test', (data) => {
    console.log(data)
})

socket.on('new-msg', msg => {
    appendMsg(msg, false)
})

socket.on('partner-left', () => {
    appendMsg("Twój rozmówca wyszedł", false)
    let inputs = document.querySelector(".inputs")
    inputs.innerHTML = `<div class="btn" onclick="talk()">Znajdź kogoś innego</div>`
})

document.querySelector('#msg-form').addEventListener('submit', (e) => {
    e.preventDefault()
    sendMsg(document.querySelector('#msg-input').value)
    document.querySelector('#msg-input').value = ''
})

async function byebye() {
    await fetch('/leave', {
        method: 'POST',
        body: JSON.stringify({ "id": uid })
    })
    if (document.querySelector(".msg-box")) {
        socket.emit('leave-room', roomId)
    }
}

function sendMsg(msg) {
    socket.emit('send-msg', msg, roomId)
    appendMsg(msg, true)
}

function appendMsg(msg, you) {
    let msgbox = document.querySelector('.msg-box')
    let newMsg = document.createElement('p')
    if(you)
        newMsg.classList.add('you')
    newMsg.innerHTML = msg
    msgbox.appendChild(newMsg)
}

function showLoading() {
    console.log("test")
}

window.addEventListener('beforeunload', (e) => { 
    byebye()
}); 