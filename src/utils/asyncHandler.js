const asyncHandler = (func) => {
    (req,res,next) => {
        Promise.resolve(func(req,res,next)).catch((error) => next(error))
    }   //if Promise is resolved execute the function else catch the error and pass it to next so that others can work
}
export default asyncHandler;