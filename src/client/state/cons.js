const cons = {
  secretKey: {
    ACCESS_TOKEN: 'cinny_access_token',
    DEVICE_ID: 'cinny_device_id',
    USER_ID: 'cinny_user_id',
    BASE_URL: 'cinny_hs_base_url',
  },
  DEVICE_DISPLAY_NAME: 'Cinny Web',
  actions: {
    navigation: {
      CHANGE_TAB: 'CHANGE_TAB',
      SELECT_ROOM: 'SELECT_ROOM',
      TOGGLE_PEOPLE_DRAWER: 'TOGGLE_PEOPLE_DRAWER',
      OPEN_INVITE_LIST: 'OPEN_INVITE_LIST',
      OPEN_PUBLIC_CHANNELS: 'OPEN_PUBLIC_CHANNELS',
      OPEN_CREATE_CHANNEL: 'OPEN_CREATE_CHANNEL',
      OPEN_INVITE_USER: 'OPEN_INVITE_USER',
      OPEN_SETTINGS: 'OPEN_SETTINGS',
      OPEN_EMOJIBOARD: 'OPEN_EMOJIBOARD',
      OPEN_READRECEIPTS: 'OPEN_READRECEIPTS',
    },
    room: {
      JOIN: 'JOIN',
      LEAVE: 'LEAVE',
      CREATE: 'CREATE',
      error: {
        CREATE: 'ERROR_CREATE',
      },
    },
    settings: {
      TOGGLE_MARKDOWN: 'TOGGLE_MARKDOWN',
    },
  },
  events: {
    navigation: {
      TAB_CHANGED: 'TAB_CHANGED',
      ROOM_SELECTED: 'ROOM_SELECTED',
      PEOPLE_DRAWER_TOGGLED: 'PEOPLE_DRAWER_TOGGLED',
      INVITE_LIST_OPENED: 'INVITE_LIST_OPENED',
      PUBLIC_CHANNELS_OPENED: 'PUBLIC_CHANNELS_OPENED',
      CREATE_CHANNEL_OPENED: 'CREATE_CHANNEL_OPENED',
      INVITE_USER_OPENED: 'INVITE_USER_OPENED',
      SETTINGS_OPENED: 'SETTINGS_OPENED',
      EMOJIBOARD_OPENED: 'EMOJIBOARD_OPENED',
      READRECEIPTS_OPENED: 'READRECEIPTS_OPENED',
    },
    roomList: {
      ROOMLIST_UPDATED: 'ROOMLIST_UPDATED',
      INVITELIST_UPDATED: 'INVITELIST_UPDATED',
      ROOM_JOINED: 'ROOM_JOINED',
      ROOM_LEAVED: 'ROOM_LEAVED',
      ROOM_CREATED: 'ROOM_CREATED',
      MY_RECEIPT_ARRIVED: 'MY_RECEIPT_ARRIVED',
      EVENT_ARRIVED: 'EVENT_ARRIVED',
    },
    roomTimeline: {
      EVENT: 'EVENT',
      PAGINATED: 'PAGINATED',
      TYPING_MEMBERS_UPDATED: 'TYPING_MEMBERS_UPDATED',
      READ_RECEIPT: 'READ_RECEIPT',
    },
    roomsInput: {
      MESSAGE_SENT: 'MESSAGE_SENT',
      FILE_UPLOADED: 'FILE_UPLOADED',
      UPLOAD_PROGRESS_CHANGES: 'UPLOAD_PROGRESS_CHANGES',
      FILE_UPLOAD_CANCELED: 'FILE_UPLOAD_CANCELED',
      ATTACHMENT_CANCELED: 'ATTACHMENT_CANCELED',
    },
    settings: {
      MARKDOWN_TOGGLED: 'MARKDOWN_TOGGLED',
    },
  },
};

Object.freeze(cons);

export default cons;
