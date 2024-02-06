import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2" // use as a plugin

const videoSchema = new Schema({
    videoFile:{
        type: String,  //file id
        required:[true, 'Please upload a file'],
    },
    thumbnail:{
        type: String,  
        required:[true, 'Please upload a thumbnail'],
    },
    title:{
        type: String,  
        required:[true, 'title is required'],
    },
    description:{
        type: String, 
        required:[true, 'description is required'],
    },
    duration:{
        type: Number,
        default:0
    },
    views:{
        type: Number, 
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref:"User"
    },

}, {timestamps:true});

// atia ami videoSchemat aggregate query likhibo parim 
videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video", videoSchema);