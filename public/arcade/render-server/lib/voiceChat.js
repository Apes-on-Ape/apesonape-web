export class VoiceChatManager {
  constructor() {
    this.voiceUsers = new Map(); // Track users in voice chat
    this.pendingOffers = new Map(); // Track pending WebRTC offers
  }

  async joinVoiceChannel(socketId, user, namespace) {
    try {
      // Add user to voice channel
      this.voiceUsers.set(socketId, {
        ...user,
        joinedVoiceAt: Date.now()
      });

      console.log(`🎤 ${user.username} joined voice chat`);

      // Notify all existing voice users about the new user
      const voiceUsersList = Array.from(this.voiceUsers.entries())
        .filter(([id]) => id !== socketId)
        .map(([id, userData]) => ({ socketId: id, user: userData }));

      // Send list of current voice users to the new user
      namespace.to(socketId).emit('voice_users_list', voiceUsersList);

      // Notify existing users about the new voice user
      const newUserData = { socketId, user };
      voiceUsersList.forEach(({ socketId: existingUserId }) => {
        namespace.to(existingUserId).emit('voice_user_joined', newUserData);
      });

      return true;

    } catch (error) {
      console.error('Error joining voice channel:', error);
      return false;
    }
  }

  async leaveVoiceChannel(socketId, namespace) {
    try {
      const user = this.voiceUsers.get(socketId);
      if (!user) return false;

      // Remove user from voice channel
      this.voiceUsers.delete(socketId);
      
      // Clean up any pending offers
      this.pendingOffers.delete(socketId);

      console.log(`🔇 ${user.username} left voice chat`);

      // Notify remaining voice users
      this.voiceUsers.forEach((_, otherSocketId) => {
        namespace.to(otherSocketId).emit('voice_user_left', { socketId });
      });

      return true;

    } catch (error) {
      console.error('Error leaving voice channel:', error);
      return false;
    }
  }

  async handleSignal(socket, signalData, namespace) {
    try {
      const { type, target, payload } = signalData;

      if (!target || !this.voiceUsers.has(socket.id)) {
        console.warn('Invalid voice signal or user not in voice chat');
        return;
      }

      // Validate target user is in voice chat
      if (!this.voiceUsers.has(target)) {
        console.warn(`Target user ${target} not in voice chat`);
        socket.emit('voice_signal_error', { 
          message: 'Target user not in voice chat',
          target 
        });
        return;
      }

      console.log(`🎤 Voice signal ${type} from ${socket.id} to ${target}`);

      switch (type) {
        case 'offer':
          // Store pending offer and forward to target
          this.pendingOffers.set(`${socket.id}-${target}`, payload);
          namespace.to(target).emit('voice_signal', {
            type: 'offer',
            from: socket.id,
            payload
          });
          break;

        case 'answer':
          // Forward answer to the original offerer
          namespace.to(target).emit('voice_signal', {
            type: 'answer',
            from: socket.id,
            payload
          });
          break;

        case 'ice-candidate':
          // Forward ICE candidate to target
          namespace.to(target).emit('voice_signal', {
            type: 'ice-candidate',
            from: socket.id,
            payload
          });
          break;

        case 'hangup':
          // Handle call termination
          namespace.to(target).emit('voice_signal', {
            type: 'hangup',
            from: socket.id
          });
          this.pendingOffers.delete(`${socket.id}-${target}`);
          this.pendingOffers.delete(`${target}-${socket.id}`);
          break;

        default:
          console.warn(`Unknown voice signal type: ${type}`);
      }

    } catch (error) {
      console.error('Error handling voice signal:', error);
      socket.emit('voice_signal_error', { 
        message: 'Failed to process voice signal' 
      });
    }
  }

  getActiveChannelsCount() {
    return this.voiceUsers.size;
  }

  isUserInVoice(socketId) {
    return this.voiceUsers.has(socketId);
  }

  getVoiceUsers() {
    return Array.from(this.voiceUsers.entries()).map(([socketId, user]) => ({
      socketId,
      user
    }));
  }

  // Clean up voice chat when users disconnect
  cleanupUser(socketId) {
    this.voiceUsers.delete(socketId);
    
    // Clean up any pending offers involving this user
    const offersToDelete = [];
    for (const offerKey of this.pendingOffers.keys()) {
      if (offerKey.includes(socketId)) {
        offersToDelete.push(offerKey);
      }
    }
    
    offersToDelete.forEach(key => {
      this.pendingOffers.delete(key);
    });
  }
} 