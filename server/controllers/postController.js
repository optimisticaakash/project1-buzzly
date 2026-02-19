import imagekit from '../configs/imageKit.js';
import Post from '../models/Post.js';
import User from '../models/user.js';


// ADD POST 
export const addPost = async (req , res) => {
    try {
        const { userId } = req.auth();
        const { content , post_type } = req.body;
        const images = req.files || [];

        let image_urls = [];

        // Upload Images (memoryStorage based)
        if(images.length > 0){
            image_urls = await Promise.all(
                images.map(async (image) => {

                    const response = await imagekit.files.upload({
                        file : image.buffer.toString("base64"),
                        fileName : image.originalname,
                        folder : "posts",
                        transformation: {
                            pre: "q-auto,f-webp,w-1280"
                        }
                    });

                    return response.url;
                })
            );
        }

        await Post.create({
            user : userId,
            content,
            image_urls,
            post_type
        });

        res.json({success : true , message : "Post created successfully"});

    } catch (error) {
        console.log(error);
        res.json({success : false , message : error.message});
    }
};



//  GET FEED POSTS 
export const getFeedPosts = async (req , res) => {
    try {
        const { userId } = req.auth();
        const user = await User.findById(userId);

        const userIds = [
            userId,
            ...user.connections,
            ...user.following
        ];

        const posts = await Post.find({
            user : { $in : userIds }
        })
        .populate('user')
        .sort({ createdAt : -1 });

        res.json({success : true , posts});

    } catch (error) {
        console.log(error);
        res.json({success : false , message : error.message});
    }
};



//  LIKE POST 
export const likePost = async (req , res) => {
    try {
        const { userId } = req.auth();
        const { postId } = req.body;

        const post = await Post.findById(postId);

        if(!post){
            return res.json({success : false , message : "Post not found"});
        }

        if(post.likes_count.includes(userId)){
            post.likes_count = post.likes_count.filter(
                user => user !== userId
            );

            await post.save();
            return res.json({success : true , message : 'Post unliked'});
        }

        post.likes_count.push(userId);
        await post.save();

        res.json({success : true , message : 'Post liked'});

    } catch (error) {
        console.log(error);
        res.json({success : false , message : error.message});
    }
};
