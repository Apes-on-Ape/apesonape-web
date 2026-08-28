const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Game rooms
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', () => {
    const roomId = generateRoomId();
    socket.join(roomId);
    rooms.set(roomId, {
      players: [{ id: socket.id, name: `Player ${socket.id.slice(0, 4)}` }],
      gameState: 'waiting',
      readyPlayers: new Set(),
      selectedCharacters: {}
    });
    
    socket.emit('roomCreated', { roomId });
    console.log(`Room created: ${roomId} by player ${socket.id}`);
  });

  socket.on('joinRoom', (data) => {
    const room = rooms.get(data.roomId);
    console.log(`Player ${socket.id} trying to join room ${data.roomId}`);
    console.log(`Room exists: ${!!room}, Players: ${room ? room.players.length : 0}`);
    
    if (room && room.players.length < 2) {
      socket.join(data.roomId);
      room.players.push({ id: socket.id, name: `Player ${socket.id.slice(0, 4)}` });
      
      console.log(`Player ${socket.id} joined room ${data.roomId}. Total players: ${room.players.length}`);
      console.log(`Socket ${socket.id} is now in rooms:`, Array.from(socket.rooms));
      
      socket.emit('playerJoined', { 
        playerName: `Player ${socket.id.slice(0, 4)}`,
        players: room.players 
      });
      
      // Notify other players
      socket.to(data.roomId).emit('playerJoined', {
        playerName: `Player ${socket.id.slice(0, 4)}`,
        players: room.players
      });
      
      // If both players joined, start character selection
      if (room.players.length === 2) {
        room.gameState = 'character_selection';
        room.readyPlayers.clear(); // Reset ready players
        room.selectedCharacters = {}; // Reset character selections
        console.log(`Room ${data.roomId} starting character selection with ${room.players.length} players`);
        console.log(`Room state set to: ${room.gameState}`);
        io.to(data.roomId).emit('gameStarting');
      }
    } else {
      socket.emit('roomError', { message: 'Room not found or full' });
      console.log(`Failed to join room ${data.roomId}: Room not found or full`);
    }
  });

  socket.on('playerCharacterReady', (data) => {
    const roomId = data?.roomId || Array.from(socket.rooms)[1];
    const room = rooms.get(roomId);
    
    console.log(`Player ${socket.id} character ready in room ${roomId}`);
    console.log(`Character selected: ${data.characterId}`);
    console.log(`Room state before: ${room ? room.gameState : 'not found'}`);
    
    if (room) {
      // Store the selected character
      room.selectedCharacters[socket.id] = data.characterId;
      room.readyPlayers.add(socket.id);
      
      console.log(`Room ${roomId} ready players: ${room.readyPlayers.size}/${room.players.length}`);
      console.log(`Selected characters:`, room.selectedCharacters);
      
      // If both players are ready, show host arena selection
      if (room.readyPlayers.size === 2) {
        room.gameState = 'arenaSelection';
        console.log(`Room ${roomId} both players ready - host selects arena`);
        console.log(`Room state after: ${room.gameState}`);
        
        // Find the host (first player in the room)
        const host = room.players[0];
        if (host.id === socket.id || host.id === Array.from(socket.rooms)[1]) {
          // This is the host, show arena selection
          io.to(host.id).emit('showHostArenaSelection');
          // Tell other players to wait
          socket.to(roomId).emit('waitingForHostArena');
        }
      } else {
        console.log(`Waiting for more players to be ready. Current: ${room.readyPlayers.size}/2`);
      }
    } else {
      console.log(`Room ${roomId} not found for player ${socket.id}`);
    }
  });

  socket.on('hostArenaSelected', (data) => {
    const roomId = data?.roomId || Array.from(socket.rooms)[1];
    const room = rooms.get(roomId);
    
    console.log(`Host ${socket.id} selected arena in room ${roomId}`);
    console.log(`Arena selected: ${data.arenaId}`);
    
    if (room) {
      // Store the final arena selection
      room.selectedArena = data.arenaId;
      console.log(`Room ${roomId} final arena selection: ${room.selectedArena}`);
      
      // Notify all players of the arena selection
      io.to(roomId).emit('arenaSelected', { arenaId: data.arenaId, selectedBy: socket.id });
    } else {
      console.log(`Room ${roomId} not found for host ${socket.id}`);
    }
  });

  socket.on('startFight', (data) => {
    const roomId = data?.roomId || Array.from(socket.rooms)[1];
    const room = rooms.get(roomId);
    
    console.log(`Player ${socket.id} starting fight in room ${roomId}`);
    console.log(`Selected arena: ${data.arenaId}`);
    
    if (room && data.arenaId) {
      // Store the final arena selection
      room.selectedArena = data.arenaId;
      room.gameState = 'countdown';
      console.log(`Room ${roomId} starting countdown with arena: ${room.selectedArena}`);
      
      // Immediately start countdown for all players
      io.to(roomId).emit('startCountdown', { arenaId: room.selectedArena });
    } else {
      console.log(`Room ${roomId} not found or no arena selected`);
    }
  });

  socket.on('readyToStart', (data) => {
    const roomId = data?.roomId || Array.from(socket.rooms)[1]; // First room is socket.id
    const room = rooms.get(roomId);
    
    console.log(`Player ${socket.id} ready to start in room ${roomId}`);
    console.log(`Room state: ${room ? room.gameState : 'not found'}, Players: ${room ? room.players.length : 0}`);
    console.log(`Socket ${socket.id} is in rooms:`, Array.from(socket.rooms));
    console.log(`Selected arena: ${data?.arenaId || room?.selectedArena}`);
    
    if (room && room.players.length === 2) {
      room.gameState = 'playing';
      console.log(`Starting game in room ${roomId} with players:`, room.players.map(p => p.id));
      
      // Check if all players are actually in the socket.io room
      const socketRoom = io.sockets.adapter.rooms.get(roomId);
      if (socketRoom) {
        console.log(`Socket.io room ${roomId} has ${socketRoom.size} players:`, Array.from(socketRoom));
      } else {
        console.log(`Socket.io room ${roomId} not found!`);
      }
      
      io.to(roomId).emit('gameStart', { 
        players: room.players,
        arenaId: room.selectedArena || data?.arenaId
      });
    }
  });

  socket.on('playerMove', (data) => {
    const roomId = data.roomId || Array.from(socket.rooms)[1];
    console.log(`Player ${data.playerId} moved in room ${roomId}: ${data.x}, ${data.y}`);
    socket.to(roomId).emit('playerMoved', data);
  });

  socket.on('playerCastSpell', (data) => {
    const roomId = data.roomId || Array.from(socket.rooms)[1];
    console.log(`Player ${data.playerId} cast spell ${data.spellType} in room ${roomId}`);
    socket.to(roomId).emit('playerCastSpell', data);
  });

  socket.on('playerDamaged', (data) => {
    const roomId = data.roomId || Array.from(socket.rooms)[1];
    socket.to(roomId).emit('playerDamaged', data);
  });

  socket.on('itemsCreated', (data) => {
    console.log('Received itemsCreated event from client');
    console.log('Data:', data);
    console.log('Socket rooms:', Array.from(socket.rooms));
    console.log('Socket ID:', socket.id);
    
    const roomId = data.roomId || Array.from(socket.rooms)[1];
    console.log(`Host created ${data.items.length} items in room ${roomId}`);
    console.log(`Sending items to other players in room ${roomId}`);
    
    // Get all sockets in the room
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room) {
      console.log(`Room ${roomId} has ${room.size} players:`, Array.from(room));
    } else {
      console.log(`Room ${roomId} not found!`);
    }
    
    socket.to(roomId).emit('itemsCreated', data);
    console.log('Items data forwarded to other players');
  });

  socket.on('itemPickedUp', (data) => {
    console.log('Received itemPickedUp event from client');
    console.log('Data:', data);
    
    const roomId = data.roomId || Array.from(socket.rooms)[1];
    console.log(`Player ${data.playerId} picked up ${data.itemType} in room ${roomId}`);
    
    socket.to(roomId).emit('itemPickedUp', data);
    console.log('Item pickup forwarded to other players');
  });

  socket.on('itemSpawned', (data) => {
    console.log('Received itemSpawned event from client');
    console.log('Data:', data);
    
    const roomId = data.roomId || Array.from(socket.rooms)[1];
    console.log(`Player ${data.playerId} spawned ${data.itemType} in room ${roomId}`);
    
    socket.to(roomId).emit('itemSpawned', data);
    console.log('Item spawn forwarded to other players');
  });

  socket.on('decorationsCreated', (data) => {
    console.log('Received decorationsCreated event from client');
    console.log('Data:', data);
    
    const roomId = data.roomId || Array.from(socket.rooms)[1];
    console.log(`Host created ${data.decorations.length} decorations in room ${roomId}`);
    console.log(`Sending decorations to other players in room ${roomId}`);
    
    // Get all sockets in the room
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room) {
      console.log(`Room ${roomId} has ${room.size} players:`, Array.from(room));
    } else {
      console.log(`Room ${roomId} not found!`);
    }
    
    socket.to(roomId).emit('decorationsCreated', data);
    console.log('Decorations data forwarded to other players');
  });

  socket.on('gameStateUpdate', (data) => {
    // Forward game state to other players in the room
    const roomId = data.roomId || Array.from(socket.rooms)[1];
    socket.to(roomId).emit('gameStateUpdate', data);
  });

  socket.on('playerDefeated', (data) => {
    const roomId = Array.from(socket.rooms)[1];
    const room = rooms.get(roomId);
    
    if (room) {
      const winner = room.players.find(p => p.id !== data.playerId);
      io.to(roomId).emit('gameOver', { 
        winnerId: winner ? winner.id : null,
        loserId: data.playerId 
      });
      
      // Clean up room
      rooms.delete(roomId);
    }
  });

  socket.on('leaveRoom', () => {
    const roomId = Array.from(socket.rooms)[1];
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          socket.to(roomId).emit('playerLeft', { playerId: socket.id });
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove from all rooms
    const roomId = Array.from(socket.rooms)[1];
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          socket.to(roomId).emit('playerLeft', { playerId: socket.id });
        }
      }
    }
  });
});

function generateRoomId() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 