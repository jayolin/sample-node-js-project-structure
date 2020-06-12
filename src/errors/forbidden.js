"use strict";
import BaseError from "./base";
import HttpStatus from "http-status-codes";
class ForbiddenError extends BaseError {
  constructor(
    message = "You do not have permission to access this API endpoint.",
    status = HttpStatus.FORBIDDEN,
    data
  ) {
    super(message, status, data);
    this.name = "ForbiddenError";
  }
}

export default ForbiddenError;
