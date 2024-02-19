import express from 'express';
import cors from 'cors'
import cookieParser from "cookie-parser" 
const app = express()
//app.use is used when we need to do some middleware configurations
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"16kb"}))// for taking the json response
app.use(express.urlencoded({extended: true, limit:"16kb"})) // for taking response from url
app.use(express.static("public")) //to store the files or folders as public asset
app.use(cookieParser())//to access and set the cookies of users browser from the server


export {app}