import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"

// create generate access and refresh token method
const generateAccessAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId);
        const accesstoken= User.generateAccessToken(userId);
        const refreshtoken=User.generateRefreshToken(userId);  
        
        user.refreshToken = refreshtoken;
        await user.save({validateBeforeSave:false})
    
        return {accesstoken, refreshtoken}
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
    const {accesstoken, refreshtoken}=await generateAccessAndRefreshToken(user._id);

    // update refresh token because user token is empty
    user.refreshToken = refreshtoken;
    // send cookie with options // return response
    const options = {
        httpOnly:true,
        secure:true
    }
    return res.status(200).cookie("accessToken", accesstoken, options).cookie("refreshtoken", refreshtoken, options).json(
        // save the user in the cookies
        new ApiResponse(
            200,
            {
                user: user, accesstoken, refreshtoken
            },
            'successfully logged in',
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
export {registerUser, loginUser, logoutUser};