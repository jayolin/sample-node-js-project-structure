import BaseController from "controllers/base";
import HTTP_STATUS from "http-status-codes";
import moment from "moment";

class SampleController extends BaseController {
  constructor({ sampleRepository, }) {
    super();
    this.sampleRespository = sampleRespository;
  }

  async sampleControllerMethod(req, res) {
    let data = await this.sampleRespository.repositoryMethod();
    // send response
    this.responseManager
      .getResponseHandler(res)
      .onSuccess(
        data,
        "Success Message!",
        HTTP_STATUS.OK
      );
  }
}

export default SampleController;
