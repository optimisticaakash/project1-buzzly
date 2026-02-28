import { Inngest } from "inngest";
import User from "../models/user.js";
import Connection from "../models/Connection.js";
import sendEmail from "../configs/nodeMailer.js";
import Story from "../models/Story.js";
import Message from "../models/Message.js";
import imagekit from "../configs/imageKit.js";



// Create a client to send and receive events
export const inngest = new Inngest({ id: "buzzly-app" });

// Inngest Function to save user data to a database
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    const email = email_addresses?.[0]?.email_address;

    if (!email) {
      throw new Error("Email not found in event data");
    }

    let username = email.split("@")[0];

    const user = await User.findOne({ username });

    if (user) {
      username = username + Math.floor(Math.random() * 10000);
    }

    const userData = {
      _id: id,
      email,
      full_name: first_name + " " + last_name,
      profile_picture: image_url,
      username,
    };

    await User.create(userData);
  }
);


// Inngest Function to update user data in database
const syncUserUpdation = inngest.createFunction(
    {id:'update-user-from-clerk'},
    {event:'clerk/user.updated'},
    async ({event}) =>{
        const {id,first_name,last_name,email_addresses ,image_url} = event.data
        

        const updatedUserData = {
            email: email_addresses[0].email_address,
            full_name: first_name + ' ' + last_name,
            profile_picture:image_url
        }
        await User.findByIdAndUpdate(id, updatedUserData)
    }
)


// Inngest Function to delete user data in database
const syncUserDeletion = inngest.createFunction(
    {id:'delete-user-from-clerk'},
    {event:'clerk/user.deleted'},
    async ({event}) =>{
        const {id} = event.data
        
        await User.findByIdAndDelete(id)
    }
)
// Inngest Function to send Reminder when a new connection request is added
const sendNewConnectionRequestReminder = inngest.createFunction(
    {id:"send-new-connection-request-reminder"},
    {event: "app/connection-request"},
    async ({event , step}) => {
        const {connectionId} = event.data;

        await step.run('send-connection-request-mail' , async() => {
            const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id');

            if (!connection) return { message: "Connection not found" };

            const subject = `👋🏻 New Connection Request`;
            const body = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Hi ${connection.to_user_id.full_name},</h2>

                <p>
                    You have a new connection request from 
                    <strong>${connection.from_user_id.full_name}</strong> 
                    (@${connection.from_user_id.username})
                </p>

                <p>
                    Click 
                    <a href="${process.env.FRONTEND_URL}/connections" 
                    style="color: #10b981; text-decoration: none; font-weight: bold;">
                    here
                    </a> 
                    to accept or reject the request.
                </p>

                <br/>

                <p>
                    Thanks,<br/>
                    <strong>Buzzly - Stay Connected</strong>
                </p>
            </div>
            `

            await sendEmail({
                to: connection.to_user_id.email,
                subject,
                body
            })
        })

        //24 hours ke baad reminder
        const in24Hours = new Date(Date.now() + 24* 60 * 60 * 1000)
        await  step.sleepUntil("wait-for-24-hours" , in24Hours);
        await step.run('send-connection-request-reminder' , async() => {
            const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id');

            if (!connection) return { message: "Connection not found" };


            

            if(connection.status === 'accepted'){
                return { message : "Already accepted"}
            }else if (!connection || connection.status !== "pending") {
                return { message: "No reminder needed" };
            }


            const subject = `👋🏻 New Connection Request`;
            const body = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Hi ${connection.to_user_id.full_name},</h2>

                <p>
                    You have a new connection request from 
                    <strong>${connection.from_user_id.full_name}</strong> 
                    (@${connection.from_user_id.username})
                </p>

                <p>
                    Click 
                    <a href="${process.env.FRONTEND_URL}/connections" 
                    style="color: #10b981; text-decoration: none; font-weight: bold;">
                    here
                    </a> 
                    to accept or reject the request.
                </p>

                <br/>

                <p>
                    Thanks,<br/>
                    <strong>Buzzly - Stay Connected</strong>
                </p>
            </div>
            `

            await sendEmail({
                to: connection.to_user_id.email,
                subject,
                body
            })

            return {message : "Reminder sent. "}
        })
    }

)

//Inngest Function to delete Story after 24 hours
const deleteStory = inngest.createFunction(
  { id: "story-delete" },
  { event: "app/story.delete" },
  async ({ event, step }) => {

    const { storyId } = event.data;

    // ✅ wait exactly 24 hours
    await step.sleep("24h");

    await step.run("delete-story", async () => {

      const story = await Story.findById(storyId);

      if (!story) {
        return { message: "Story already deleted" };
      }

      if (story.media_fileId) {
        try {
          await imagekit.files.delete(story.media_fileId);
        } catch (err) {
          console.log("ImageKit delete error:", err.message);
        }
      }

      await Story.findByIdAndDelete(storyId);

      return { message: "Story auto deleted after 24h" };
    });
  }
);

const sendNotificationOfUnseenMessages = inngest.createFunction(
    {id:"send-unseen-messages-notification"},
    {cron : "TZ=Asia/Kolkata 0 9 * * *"},//EveryDay 9 AM

    async ({step}) => {
        const messages = await Message.find({seen : false}).populate('to_user_id');
        const unseenCount = {}

        messages.map(message=> {
            unseenCount[message.to_user_id._id]=(unseenCount[message.to_user_id._id] || 0) + 1;
        })

        for(const userId in unseenCount){
            const user = await User.findById(userId);

            const subject = `📬 You have ${unseenCount[userId]} unseen messages`;
            const body = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Hi ${user.full_name},</h2>
            <p>You have ${unseenCount[userId]} unseen messages</p>
            <p>
                Click 
                <a href="${process.env.FRONTEND_URL}/messages" style="color: #10b981;">
                here
                </a> 
                to view them
            </p>
            <br/>
            <p>Thanks,<br/>Buzzly - Stay Connected</p>
            </div>
            `

            await sendEmail({
                to:user.email,
                subject,
                body
            })
        }
        return {message : "Notification sent."}
    }

) 

// Create an empty array where we'll export future Inngest functions
export const functions = [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    sendNewConnectionRequestReminder,
    deleteStory,
    sendNotificationOfUnseenMessages
];

