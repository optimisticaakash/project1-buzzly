import { createSlice } from "@reduxjs/toolkit";

const onlineSlice = createSlice({
  name: "online",
  initialState: {},
  reducers: {
    setOnlineUsers: (state, action) => {
      return action.payload;
    }
  }
});

export const { setOnlineUsers } = onlineSlice.actions;
export default onlineSlice.reducer;