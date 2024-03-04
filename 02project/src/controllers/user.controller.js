import { ApiError } from '../utils/apiError.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import User from '../models/user.model.js'
import { uploadCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/apiResponse.js'
import jwt from "jsonwebtoken"
import { uploadOnCloudinary } from '../utils/cloudinary.js'

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
    console.log(req.body);
    console.log(email);
    console.log(password);

    if(!(email || username)){
        throw new ApiError(400,"Either username or email is required")
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
    console.log(accessToken);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    console.log(loggedInUser);
    const options = {
        httpOnly: true, // When httpOnly is set to true, it means that the cookie is only accessible 
        // through HTTP requests and cannot be accessed by client-side scripts in the browser.
        secure: true // When secure is set to true, it means that the cookie will only be sent over 
        // HTTPS connections. 
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User loggedin Successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true, // When httpOnly is set to true, it means that the cookie is only accessible 
        // through HTTP requests and cannot be accessed by client-side scripts in the browser.
        secure: true // When secure is set to true, it means that the cookie will only be sent over 
        // HTTPS connections. 
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"))
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies.accessToken || req.body.accessToken // for pc browsers and mobile

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }
    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )
    const user = await User.findById(decodedToken?._id)
    if(!user){
        throw new ApiError(401,"unauthorized request")
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401,"Refresh token is expired")
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    const{accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)

    return res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", newRefreshToken)
    .json(
        new ApiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access Token refreshed successfully"
        )
    )
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

const changeCurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email} = req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true //will return the updated information
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req, res)=>{
    const {username} = req.params

    if(!username){
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate(// using aggregartion pipeline
        [{
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
};