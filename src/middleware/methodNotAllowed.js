import MethodNotAllowedHandler from "errors/methodNotAllowed";
export default function methodNotAllowedHandler(req, res, next) {
  throw new MethodNotAllowedHandler(
    `http method '${req.method}' for API endpoint (${
      req.originalUrl
    }) is not allowed.`
  );
}