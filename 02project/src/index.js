//require('dotenv').config({path:'./env'})
import dotenv from 'dotenv'
import connectDB from './db/index.js';
import { app } from './app.js';

dotenv.config({
    path: './env'
})

const port = process.env.PORT||4000;

connectDB()
.then(()=>{
    app.listen(port, ()=>{
        console.log(`server is running ${port}`)
    })
})
.catch((error)=>{
    console.log(`error occurred in database connection ${error}`)
})
// immediately invoked function expressions (IIFE) are used to create a function expression 
// and execute it immediately after its definition.
/*
import mongoose from 'mongoose';
import { DB_NAME } from './constants';
import express from 'express'
const app = express()
;(async ()=>{
    try{
        PORT = process.env.PORT
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("errror", ()=>{
            console.log(process.env.PORT,"error :", error)
        })
        app.listen(PORT, ()=>{
            console.log("App is listening on port :", {PORT})
        })
    }
    catch(error){
        console.log("error occurred")
    }
})();
*/