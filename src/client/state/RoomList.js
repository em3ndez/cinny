import EventEmitter from 'events';
import appDispatcher from '../dispatcher';
import cons from './cons';

class RoomList extends EventEmitter {
  constructor(matrixClient) {
    super();
    this.matrixClient = matrixClient;
    this.mDirects = this.getMDirects();

    this.inviteDirects = new Set();
    this.inviteSpaces = new Set();
    this.inviteRooms = new Set();

    this.directs = new Set();
    this.spaces = new Set();
    this.rooms = new Set();

    this.processingRooms = new Map();

    this._populateRooms();
    this._listenEvents();

    appDispatcher.register(this.roomActions.bind(this));
  }

  roomActions(action) {
    const addRoom = (roomId, isDM) => {
      const myRoom = this.matrixClient.getRoom(roomId);
      if (myRoom === null) return false;

      if (isDM) this.directs.add(roomId);
      else if (myRoom.isSpaceRoom()) this.spaces.add(roomId);
      else this.rooms.add(roomId);
      return true;
    };
    const actions = {
      [cons.actions.room.JOIN]: () => {
        if (addRoom(action.roomId, action.isDM)) {
          setTimeout(() => {
            this.emit(cons.events.roomList.ROOM_JOINED, action.roomId);
            this.emit(cons.events.roomList.ROOMLIST_UPDATED);
          }, 100);
        } else {
          this.processingRooms.set(action.roomId, {
            roomId: action.roomId,
            isDM: action.isDM,
            task: 'JOIN',
          });
        }
      },
      [cons.actions.room.CREATE]: () => {
        if (addRoom(action.roomId, action.isDM)) {
          setTimeout(() => {
            this.emit(cons.events.roomList.ROOM_CREATED, action.roomId);
            this.emit(cons.events.roomList.ROOM_JOINED, action.roomId);
            this.emit(cons.events.roomList.ROOMLIST_UPDATED);
          }, 100);
        } else {
          this.processingRooms.set(action.roomId, {
            roomId: action.roomId,
            isDM: action.isDM,
            task: 'CREATE',
          });
        }
      },
    };
    actions[action.type]?.();
  }

  getMDirects() {
    const mDirectsId = new Set();
    const mDirect = this.matrixClient
      .getAccountData('m.direct')
      ?.getContent();

    if (typeof mDirect === 'undefined') return mDirectsId;

    Object.keys(mDirect).forEach((direct) => {
      mDirect[direct].forEach((directId) => mDirectsId.add(directId));
    });

    return mDirectsId;
  }

  _populateRooms() {
    this.directs.clear();
    this.spaces.clear();
    this.rooms.clear();
    this.inviteDirects.clear();
    this.inviteSpaces.clear();
    this.inviteRooms.clear();
    this.matrixClient.getRooms().forEach((room) => {
      const { roomId } = room;
      const tombstone = room.currentState.events.get('m.room.tombstone');
      if (typeof tombstone !== 'undefined') {
        const repRoomId = tombstone.get('').getContent().replacement_room;
        const repRoomMembership = this.matrixClient.getRoom(repRoomId)?.getMyMembership();
        if (repRoomMembership === 'join') return;
      }

      if (room.getMyMembership() === 'invite') {
        if (this._isDMInvite(room)) this.inviteDirects.add(roomId);
        else if (room.isSpaceRoom()) this.inviteSpaces.add(roomId);
        else this.inviteRooms.add(roomId);
        return;
      }

      if (room.getMyMembership() !== 'join') return;

      if (this.mDirects.has(roomId)) this.directs.add(roomId);
      else if (room.isSpaceRoom()) this.spaces.add(roomId);
      else this.rooms.add(roomId);
    });
  }

  _isDMInvite(room) {
    const me = room.getMember(this.matrixClient.getUserId());
    const myEventContent = me.events.member.getContent();
    return myEventContent.membership === 'invite' && myEventContent.is_direct;
  }

  _listenEvents() {
    // Update roomList when m.direct changes
    this.matrixClient.on('accountData', (event) => {
      if (event.getType() !== 'm.direct') return;

      const latestMDirects = this.getMDirects();

      latestMDirects.forEach((directId) => {
        const myRoom = this.matrixClient.getRoom(directId);
        if (this.mDirects.has(directId)) return;

        // Update mDirects
        this.mDirects.add(directId);

        if (myRoom === null) return;

        if (this._isDMInvite(myRoom)) return;

        if (myRoom.getMyMembership === 'join' && !this.directs.has(directId)) {
          this.directs.add(directId);
        }

        // Newly added room.
        // at this time my membership can be invite | join
        if (myRoom.getMyMembership() === 'join' && this.rooms.has(directId)) {
          // found a DM which accidentally gets added to this.rooms
          this.rooms.delete(directId);
          this.emit(cons.events.roomList.ROOMLIST_UPDATED);
        }
      });
    });

    this.matrixClient.on('Room.name', () => {
      this.emit(cons.events.roomList.ROOMLIST_UPDATED);
    });
    this.matrixClient.on('Room.receipt', (event, room) => {
      if (event.getType() === 'm.receipt') {
        const content = event.getContent();
        const userReadEventId = Object.keys(content)[0];
        const eventReaderUserId = Object.keys(content[userReadEventId]['m.read'])[0];
        if (eventReaderUserId !== this.matrixClient.getUserId()) return;
        this.emit(cons.events.roomList.MY_RECEIPT_ARRIVED, room.roomId);
      }
    });

    this.matrixClient.on('RoomState.events', (event) => {
      if (event.getType() !== 'm.room.join_rules') return;

      this.emit(cons.events.roomList.ROOMLIST_UPDATED);
    });

    this.matrixClient.on('Room.myMembership', (room, membership, prevMembership) => {
      // room => prevMembership = null | invite | join | leave | kick | ban | unban
      // room => membership = invite | join | leave | kick | ban | unban
      const { roomId } = room;

      if (membership === 'unban') return;

      // When user_reject/sender_undo room invite
      if (prevMembership === 'invite') {
        if (this.inviteDirects.has(roomId)) this.inviteDirects.delete(roomId);
        else if (this.inviteSpaces.has(roomId)) this.inviteSpaces.delete(roomId);
        else this.inviteRooms.delete(roomId);

        this.emit(cons.events.roomList.INVITELIST_UPDATED, roomId);
      }

      // When user get invited
      if (membership === 'invite') {
        if (this._isDMInvite(room)) this.inviteDirects.add(roomId);
        else if (room.isSpaceRoom()) this.inviteSpaces.add(roomId);
        else this.inviteRooms.add(roomId);

        this.emit(cons.events.roomList.INVITELIST_UPDATED, roomId);
        return;
      }

      // When user join room (first time) or start DM.
      if ((prevMembership === null || prevMembership === 'invite') && membership === 'join') {
        // when user create room/DM OR accept room/dm invite from this client.
        // we will update this.rooms/this.directs with user action
        if (this.directs.has(roomId) || this.spaces.has(roomId) || this.rooms.has(roomId)) return;

        if (this.processingRooms.has(roomId)) {
          const procRoomInfo = this.processingRooms.get(roomId);

          if (procRoomInfo.isDM) this.directs.add(roomId);
          else if (room.isSpaceRoom()) this.spaces.add(roomId);
          else this.rooms.add(roomId);

          if (procRoomInfo.task === 'CREATE') this.emit(cons.events.roomList.ROOM_CREATED, roomId);
          this.emit(cons.events.roomList.ROOM_JOINED, roomId);
          this.emit(cons.events.roomList.ROOMLIST_UPDATED);

          this.processingRooms.delete(roomId);
          return;
        }
        if (room.isSpaceRoom()) {
          this.spaces.add(roomId);

          this.emit(cons.events.roomList.ROOM_JOINED, roomId);
          this.emit(cons.events.roomList.ROOMLIST_UPDATED);
          return;
        }

        // below code intented to work when user create room/DM
        // OR accept room/dm invite from other client.
        // and we have to update our client. (it's ok to have 10sec delay)

        // create a buffer of 10sec and HOPE client.accoundData get updated
        // then accoundData event listener will update this.mDirects.
        // and we will be able to know if it's a DM.
        // ----------
        // less likely situation:
        // if we don't get accountData with 10sec then:
        // we will temporary add it to this.rooms.
        // and in future when accountData get updated
        // accountData listener will automatically goona REMOVE it from this.rooms
        // and will ADD it to this.directs
        // and emit the cons.events.roomList.ROOMLIST_UPDATED to update the UI.

        setTimeout(() => {
          if (this.directs.has(roomId) || this.spaces.has(roomId) || this.rooms.has(roomId)) return;
          if (this.mDirects.has(roomId)) this.directs.add(roomId);
          else this.rooms.add(roomId);

          this.emit(cons.events.roomList.ROOM_JOINED, roomId);
          this.emit(cons.events.roomList.ROOMLIST_UPDATED);
        }, 10000);
        return;
      }

      // when room is a DM add/remove it from DM's and return.
      if (this.directs.has(roomId)) {
        if (membership === 'leave' || membership === 'kick' || membership === 'ban') {
          this.directs.delete(roomId);
          this.emit(cons.events.roomList.ROOM_LEAVED, roomId);
        }
      }
      if (this.mDirects.has(roomId)) {
        if (membership === 'join') {
          this.directs.add(roomId);
          this.emit(cons.events.roomList.ROOM_JOINED, roomId);
        }
        this.emit(cons.events.roomList.ROOMLIST_UPDATED);
        return;
      }
      // when room is not a DM add/remove it from rooms.
      if (membership === 'leave' || membership === 'kick' || membership === 'ban') {
        if (room.isSpaceRoom()) this.spaces.delete(roomId);
        else this.rooms.delete(roomId);
        this.emit(cons.events.roomList.ROOM_LEAVED, roomId);
      }
      if (membership === 'join') {
        if (room.isSpaceRoom()) this.spaces.add(roomId);
        else this.rooms.add(roomId);
        this.emit(cons.events.roomList.ROOM_JOINED, roomId);
      }
      this.emit(cons.events.roomList.ROOMLIST_UPDATED);
    });

    this.matrixClient.on('Room.timeline', (event, room) => {
      const supportEvents = ['m.room.message', 'm.room.encrypted', 'm.sticker'];
      if (!supportEvents.includes(event.getType())) return;

      const lastTimelineEvent = room.timeline[room.timeline.length - 1];
      if (lastTimelineEvent.getId() !== event.getId()) return;
      this.emit(cons.events.roomList.EVENT_ARRIVED, room.roomId);
    });
  }
}
export default RoomList;
