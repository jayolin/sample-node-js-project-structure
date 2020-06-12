"use strict";
import BaseError from "./base";
import HttpStatus from "http-status-codes";
class BadRequestError extends BaseError {
    constructor(
        message = "The request was not properly formatted",
        status = HttpStatus.BAD_REQUEST,
        data
    ) {
        super(message, status, data);
        this.name = "BadRequestError";
    }
}

export default BadRequestError;