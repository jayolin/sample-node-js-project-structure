"use strict";
import BaseError from "./base";
import HttpStatus from "http-status-codes";
class MethodNotAllowedError extends BaseError {
  constructor(
    message = "method not allowed",
    status = HttpStatus.METHOD_NOT_ALLOWED,
    data
  ) {
    super(message, status, data);
    this.name = "MethodNotAllowedError";
  }
}

export default MethodNotAllowedError;
