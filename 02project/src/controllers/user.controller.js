import { ApiError } from '../utils/apiError.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import User from '../models/user.model.js'
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
    const { fullName, email, username, password } = req.body
    console.log("email :",email)

    //validate - field should not be empty
    if([fullName, email, username, password].some((value)=>value?.trim()==="")){
        throw new ApiError(400, "all fields are required")
    }

    ////check if user already exits
    const existedUser = await User.findOne({
        $or: [{username},{email}] // will find either any user with same username or email
    })

    if(existedUser){
        throw new ApiError(409,'user with same email or username already exists')
    }

    //check for images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    console.log(avatarLocalPath)

    //const coverImageLocalPath = req.files?.coverImage[0]?.path
    //console.log(coverImageLocalPath)

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files?.coverImage[0]?.path    
    }

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
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //on object creation all the input fields are returned in responses
    //remove the password and refresh token field from response
    const createdUser = await User.findById(user._id).select(//put whatever field we donot want
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

// get user data from request
// validate field is not empty
// take either username or email for login from the data
// find the user
// check for the password
// generate access and refresh token
// send cookies
const loginUser = asyncHandler(async (req,res)=>{
    const {email,username,password} = req.body

    if(!email || !username){
        throw new ApiError(400,"Either username or password is required")
    }
    const user = await User.findOne({
        $or: [{email},{username}] // or operator will find the value on the basis of either email or username
    })
    if(!user){
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(402,"Password not valid")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    
    const loggedInUser = User.findById(user._id).select("-password -refreshToken")
    //todo
    //user.refreshToken = refreshToken
    //const loggedInUser = user.select("-password -refreshToken")
})

const generateAccessAndRefreshToken = async (userId)=>{
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        user.save({validateBeforeSave:false})

        return {accessToken, refreshToken}
    }
    catch(error){
        throw new ApiError(500,"Something went wrong while generating tokens")
    }
}

export {registerUser,loginUser};