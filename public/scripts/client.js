const socket = io();
let roomId = ''
let uid = ''
let time = ''
let prevAuthor = ''

function talk(){
    window.location.href = '/chat'
}

function searchPartner() {
    showLoading();
    clearInterval(time)
    time = setInterval(async () => { socket.emit('find-someone') }, 1000)
}

socket.on('update-online-amount', (howMany) => {
    online.innerHTML = howMany
})

if (!document.querySelector('#spinner')) {
    searchPartner()
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
        clearInterval(time)
        hideLoading()
        console.log("partner-id:", data)
        roomId = data
        document.querySelector('.msg-box').innerHTML = ` <p>Połączono z rozmówcą. Przywitaj się!</p>`
        socket.emit('join-partner', roomId)
        console.log(roomId, "TEST")
    }
})

socket.on('new-msg', msg => {
    appendMsg(msg, false)
})

socket.on('partner-left', () => {
    appendSysMsg("Twój rozmówca wyszedł")
    socket.emit('leave-queue')
    let inputs = document.querySelector(".inputs")
    inputs.innerHTML = `<div class="btn someone-else" onclick="talk()">Znajdź kogoś innego</div>`
})

if(document.querySelector("#spinner") == undefined)
document.querySelector('#msg-form').addEventListener('submit', (e) => {
    e.preventDefault()
    if(document.querySelector('#msg-input').value != ''){
        sendMsg(document.querySelector('#msg-input').value)
        socket.emit("typing-off", roomId)
    }
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

function appendSysMsg(msg){
    let msgbox = document.querySelector('.msg-box')
    let newMsg = document.createElement('p')
    newMsg.innerHTML = msg
    msgbox.appendChild(newMsg)
    msgbox.scrollTop = msgbox.scrollHeight
}

function appendMsg(msg, you) {
    let msgbox = document.querySelector('.msg-box')
    let newMsgCont = document.createElement('div')
    newMsgCont.classList.add("newMsgCont")
    let newMsg = document.createElement('p')
    let authorEl = document.createElement('p')
    authorEl.innerHTML = "Partner"
    if(you){
        authorEl.classList.add('you')
        newMsgCont.classList.add('your-msg')
        authorEl.innerHTML = "Ty"
    }
    newMsg.innerHTML = msg
    newMsg.classList.add("new-msg")
    authorEl.classList.add("author")
    if((prevAuthor == 'you' && you == false) || (prevAuthor == 'partner' && you == true) || (prevAuthor == '')){
        newMsgCont.appendChild(authorEl)
    }
    newMsgCont.appendChild(newMsg)
    msgbox.appendChild(newMsgCont)
    prevAuthor = you ? 'you' : 'partner'
    msgbox.scrollTop = msgbox.scrollHeight
}

function showLoading() {
    console.log("test")
}

function hideLoading() {
    console.log("test")
}

document.querySelector("#msg-input").addEventListener("keydown", (e) => {
    if(e.key != "Enter")
    isTyping()
})

function isTyping(){
    let timeleft = 2;
    var downloadTimer = setInterval(function(){
        if(timeleft <= 0){
          clearInterval(downloadTimer);
          socket.emit("typing-off", roomId)
        }
        if(timeleft == 2)
            socket.emit("typing-on", roomId)
        timeleft -= 1;
      }, 1000);
}

socket.on("someone-typing", (isTyping) => {
    typing.style.visibility = isTyping ? 'visible' : 'hidden'
})

window.addEventListener('beforeunload', (e) => { 
    byebye()
}); 

window.addEventListener('hashchange', (e) => { 
    byebye()
}); 