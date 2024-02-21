import { ApiError } from '../utils/apiError.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import { User } from '../models/user.model.js'
import { uploadCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/apiResponse.js'

//get user details
//validate - field should not be empty
//check if user already exits
//check for images and avatar
//upload them into cloudinary
//create user object - create entry in db
//on object creation all the input fields are returned in responses
//remove the password and refresh token field from response
//check for user creation - if yes return response

//get user details
const registerUser = asyncHandler(async (req,res)=>{
    const { fullname, email, username, password } = req.body
    console.log("email :",email)

    //validate - field should not be empty
    if([fullname, email, username, password].some((value)=>value?.trim()==="")){
        throw new ApiError(400, "all fields are required")
    }

    ////check if user already exits
    const existedUser = User.findOne({
        $or: [{username},{email}] // will find either any user with same username or email
    })

    if(existedUser){
        throw new ApiError(409,'user with same email or username already exists')
    }

    //check for images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    console.log(avatarLocalPath)

    const coverImageLocalPath = req.files?.coverImage[0]?.path
    console.log(coverImageLocalPath)

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar File is required")
    }

    //upload them into cloudinary
    const avatar = await uploadCloudinary(avatarLocalPath)
    const coverImage = await uploadCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar File is required")
    }

    //create user object - create entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLower()
    })

    //on object creation all the input fields are returned in responses
    //remove the password and refresh token field from response
    const createdUser = await user.findById(user._id).select(//put whatever field we donot want
        "-password -refreshToken"
    )

    //check for user creation - if yes return response
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered")
    )
})

export default registerUser;