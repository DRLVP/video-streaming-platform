import mongoose, {isValidObjectId} from "mongoose";
import { uploadCloudinary } from "../utils/cloudinary.js";
import {User} from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js";
import {apiResponse} from "../utils/apiResponse.js";


const uploadVideo = asyncHandler(async(req, res)=>{
    
})