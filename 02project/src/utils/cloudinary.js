import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'; //file system

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env. CLOUDINARY_API_SECRET
});

const uploadCloudinary = async (localFilePath)=>{
    try{
        if(!localFilePath) return null;

        //upload file on cloudinary
        const response = cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        console.log("File has been uploaded on cloudinary", (await response).url)
        return response
    }
    catch(error){
        fs.unlinkSync(localFilePath)// removes the locally saved temporary file as upload operation failed
        return null;
    }
}

export {uploadCloudinary};