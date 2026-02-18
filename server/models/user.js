import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    _id : {
        type:String,
        required: true
    },
    email : {
        type:String,
        required: true
    },
    full_name : {
        type:String,
        unique: true
    },
    bio : {
        type:String,
        default: 'Hey there ! I am using Buzzly'
    },
    bio : {
        type:String,
        default: '',
    },
    cover_photo : {
        type:String,
        default: '',
    },
    location : {
        type:String,
        default: '',
    },
    followers : [{
        type:String,
        ref: 'User',
    }],
    following : [{
        type:String,
        ref: 'User',
    }],
    connection : [{
        type:String,
        ref: 'User',
    }],
},{timeStamps : true, minimize : false})

const User = mongoose.model('User' , userSchema)

export default User