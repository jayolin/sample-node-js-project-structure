import express from "express";
import passport from "passport";
import { makeInvoker } from "awilix-express";
import validator from "express-joi-validation";
import MethodNotAllowedHandler from "middleware/methodNotAllowed";
import catchErrors from "errors/catchErrors";
import SampleController from "controllers/SampleController";
import { SampleSchema } from "../../validations/sample.validation.schema";

let validate = validator({
  passError: true // NOTE: this tells the module to pass the error along for you
});
const api = makeInvoker(SampleController);
let router = express.Router();


router
  .route("/")
  .get(

    /**
    * Sample passport implementation
     * The type can always be changed from jwt, depending on your implementation
    */
    passport.authenticate("jwt", {
      session: false,
      failWithError: true
    }),

    //joi validation
    validate.body(SampleSchema),

    //your other middlewares here
    catchErrors(api("sampleControllerMethod"))
  )
  .all(MethodNotAllowedHandler);

module.exports = router;
