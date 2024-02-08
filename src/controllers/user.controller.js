import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadCloudinary} from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/apiResponse.js"


// create register user method
const registerUser = asyncHandler(async (req, res)=>{
    // step 1 - front-endor pora useror data bur lom
    const {fullname, username,email, password} = req.body;
    
    // step 2 - tar pasot hokolu data validate korim jate jodi kunuba ata required field khali thaki goise naki . jodi khali ase tente error message dim
    if ([fullname, username, email, password].some((field)=>field?.trim()==="")) {
        throw new ApiError(400, "this field is required")
    }

    // step 3 - user agote register ase naki check korim
    const existedUser = User.findOne({
        $or:[{email}, {username}]
    })
    if (existedUser) {
        throw new ApiError(409, "user is already registered");
    }
    // step 4 - avater tu multeror joriote amr serverot valdore upload hol nai jodi valdore upload hol tente iyak cloudinaryt upload kori dim nohole error dim
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    // upload files in cloudinary
    const avatar = await uploadCloudinary(avatarLocalPath);
    const coverImage =await uploadCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Avatar is required");
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
        ApiResponse(201, createdUser, "registered sucessfully")
    )

});

export {registerUser};