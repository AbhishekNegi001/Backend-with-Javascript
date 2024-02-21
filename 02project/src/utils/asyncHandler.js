const asyncHandler = (requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((error)=>next(error))
    }
}
/*
const asyncHandler = (func)=> async(req, res, next)=>{
    try{
        func(req,res,next)
    }
    catch(error){
        res.status(error||500).json({
            success: false,
            message: error.message
        })
    }
}
*/
export {asyncHandler}