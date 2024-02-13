import mongoose, {Schema} from "mongoose";


const playlistSchema = new Schema({
    name:{
        type:String,
        required:[true,"Please provide a name for the playlist"]
    },
    description:{
        type: String
    },
    videos:[{
        type: Schema.Types.ObjectId,  
        ref:"Video"                     
    }],
    owner:{
        type: Schema.Types.ObjectId,
        ref: 'User'  //this is how we can establish a relationship between this model and User model
    }
}, {timestamps:true})


export const Playlist = mongoose.model("Playlist", playlistSchema)