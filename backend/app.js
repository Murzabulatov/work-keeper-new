const express = require('express');
const https = require('https');
const app = express();
const socket = require("socket.io");
const cors = require('cors');
const fs = require('fs');
const http = express();

const options = {
  cert: fs.readFileSync('../../certs/workkeeper/fullchain.pem'),
  key: fs.readFileSync('../../certs/workkeeper/privkey.pem')
};

const server = https.createServer(options, app);

const io = socket.listen(server);
const dbConnect = require('./src/dbConnect');
const userRouter = require('./src/routes/userRouter');
const orgRouter = require('./src/routes/organizationRouter');
const departRouter = require('./src/routes/departmentRouter');
const workerRouter = require('./src/routes/workerRouter');


dbConnect();

require('dotenv').config();
const path = require('path');


app.set('port', process.env.NODE_ENV === 'production' ? process.env.PORT || 443 : process.env.PORT || 8081);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/user', userRouter);

app.use('/organization', orgRouter);
app.use('/department', departRouter);
app.use('/worker', workerRouter);


const rooms = new Map();

http.get('*', function(req, res) {
  res.redirect('https://workkeeper.ru');
})

app.get('/rooms/:id', (req, res) => {
  const { id: roomId } = req.params;
  const obj = rooms.has(roomId)
    ? {
      users: [...rooms.get(roomId).get('users').values()],
      messages: [...rooms.get(roomId).get('messages').values()],
    }
    : { users: [], messages: [] };
  res.json(obj);
});

app.post('/rooms', (req, res) => {
  const { roomId, userName } = req.body;
  if (!rooms.has(roomId)) {
    rooms.set(
      roomId,
      new Map([
        ['users', new Map()],
        ['messages', []],
      ]),
    );
  }
  res.send();
});


const users = {};

const socketToRoom = {};


io.on('connection', socket => {
  socket.on("join room", roomID => {
    if (users[roomID]) {
      const length = users[roomID].length;
      if (length === 20) {
        socket.emit("room full");
        return;
      }
      users[roomID].push(socket.id);
    } else {
      users[roomID] = [socket.id];
    }
    socketToRoom[socket.id] = roomID;
    const usersInThisRoom = users[roomID].filter(id => id !== socket.id);

    socket.emit("all users", usersInThisRoom);
  });

  socket.on("sending signal", payload => {
    io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
  });

  socket.on("returning signal", payload => {
    io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
  });

  socket.on('ROOM:JOIN', ({ roomId, userName }) => {
    socket.join(roomId);
    rooms.get(roomId).get('users').set(socket.id, userName);
    const users = [...rooms.get(roomId).get('users').values()];
    socket.to(roomId).broadcast.emit('ROOM:SET_USERS', users);
  });

  socket.on('ROOM:NEW_MESSAGE', ({ roomId, userName, text }) => {
    const obj = {
      userName,
      text,
    };
    rooms.get(roomId).get('messages').push(obj);
    socket.to(roomId).broadcast.emit('ROOM:NEW_MESSAGE', obj);
  });

  socket.on("disconnect", () => {
    rooms.forEach((value, roomId) => {
      if (value.get('users').delete(socket.id)) {
        const users = [...value.get('users').values()];
        socket.to(roomId).broadcast.emit('ROOM:SET_USERS', users);
      }
    });
    const roomID = socketToRoom[socket.id]
    let room = users[roomID]
    if (room) {
      room = room.filter(id => id !== socket.id)
      users[roomID] = room
    }

    socket.broadcast.emit('user left', socket.id)
  })

});

app.get('*', (req, res) => {
  res.sendFile('index.html', {root: path.join(__dirname, 'public')})
})

http.listen(process.env.HTTP_PORT|| 8080, (err)=> {
  if (err) throw err;
});

server.listen(app.locals.settings.port, () => {
  console.log('Server started on port ' + app.locals.settings.port);
})
