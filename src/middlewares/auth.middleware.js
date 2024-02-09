import { User } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import {asyncHandler} from "../utils/asyncHandler"
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async(req, _, next)=>{
    try {
        const token = await req.cookies?.accessToken || req.header("Authraization")?.replace("Bearer", "");
    
        if(!token){
            throw new ApiError(401, "unauthorized request");
        }
        // VERIFY TOKEN
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid user")
        }
        req.user = user;
        next();
    } catch (error) {
        return new ApiError(500, "Internal server error", error?.message);
    }

})