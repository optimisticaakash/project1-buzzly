import express from "express";
import { getChatMessages, sendMessage, sseController,getOnlineUsers  } from "../controllers/messageController.js";
import { upload } from "../configs/multer.js";
import { protect } from "../middleware/auth.js";

const messageRouter = express.Router();

messageRouter.get('/:userId',sseController)
messageRouter.post('/send',upload.single('image'), protect , sendMessage)
messageRouter.post('/get' , protect , getChatMessages)
messageRouter.get('/online', protect, getOnlineUsers);

export default messageRouter