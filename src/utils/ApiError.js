//Created class to handle all API errors and to show that API error will come in this format only

class ApiError extends Error{
    constructor(
        statusCode,
        message= "Something Went Wrong",
        errors = [],
        stack=""
    ){
        super(message) // using super to show that, we have to override message(compulsary)
        this.statusCode = statusCode,
        this.data = null,
        this.message = message,
        this.success = false,
        this.errors = errors

        if(stack){         //to get exact error 
            this.stack = stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export default ApiError