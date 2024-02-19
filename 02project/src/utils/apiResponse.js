class ApiResponse{
    constructor(
        statuscode,
        data,
        message="Success",
    ){
        this.statuscode=statuscode < 400
        this.data=data
        this.message=message
    }
}