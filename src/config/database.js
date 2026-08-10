import mongoose from "mongoose";
import dotenv from "./config.js";

async function connectDB(){
    await mongoose.connect(dotenv.MONGO_URI)

    console.log("connect to db");
    
}


export default connectDB;