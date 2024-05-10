import express from 'express'
import { Server } from 'socket.io'
import path from 'path'
import { fileURLToPath } from 'url'
import { Chat, Message } from './models/chat.js'
import cors from 'cors'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3500
const ADMIN = 'Admin'

const app = express()
app.use(cors())
app.use(express.json())

app.use(express.static(path.join(__dirname, 'public')))

const expressServer = app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
})

app.get('/api/chats', (req, res) => {
  try {
    Chat.find({}).then((chat) => {
      res.json(chat)
    })
  } catch (e) {
    Chat.find({})
      .then((chat) => {
        res.json(chat)
      })
      .catch((error) => {
        console.log(error)
        res
          .status(500)
          .json({ error: 'An error occurred while fetching the chats' })
      })
  }
})

app.get('/api/chats/:name', (req, res) => {
  const name = req.params.name
  if (name) {
    Chat.findOne({ name }).then((chat) => {
      res.json(chat.messages)
    })
  } else {
    Chat.find({})
      .then((chat) => {
        res.json(chat.messages)
      })
      .catch((error) => {
        console.log(error)
        res
          .status(500)
          .json({ error: 'An error occurred while fetching the chat' })
      })
  }
})

app.get('/api/chats/:name/:index', (req, res) => {
  const name = req.params.name
  const index = req.params.index
  const pageSize = 15
  if (name) {
    Chat.findOne({ name }).then((chat) => {
      const startIndex = (index - 1) * pageSize
      const endIndex = index * pageSize
      const messages = chat.messages.slice(startIndex, endIndex)
      res.json(messages)
    })
  } else {
    Chat.find({})
      .then((chat) => {
        res.json(chat.messages)
      })
      .catch((error) => {
        console.log(error)
        res
          .status(500)
          .json({ error: 'An error occurred while fetching the chat' })
      })
  }
})

app.post('/api/chats/:name', (req, res) => {
  const body = req.body
  const nameChat = req.params.name
  const name = body.name
  const time = body.time
  const text = body.text

  if (body && body.name === undefined) {
    return res.status(400).json({
      error: 'name missing',
    })
  }
  if (body && time === undefined) {
    return res.status(400).json({
      error: 'time missing',
    })
  }
  if (body && text === undefined) {
    return res.status(400).json({
      error: 'text missing',
    })
  }

  const message = new Message({
    name,
    time,
    text,
  })

  Chat.findOne({ name: nameChat })
    .then((chat) => {
      chat.messages.unshift(message)
      chat.save().then((savedChat) => {
        res.json(savedChat)
      })
    })
    .catch((error) => {
      console.log(error)
      res
        .status(500)
        .json({ error: 'An error occurred while fetching the chat' })
    })
})

app.post('/api/chats', (req, res) => {
  const body = req.body
  const name = body.name
  const owner = body.owner
  if (body && body.name === undefined) {
    return res.status(400).json({
      error: 'name missing',
    })
  }

  const chat = new Chat({
    name,
    owner,
  })

  chat.save().then((savedChat) => {
    res.json(savedChat)
  })
})

app.delete('/api/chats/:name', (req, res) => {
  const name = req.params.name
  if (name) {
    Chat.findOneAndDelete({ name }).then((chat) => {
      res.json(chat)
    })
  } else {
    Chat.find({})
      .then((chat) => {
        res.json(chat.messages)
      })
      .catch((error) => {
        console.log(error)
        res
          .status(500)
          .json({ error: 'An error occurred while fetching the chat' })
      })
  }
})

//state change to database in future
const UsersState = {
  users: [],
  setUsers: function (newUsersArray) {
    this.users = newUsersArray
  },
}
//end

const io = new Server(expressServer, {
  cors: {
    origin: '*',
  },
})

io.on('connection', (socket) => {
  //upon connection - only to user
  socket.emit('message', buildMsg(ADMIN, 'Welcome to SBBJ Chat'))

  socket.on('enterRoom', ({ name, room }) => {
    //leave previous room
    const prevRoom = getUser(socket.id)?.room
    if (prevRoom) {
      socket.leave(prevRoom)
      io.to(prevRoom).emit(
        'message',
        buildMsg(ADMIN, `${name} has left the room`)
      )
    }

    const user = activateUser(socket.id, name, room)
    //Cannot update previous room users list unitl after the state update in activate user

    if (prevRoom) {
      io.to(prevRoom).emit('userList', {
        users: getUsersInRoom(prevRoom),
      })
    }

    //join room
    socket.join(user.room)

    //To user who joined
    socket.emit(
      'message',
      buildMsg(ADMIN, `You have joined the ${user.room} chat room`)
    )

    //to everyone else
    socket.broadcast
      .to(user.room)
      .emit('message', buildMsg(ADMIN, `${user.name} has joined the room`))

    //Update user list for room
    io.to(user.room).emit('userList', {
      users: getUsersInRoom(user.room),
    })

    //update room list for everyone
    io.emit('roomList', {
      rooms: getAllActiveRooms(),
    })
  })

  //When user disconnects -  to all others
  socket.on('disconnect', () => {
    const user = getUser(socket.id)
    userLeavesApp(socket.id)

    if (user) {
      io.to(user.room).emit(
        'message',
        buildMsg(ADMIN, `${user.name} has left the room`)
      )

      io.to(user.room).emit('userList', {
        users: getUsersInRoom(user.room),
      })

      io.emit('roomList', {
        rooms: getAllActiveRooms(),
      })
    }
  })

  //Listening for a message Event
  socket.on('message', ({ name, text }) => {
    const room = getUser(socket.id)?.room
    console.log(UsersState.users)
    console.log(socket.id)
    console.log(`room: ${room}`)
    if (room) {
      io.to(room).emit('message', buildMsg(name, text))
    }
  })

  //Listening for activity
  socket.on('activity', (name) => {
    const room = getUser(socket.id)?.room
    if (room) {
      socket.broadcast.to(room).emit('activity', name)
    }
  })
})

function buildMsg(name, text) {
  return {
    name,
    text,
    time: new Date(),
  }
}

//User functions
function activateUser(id, name, room) {
  const user = { id, name, room }
  UsersState.setUsers([
    ...UsersState.users.filter((user) => user.id !== id),
    user,
  ])
  return user
}

function userLeavesApp(id) {
  UsersState.setUsers(UsersState.users.filter((user) => user.id !== id))
}

function getUser(id) {
  return UsersState.users.find((user) => user.id === id)
}

function getUsersInRoom(room) {
  return UsersState.users.filter((user) => user.room === room)
}

function getAllActiveRooms() {
  const rooms = Array.from(new Set(UsersState.users.map((user) => user.room)))
  return rooms
}
