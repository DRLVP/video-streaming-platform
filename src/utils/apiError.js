class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stackChk = ""
    ){
        super(message)
        this.statusCode = statusCode,
        this.data = null,
        this.message = message,
        this.errors = errors,
        this.success = false

        if (stackChk) {
            this.stack = stackChk
        }else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {ApiError};