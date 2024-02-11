import mongoose, {Schema} from "mongoose";
// jwt ata bearer token mane ee jar usorot thak take ami malik buli kom mane ee ata sabir dore .
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt" ;
// import { ApiError } from "../utils/apiError.js";

const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique: true,
        lowercase:true,
        trim:true
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type: String, //cloudaniry url
        required:true
    },
    coverImage:{
        type: String
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true, "password is required"],
    },
    refreshToken:{
        type:String
    }

}, {timestamps:true})

// ami direct password encrypt koribo nuwaru kintu jatia controller or hohaioyot data save hoboloi jai save huwar just olp agote ami mongoose hook ba pluginor hohaiyot tak encrypt koridibo paru


//iyat ami  arrow function use koribo nuwaru karon arrow functionor vitorot this or reference natha k , kionu ami iyat password save huwar agot iyak encrypt korim gotik this mane passwordor reference lagibo so ami normal function use koribo lagibo
userSchema.pre("save", async function(next){
    // iyat ami condition check ai karone korisu jatia user a jikunu ata fieldor data manupulate koribo tatiai password notunkoi encrypt hbo haikarone ami check korisu j kebol jodi password fieldot change hoi tatia ha ai function tu run hbo
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10);
    }else{
        return next();
    }
    
});

// Atia ami password tu encrypt kori tu save korilu kintu jatia usere login korute password dibo tatia kana k ami gom pam j agor password tu ai hoi haikarone ami atia ata nijor METHOD bonam jiye naki usere atia dia password ru ami encrypt kori save kora password tu compare koribo ru amk returnot true & false answer dibo.
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}
// create Access token using jwt
userSchema.methods.generateAccessToken =  function () {
        return jwt.sign(
            {
                _id:this._id,
                email:this.email,
                username:this.username,
                fullname:this.fullname
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "1d"
            }
        )
}
   
// create Refresh token using jwt
userSchema.methods.generateRefreshToken = function(){
        return jwt.sign(
            {
                _id : this._id,
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn:"10d"
            }
        )
}
export const User = mongoose.model("User", userSchema);