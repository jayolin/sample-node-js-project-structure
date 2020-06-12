import HttpStatus from "http-status-codes";

const BasicResponse = {
  success: false,
  status_code: HttpStatus.INTERNAL_SERVER_ERROR,
  message: ""
};

class ResponseManager {
  constructor() {}

  static get HTTP_STATUS() {
    return HttpStatus;
  }

  static getResponseHandler(res) {
    return {
      onSuccess: function(data, message, code) {
        ResponseManager.respondWithSuccess(res, code, data, message);
      },
      onError: function(errorName, errorCode, errorMessage, data) {
        ResponseManager.respondWithError(res, errorName, errorCode, errorMessage, data);
      }
    };
  }

  static generateHATEOASLink(link, method, rel) {
    return {
      link: link,
      method: method,
      rel: rel
    };
  }

  static respondWithSuccess(res, code = ResponseManager.HTTP_STATUS.OK, data = {}, message = "success", links = []) {
    let response = Object.assign({}, BasicResponse);
    response.success = true;
    response.message = message;
    response.data = data;
    response.links = links;
    response.status_code = code;
    // check if data has a "meta" and extra data key, remove it from data and add directly on the object
    if (data.meta && data.data) {
      // response with pagination meta
      response.data = data.data; // replace old data
      response.meta = data.meta;
    }

    res.status(code).json(response);
  }

  static respondWithError(
    res,
    errorName,
    errorCode = ResponseManager.HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message = "Unknown error",
    data = {}
  ) {
    let response = Object.assign({}, BasicResponse);
    response.success = false;
    response.name = errorName;
    response.message = message;
    response.status_code = errorCode;
    response.data = data;
    res.status(errorCode).json(response);
  }
}
export default ResponseManager;
