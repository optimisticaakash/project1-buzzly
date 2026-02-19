import { connect } from "mongoose";
import imagekit from "../configs/imageKit.js";
import Connection from "../models/Connection.js";
import User from "../models/user.js";
import Post from "../models/Post.js";
import { inngest } from "../inngest/index.js";



// ================= GET USER DATA using userId =================
export const getUserData = async (req, res) => {
  try {
    const { userId } = req.auth();

    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};



// ================= UPDATE USER DATA =================
export const updatedUserData = async (req, res) => {
  try {
    console.log("UPDATE API HIT");
    console.log("FILES:", req.files);
    console.log("BODY:", req.body);



    const { userId } = req.auth();
    let { username, bio, location, full_name } = req.body;

    const tempUser = await User.findById(userId);

    if (!tempUser) {
      return res.json({ success: false, message: "User not found" });
    }

    if (!username) username = tempUser.username;

    // Username availability check
    if (tempUser.username !== username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        //we will not change the username if it is already taken
        username = tempUser.username;
      }
    }

    const updatedData = {
      username,
      bio,
      location,
      full_name,
    };

    const profile = req.files?.profile?.[0];
    const cover = req.files?.cover?.[0];

    // ================= PROFILE IMAGE =================
    if (profile?.buffer) {
        const uploadResponse = await imagekit.files.upload({
            file: profile.buffer.toString("base64"),
            fileName: profile.originalname,
            folder: "profiles",
        });

        console.log("PROFILE UPLOADED:", uploadResponse.url);

        updatedData.profile_picture = uploadResponse.url;
    }


    // ================= COVER IMAGE =================
    if (cover?.buffer) {
        const uploadResponse = await imagekit.files.upload({
            file: cover.buffer.toString("base64"),
            fileName: cover.originalname,
            folder: "covers",
        });

        console.log("COVER UPLOADED:", uploadResponse.url);

        updatedData.cover_photo = uploadResponse.url;
    }


    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updatedData,
      { returnDocument: "after" }

    );

    res.json({ success: true, user: updatedUser });

  } catch (error) {
    console.log("UPDATE ERROR:", error);
    res.json({ success: false, message: error.message });
  }
};



// ================= DISCOVER USERS =================
export const discoverUsers = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { input } = req.body;

    const users = await User.find({
      $or: [
        { username: new RegExp(input, "i") },
        { email: new RegExp(input, "i") },
        { full_name: new RegExp(input, "i") },
        { location: new RegExp(input, "i") },
      ],
    });

    const filteredUsers = users.filter(
      (u) => u._id.toString() !== userId
    );

    res.json({ success: true, users: filteredUsers });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};



// ================= FOLLOW USER =================
export const followUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const user = await User.findById(userId);
    const toUser = await User.findById(id);

    if (!user || !toUser) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.following.some((f) => f.toString() === id)) {
      return res.json({
        success: false,
        message: "Already following this user",
      });
    }

    user.following.push(id);
    await user.save();

    toUser.followers.push(userId);
    await toUser.save();

    res.json({ success: true, message: "Followed successfully" });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};



// ================= UNFOLLOW USER =================
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const user = await User.findById(userId);
    const toUser = await User.findById(id);

    if (!user || !toUser) {
      return res.json({ success: false, message: "User not found" });
    }

    user.following = user.following.filter(
      (u) => u.toString() !== id
    );
    await user.save();

    toUser.followers = toUser.followers.filter(
      (u) => u.toString() !== userId
    );
    await toUser.save();

    res.json({ success: true, message: "Unfollowed successfully" });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Send Connection Request
export const sendConnectionRequest = async (req, res)=>{

    try{
        const {userId} = req.auth()
        const {id} = req.body;

        // Prevent self request
        if (userId === id) {
        return res.json({
            success: false,
            message: "You cannot send connection request to yourself"
        });
        }

        //Check if user has send more than 20 connection requests in the last 24 hours
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000) 
        const connectionRequests = await Connection.find({from_user_id: userId , 
           createdAt : {$gt : last24Hours}})
           if(connectionRequests.length >= 20){
            return res.json({success : false , message : 'You have sent more than 20 connection requests in the last 24 hours '})
           }

        //    Check if users are already connected
        const connection = await Connection.findOne({
            $or : [
                {from_user_id : userId , to_user_id : id},
                {from_user_id : id , to_user_id : userId},
            ]
        })

        if(!connection){
            const newConnection =await Connection.create({
                from_user_id: userId,
                to_user_id : id,
            })

            await inngest.send({
                name : 'app/connection-request',
                data : {ConnectionId : newConnection._id}
            })

            return res.json({success : true , message : ' Connection request sent successfully'})
        }else if(connection && connection.status === 'accepted'){
            return res.json({success : false , message : 'You are already connected with this user'})
        }


        return res.json({success : false , message : 'Connection request pending'})

    } catch(error){
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Get User Connection
export const getUserConnections = async (req, res)=>{

    try{
        const {userId} = req.auth()
        const user = await User.findById(userId).populate('connections followers following')

        const connections = user.connections
        const followers = user.followers
        const following = user.following

        const pendingConnections = (await Connection.find({to_user_id : userId,
            status : 'pending'}).populate('from_user_id')).map(connection=> connection.from_user_id)

            res.json({success : true , connections , followers , following , pendingConnections})
   

    } catch(error){
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

//Accept the connection request
export const acceptConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const connection = await Connection.findOne({
      from_user_id: id,
      to_user_id: userId
    });

    if (!connection) {
      return res.json({
        success: false,
        message: "Connection not found"
      });
    }

    if (connection.status === "accepted") {
      return res.json({
        success: false,
        message: "Connection already accepted"
      });
    }

    const user = await User.findById(userId);
    const toUser = await User.findById(id);

    if (!user || !toUser) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.connections.includes(id)) {
      user.connections.push(id);
    }

    if (!toUser.connections.includes(userId)) {
      toUser.connections.push(userId);
    }

    await user.save();
    await toUser.save();

    connection.status = "accepted";
    await connection.save();

    res.json({
      success: true,
      message: "Connection accepted successfully"
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


// Get User Profiles
export const getUserProfiles = async (req, res) => {
  try {
    const {profileId} = req.body;
    const profile = await User.findById(profileId)

    if(!profile){
        return res.json({ success : false , message :"User not found"})
    }
    const posts = await Post.find({user : profileId}).populate('user')

    res.json({ success : true, profile , posts})

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
