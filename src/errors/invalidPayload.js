"use strict";
import BaseError from "./base";
import HttpStatus from "http-status-codes";

class InvalidPayloadError extends BaseError {
  constructor(
    message = "Provided payload is invalid",
    status = HttpStatus.BAD_REQUEST,
    data
  ) {
    super(message, status, data);
    this.name = "InvalidPayloadError";
  }
}

export default InvalidPayloadError;
