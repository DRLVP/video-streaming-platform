import {asyncHandler} from "../utils/asyncHandler.js";
import mongoose, {isValidObjectId} from "mongoose";
import {ApiResponse} from "../utils/apiResponse.js";
import {ApiError} from "../utils/apiError.js";
import { Tweet } from "../models/tweet.model.js";

// create tweet method
const createTweet = asyncHandler(async(req, res)=>{
    const {content} = req.body;
    console.log("these are the content::", content);
    if (!content) {
        throw new ApiError(400, "content is required");
    }
    // create tweet
    const tweet = await Tweet.create({
        content, 
        owner:req?.user?._id
    })
    console.log("aitu kela tur tweet::", tweet);
    if (!tweet) {
        throw new ApiError(500, "internal server error!! please retry");
    }

    return res.status(200)
    .json(
        new ApiResponse(
            200, 
            tweet, 
            "tweet create successfully"
        )
    );
})

// create get all tweets controller
const getUserTweets = asyncHandler(async(req, res)=>{
    // get user id 
    const {userId} = req.params;
    // check userid valid or not
    if(!isValidObjectId(userId)) {
        throw new ApiError(400,"Invalid User Id")
    }
    // get owner of the user id
    const tweets = await Tweet.aggregate([
        {
            $match: new mongoose.Types.ObjectId(userId)
        },
        {
            $lookup:{
                from:"users",
                localField:"_id",
                foreignField:"owner",
                as:"Owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            "avatar.url" :1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"tweet",
                as:"Likes",

                pipeline:[
                    {
                        $project:{
                            likeBy:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                likeCount:{
                    "$size":"$Likes"
                },
                ownerDetails:{
                    $first:"$Owner"
                }
            }
        },
        {
            $project:{
                content:1,
                ownerDetails:1,
                likes:1,
            }
        }
    ]);

    if (!tweets) {
        throw new ApiError(500, "error fetching tweets");
    }

    res.status(200)
    .json(
        new ApiResponse(
            200,
            tweets,
            "all tweets fetched sucessfully"
        )
    )
})

// create update tweet controller
const updateTweet = asyncHandler(async(req, res)=>{
    const {content} = req.body;
    const {tweetId} = req.params;

    if (!content) {
        throw new ApiError(400, "content is required")
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(400, "tweet not found")
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "You can not update the tweet"
        )
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        {
            tweetId,
            $set:{content}
        },
        {new: true}, // return updated document instead of original one
    )


    if (!updatedTweet) {
        throw new ApiError(500, "internal server error, please try again")
    }

    res.status(200)
    .json(
        new ApiResponse(
            200,
            updatedTweet,
            "tweet update sucessfully"
        )
    )
})

// create delete tweet
const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404,"No such tweet exists");
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
           400,
           "You can not delete the tweet as you are not the owner"
        );
     }
  
     await Tweet.findByIdAndDelete(tweetId);
  
     return res.status(
        200,
        new ApiResponse(201, {}, "Tweet Deleted Successfully")
     );
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
};