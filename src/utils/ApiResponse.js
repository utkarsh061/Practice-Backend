//Created class to generalize the data that we are sending in Response on api call

class ApiResponse {
    constructor(statusCode , data, message ="Success"){
        this.statusCode = statusCode,
        this.data = data,
        this.message = message,
        this.success = statusCode < 400
    }
}

export default ApiResponse;