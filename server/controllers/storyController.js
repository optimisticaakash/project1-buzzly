import imagekit from "../configs/imageKit.js";
import Story from "../models/Story.js";
import User from "../models/user.js";
import { inngest } from "../inngest/index.js";


// ================= ADD USER STORY =================
export const addUserStory = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, media_type, background_color } = req.body;
    const media = req.file;

    let media_url = "";
    let media_fileId = "";

    // Upload media (image/video)
    if ((media_type === "image" || media_type === "video") && media) {

      const uploadResponse = await imagekit.files.upload({
        file: media.buffer.toString("base64"),
        fileName: media.originalname,
        folder: "stories",
      });

      media_url = uploadResponse.url;
      media_fileId = uploadResponse.fileId;  // ✅ IMPORTANT
    }

    const story = await Story.create({
      user: userId,
      content,
      media_url,
      media_fileId,  // ✅ NEW FIELD
      media_type,
      background_color,
    });

    // Schedule auto delete after 24h
    await inngest.send({
      name: "app/story.delete",  // 👈 correct event name
      data: { storyId: story._id }
    });

    res.json({ success: true, story });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


// ================= GET USER STORIES =================
export const getStories = async (req, res) => {
  try {
    const { userId } = req.auth();

    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const userIds = [
      userId,
      ...user.connections,
      ...user.following,
    ];

    const stories = await Story.find({
      user: { $in: userIds },
    })
      .populate("user")
      .sort({ createdAt: -1 });

    res.json({ success: true, stories });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


// ================= DELETE STORY =================
export const deleteStory = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { storyId } = req.params;

    const story = await Story.findById(storyId);

    if (!story) {
      return res.json({ success: false, message: "Story not found" });
    }

    // Only owner can delete
    if (story.user.toString() !== userId) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    // Delete from ImageKit safely
    if (story.media_fileId) {
      try {
        await imagekit.files.delete(story.media_fileId);
      } catch (err) {
        console.log("ImageKit delete error:", err.message);
      }
    }

    await Story.findByIdAndDelete(storyId);

    res.json({ success: true, message: "Story deleted successfully" });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};