import ResponseManager from "manager/response";
import HttpStatus from "http-status-codes";
// Error middleware handler
export default (err, req, res, next) => {
  //
  // if (process.env.NODE_ENV === "development") {

  // }
  console.log("\n\n\nSTART OF ERROR(S) \n\n\n");
  console.log(err);
  console.log("\n\n\nEND OF ERROR(S) \n\n\n");
  switch (err.name || err.error.name) {
    case "BadRequestError":
      ResponseManager.getResponseHandler(res).onError(err.name, err.status, err.message, err.data);
      break;
    case "UnauthorizedError":
      ResponseManager.getResponseHandler(res).onError(err.name, err.status, err.message, err.data);
      break;
    case "ForbiddenError":
      ResponseManager.getResponseHandler(res).onError(err.name, err.status, err.message, err.data);
      break;
    case "ResourceNotFoundError":
      ResponseManager.getResponseHandler(res).onError(err.name, err.status, err.message, err.data);
      break;
    case "UnprocessableEntityError":
      ResponseManager.getResponseHandler(res).onError(err.name, err.status, err.message, err.data);
      break;
    case "ConflictError":
      ResponseManager.getResponseHandler(res).onError(err.name, err.status, err.message, err.data);
      break;
    case "ValidationError":
      ResponseManager.getResponseHandler(res).onError(
        err.name || err.error.name,
        HttpStatus.BAD_REQUEST,
        err.message || err.error.toString(),
        err.errors || err.error.details
      );

      break;
    case "MethodNotAllowedError":
      ResponseManager.getResponseHandler(res).onError(err.name, err.status, err.message, err.data);
      break;
    default:
      ResponseManager.getResponseHandler(res).onError(
        err.name || "InternalServerError",
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
        err.message || "Something bad happened!",
        err.data || {}
      );
  }
};
