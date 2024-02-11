import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"

// create generate access and refresh token method
const generateAccessAndRefreshTokens = async (userId)=>{
    try {
        const user = await User.findById(userId);

        const accessToken=  user.generateAccessToken();
        const refreshToken= user.generateRefreshToken()  
        
        
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false})
    
        return {accessToken, refreshToken};
    } catch (error) {
        return new ApiError(401, "error in generate access and refresh token", error);
    }
}

// create register user method
const registerUser = asyncHandler(async (req, res)=>{
    // step 1 - front-endor pora useror data bur lom
    const {fullname, username,email, password} = req.body;
    console.log(req.body);
    // step 2 - tar pasot hokolu data validate korim jate jodi kunuba ata required field khali thaki goise naki . jodi khali ase tente error message dim
    if ([fullname, username, email, password].some((field)=>field?.trim()==="")) {
        throw new ApiError(400, "this field is required")
    }

    // step 3 - user agote register ase naki check korim
    const existedUser = await User.findOne({
        $or:[{email}, {username}]
    })
    if (existedUser) {
        throw new ApiError(409, "user is already registered");
    }
    // step 4 - avater tu multeror joriote amr serverot valdore upload hol nai jodi valdore upload hol tente iyak cloudinaryt upload kori dim nohole error dim
    console.log("Aikhini hoise request.files::: ",req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar tu diboi lagibo set");
    }
    let coverImageLocalPath;
    if (res.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    console.log(req.files);
    // upload files in cloudinary
    const avatar = await uploadCloudinary(avatarLocalPath);
    const coverImage =await uploadCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Avatar tu lagiboi bal kela");
    }

    //step 5 - hokolu data databaseot enter korim .
    const user = await User.create({
        fullname,
        username: username.toLowerCase(),
        email,
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
    })
    
    // step 6 - databaseot enter huwar pasot jitu response ahibo tar pora password aru referesh token remove kori dim
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" // ai kaita ami return nokoru
    )
    // step 7 - user valdore create hol nai check korim
    if (!createdUser) {
        throw new ApiError(500, "internal server error !! cann't register user");
    }
    // step 8 - response tu return kori dim
    return res.status(201).json(
       new ApiResponse(201, createdUser, "registered sucessfully")
    )

});


// create login user method
const loginUser = asyncHandler(async (req, res)=>{
    // get data from request body
    const { email, password, username }= req.body;
    // validate user using email or username
    if (!(email || username)) {
        throw new ApiError(400, "email or username is required");
    }
    // find the user
    const user = await User.findOne({
        $or:[{"username":username}, {"email":email}]// methods from mongoDB database through mongoose.
    })
    // if there is no such user then send an error message
    if(!user){
        throw new ApiError(401, "user not exists");
    }
    // check password using myuser
    const isPasswordValid = await user.isPasswordCorrct(password)
    // if password is valid then go to next middleware otherwise show an error
    if(!isPasswordValid){
        throw new ApiError(401, "incorrect password");
    }
    // send access and refresh token
    const {accessToken, refreshToken}= await generateAccessAndRefreshTokens(user._id);
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    // send cookie with options // return response
    const options = {
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        // save the user in the cookies
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            accessToken,
            refreshToken,
            'successfully logged in hoi gol kela',
        )
    )

   
    
})

 // create log out user method
 const logoutUser = asyncHandler(async (req, res)=>{
    // get the user from the req object
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken : undefined
            }
        },
        {
            new: true,
        }
    )

    const options = {
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken", options)
    .cookie("refreshtoken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "successfully logged out"
        )
    )
})


// create refresh Access token method
const refreshAccessToken = asyncHandler(async(req, res)=>
{
    const incomingAccessToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingAccessToken) {
        throw new ApiError(401, "unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(incomingAccessToken, process.env.REFRESH_TOKEN_SECRET);
        
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }


        if (incomingAccessToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }

        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);

        const options = {
            httpOnly:true,
            secure:true
        }

        res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("accessToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken:newRefreshToken},
                "Access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

// create update password
const changeCurrentPassword = asyncHandler(async(req, res)=>
{
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id)
    // check old password correct or not
    const isPasswordCorrect = await user.isPasswordCorrct(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Old password is incorrect")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "password change successfully"
        )
    )
})

// create get current user method
const getCurrentUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(200, req.user, "current user fetched successfully")
})


// create update Account Details method
const updateAccountDetails = asyncHandler(async(req, res)=>{
    const {fullname, email} = req.body;

    if (!(fullname || email)) {
        throw new ApiError(400, "all field are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {
            new:true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, {user}, "account details are update successfully")
    )
})


// create files update method
const updateUserAvatar = asyncHandler(async(req, res)=>
{
    let avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(400, "Error while updating avatar")
    }

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "avatar update successfully"
            )
    )
}) 

// create files update cover image method
const updateUserCoverImage = asyncHandler(async(req, res)=>
{
    let coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "cover image file is missing")
    }

    const coverImage = await uploadCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
        throw new ApiError(400, "Error while updating cover image")
    }

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar: coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "cover image update successfully"
            )
    )
}) 

export {
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
};