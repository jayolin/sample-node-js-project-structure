import AWS from "aws-sdk";
import fs from "fs";
import mongoose from "mongoose";

/**
 *
 * @param {String} filePath path of the file
 * @returns {String}  URI of uploaded file
 */
export default ({ filePath, base64String }) => {
  const getFilename = filePath => {
    return filePath
      .split("\\")
      .pop()
      .split("/")
      .pop();
  };

  const getS3Path = filePath => {
    if (!filePath) return "";
    let filename = getFilename(filePath);
    let extension = filename.split(".").pop();
    let folder;
    switch (extension) {
      case "csv":
        folder = "csv/";
        break;
      case "pdf":
        folder = "pdf/";
        break;
      case "jpg":
        folder = "images/";
        break;
      case "jpeg":
        folder = "images/";
        break;
      case "png":
        folder = "images/";
        break;
      default:
        throw new Error("Invalid file passed");
        break;
    }
    let path = folder + filename;
    return path;
  };

  return new Promise((resolve, reject) => {
    try {
      let body;
      // Configure client for use with Spaces
      const spacesEndpoint = new AWS.Endpoint(process.env.AWS_ENDPOINT);
      const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_IAM_USER_KEY,
        secretAccessKey: process.env.AWS_IAM_USER_SECRET,
        Bucket: process.env.AWS_BUCKET_NAME,
        endpoint: spacesEndpoint
      });

      if (base64String) {
        body = new Buffer.from(
          base64String.replace(/^data:image\/\w+;base64,/, ""),
          "base64"
        );
      }

      if (filePath) {
        body = fs.createReadStream(filePath);
      }

      let params = {
        ACL: "public-read",
        CacheControl: "max-age=31536000", // cache for one year
        Body: body,
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: getS3Path(filePath)
      };

      if (base64String) {
        let _filename = +new Date() + "-" + mongoose.Types.ObjectId() + ".jpg";
        params = Object.assign({}, params, {
          ContentEncoding: "base64",
          ContentType: "image/jpeg",
          ContentDisposition: `attachment; filename=${_filename}`,
          Key: "biometric-data/" + _filename
        });
      }

      if (filePath) {
        params = Object.assign({}, params, {
          ContentDisposition: `attachment; filename=${getFilename(filePath)}`
        });
      }

      s3.upload(params, function(err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data.Location || data.location);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};
