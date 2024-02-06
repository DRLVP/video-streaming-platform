import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors"


// url or pora jatiai data ahe besibhg khetrote req.params or joriote ahe
const app = express();
// cors configuration app.use methodot middleware set kora hoi
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.json({limit:"16kb"}))
//get data from url with special character
app.use(express.urlencoded({extended:true, limit:"16kb"}))
// use data from static folder
app.use(express.static("public"));


// set cookies in browser
app.use(cookieParser());

//export the app
export {app};