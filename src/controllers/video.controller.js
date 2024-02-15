import mongoose, {isValidObjectId} from "mongoose";
import { uploadCloudinary } from "../utils/cloudinary.js";
import {User} from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import {ApiResponse} from "../utils/apiResponse.js";
import { Video } from "../models/video.model.js";


const uploadVideo = asyncHandler(async(req, res)=>{
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