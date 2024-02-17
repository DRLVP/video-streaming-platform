import mongoose, {isValidObjectId, mongo} from "mongoose";
import { uploadCloudinary } from "../utils/cloudinary.js";
import {User} from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import {ApiResponse} from "../utils/apiResponse.js";
import { Video } from "../models/video.model.js";

// create upload video method
const publishAVideo = asyncHandler(async(req, res)=>{
    // bodyr pora title ru description loi lom
    const {title, description} = req.body;

    // title aru description ahise nai sam
    if ([title, description].some((field)=>field?.trim()) === "") {
        throw new ApiError(400, "title and description is required")
    }

    //video ru thumbnailor local path
    const videoLocalPath = await req.files?.videoFile[0]?.path;
    if (!videoLocalPath) {
        throw new ApiError(401, "video file is required");
    }
    const thumbnailLocalPath = await req.files?.thumbnail[0].path;

    //check korim local path ahise nai
    if (!thumbnailLocalPath) {
        throw new ApiError(401, "thumbnail is required");
    }
    
    // jodi ahise tente iyak cloudinaryt upload korim
    const videoFile = await uploadCloudinary(videoLocalPath);
    const thumbnailFile = await uploadCloudinary(thumbnailLocalPath);

    if (!(videoFile && thumbnailFile)) {
        throw new ApiError(400, "video and thumbnail files is not found")
    }

    // video files collection create korim databaseot
    const video = await Video.create({
        title,
        description,
        duration:videoFile?.duration,

        videoFile:{
            url:videoFile.url,
            public_id: videoFile.public_id
        },
        thumbnail:{
            url:thumbnailFile.url,
            public_id:thumbnailFile.public_id
        },
        isPublished: true,
        owner: req.user?._id
    })


    // upload hol nai sam idr hohayat
    const uploadVideo = await Video.findById(video._id);
    if (!uploadVideo) {
        throw new ApiError(500, "video upload failed, please retry!!")
    }

    // jodi hoi gol response return korim
    res.status(200).json(
        new ApiResponse(200, video, "video upload successfully")
    )
})

// create getAllvideos method
const getAllvideos = asyncHandler(async(req, res)=>{
    const {page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    console.log("req.queryt aikhini ahise::", req.query);
    const pipeline = [];

    if (query) {
        pipeline.push({
            $search:{
                index:"search-index",
                text:{
                    query:query,
                    path:["title", "description"]
                }
            }
        })
    }
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user Id");
        }
        pipeline.push({
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    // fetch all videos which publish status is true
    pipeline.push({ 
        $match: {
            isPublished:true
        } 
    })

    // sort videos accending and decending order
    if (sortBy && sortType) {
        pipeline.push({
            $sort : {
                 [sortBy] : sortType == 'desc' ? -1 : 1
            }
        })
    }else{
        pipeline.push({$sort : {'createdAt': -1}})
    }

    const options = {
        page : parseInt(page, 1),
        limit: parseInt(limit, 10)
    }

    const video = await Video.aggregatePaginate(
        Video.aggregate(pipeline),
        options
    )

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "videos fetched successfully"
        )
    )
})

// create get a video by ID
const getVideoById = asyncHandler(async(req, res)=>{
    const {videoId} = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video ID");
    }

    const video = await Video.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"Likes"
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"Owner",
                pipeline:[
                    {
                        $lookup:{
                            from:"subscriptions",
                            localField:"_id",
                            foreignField:"channel",
                            as:"subscribers"
                        }
                    },
                    {
                        $addFields:{
                            subscribersCount:{
                                $size:"$subscribers"
                            },
                            isSubscribed:{
                                $cond:{
                                    $if:{
                                        $in:[req.user?._id, "$subscribers.subscriber"]
                                    },
                                    then:true,
                                    else:false
                                }            
                            }
                        }
                    },
                    {
                        $project:{
                            username:1,
                            "avatar.url":1,
                            subscribersCount:1,
                            isSubscribed:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size:"$likes"
                },
                owner:{
                    $first:"$Owner"
                },
                isLiked:{
                    $cond:{
                        $if:{
                            $in:[req.user?._id, "$likes.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                "videoFile.url":1,
                owner:1,
                title: 1,
                description: 1,
                views:1,
                createdAt:1,
                updatedAt:1,
                duration:1,
                comments:1,
                likesCount:1,
                isLiked:1
            }
        }
    ]);

    if (!video) {
        throw new ApiError(500, "failed to fetched video")
    }

    // increment views count
    await Video.findByIdAndUpdate(
       videoId,
       {
            $inc :{
                views:1
            }
       }
    )

    // add video to user watch history
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $addToSet:{
                watchHistory:videoId
            }
        }
    );

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            video[0],
            "video fetched successfully"
        )
    )
})
export{
    publishAVideo,
    getAllvideos,
    getVideoById
}