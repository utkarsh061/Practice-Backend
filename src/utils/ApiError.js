//Created class to handle all API errors and to show that API error will come in this format only

class ApiError extends Error{
    constructor(
        statusCode,
        message= "Something Went Wrong",
        errors = [],
        statck=""
    ){
        super(message) // using super to show that, we have to override message(compulsary)
        this.statusCode = statusCode,
        this.data = null,
        this.message = message,
        this.success = false,
        this.errors = errors

        if(statck){         //to get exact error 
            this.statck = statck
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export default ApiError