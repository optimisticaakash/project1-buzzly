import imagekit from "../configs/imageKit.js";
import Message from "../models/Message.js";


// ================= SSE CONNECTION STORE =================
const connections = {};
const onlineUsers = {};

const broadcastOnlineUsers = () => {
  Object.values(connections).forEach((connection) => {
    connection.write(
      `data: ${JSON.stringify({
        type: "online",
        onlineUsers
      })}\n\n`
    );
  });
};

// ================= SSE CONTROLLER =================
export const sseController = (req, res) => {
  const { userId } = req.params;

  console.log("New client connected:", userId);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // ⚠️ REMOVE THIS:
  // res.setHeader("Access-Control-Allow-Origin", "*");

  connections[userId] = res;
  onlineUsers[userId] = true;

  // Broadcast to all users
  broadcastOnlineUsers();

  req.on("close", () => {
    delete connections[userId];
    delete onlineUsers[userId];

    console.log("Client disconnected:", userId);

    broadcastOnlineUsers();
  });
};


// ================= SEND MESSAGE =================
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id, text } = req.body;
    const image = req.file;

    let media_url = "";
    let message_type = image ? "image" : "text";

    // Upload image (memoryStorage compatible)
    if (image?.buffer) {
      const response = await imagekit.files.upload({
        file: image.buffer.toString("base64"),
        fileName: image.originalname,
        folder: "messages",
        transformation: {
          pre: "q-auto,f-webp,w-1280"
        }
      });

      media_url = response.url;
    }

    const message = await Message.create({
      from_user_id: userId,
      to_user_id,
      text,
      message_type,
      media_url
    });

    const messageWithUserData = await Message.findById(message._id)
      .populate("from_user_id");

    res.json({ success: true, message: messageWithUserData });

    // Send real-time message via SSE
    if (connections[to_user_id]) {
      connections[to_user_id].write(
        `data: ${JSON.stringify(messageWithUserData)}\n\n`
      );
    }

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};



// ================= GET CHAT MESSAGES =================
export const getChatMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id } = req.body;

    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id },
        { from_user_id: to_user_id, to_user_id: userId },
      ]
    })
      .sort({ createdAt: -1 });

    // Mark as seen
    await Message.updateMany(
      { from_user_id: to_user_id, to_user_id: userId },
      { seen: true }
    );

    res.json({ success: true, messages });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};



// ================= GET USER RECENT MESSAGES =================
export const getUserRecentMessages = async (req, res) => {
  try {
    
    const { userId } = req.auth();

    const messages = await Message.find({
      to_user_id: userId
    })
      .populate("from_user_id to_user_id")
      .sort({ createdAt: -1 });

    res.json({ success: true, messages });

  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


export const getOnlineUsers = (req, res) => {
  res.json({ success: true, onlineUsers });
};