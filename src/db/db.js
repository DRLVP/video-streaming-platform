import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";

const connectDB = async()=>{
    try {
        // return a Object
        const Instance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`Mongodb connection hoi gol:  ${Instance.connection.host}`);
    } catch (error) {
        console.error(`CONNECTION HUWA NAI SET :${error}`);
        // process from node
        process.exit(1);
    }
};

export default connectDB;