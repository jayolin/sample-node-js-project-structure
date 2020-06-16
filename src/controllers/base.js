/* eslint-disable no-unused-vars */
import BaseAutoBindedClass from "base/autoBind";
import NotImplementedError from "errors/notImplemented";
import ResponseManager from "manager/response";

class BaseController extends BaseAutoBindedClass {
  constructor() {
    super();
    if (new.target === BaseController) {
      throw new TypeError("Cannot construct BaseController instances directly");
    }
    this.responseManager = ResponseManager;
  }

  getAll(req, res) {
    throw new NotImplementedError();
  }

  getOne(req, res) {
    throw new NotImplementedError();
  }

  create(req, res) {
    throw new NotImplementedError();
  }

  createMany(req, res) {
    throw new NotImplementedError();
  }

  update(req, res) {
    throw new NotImplementedError();
  }

  updateMany(req, res) {
    throw new NotImplementedError();
  }

  remove(req, res) {
    throw new NotImplementedError();
  }

  removeMany(req, res) {
    throw new NotImplementedError();
  }

  authenticate(req, res) {
    throw new NotImplementedError();
  }
}
export default BaseController;
