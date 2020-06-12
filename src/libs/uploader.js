import AWS from "aws-sdk";
import multer from "multer";
import multerS3 from "multer-s3-transform";
const sharp = require("sharp");
import mongoose from "mongoose";
import InvalidPayloadError from "errors/invalidPayload";
const spacesEndpoint = new AWS.Endpoint(process.env.AWS_ENDPOINT);
const s3Config = new AWS.S3({
  accessKeyId: process.env.AWS_IAM_USER_KEY,
  secretAccessKey: process.env.AWS_IAM_USER_SECRET,
  Bucket: process.env.AWS_BUCKET_NAME,
  endpoint: spacesEndpoint
});

const fileFilter = (fileType = "image") => (req, file, cb) => {
  switch (fileType) {
    case "image":
      if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        cb(null, true);
      } else {
        cb(new InvalidPayloadError("Only images are allowed"));
      }
      break;
    case "csv":
      if (file.mimetype === "text/csv") {
        cb(null, true);
      } else {
        cb(new InvalidPayloadError("Only CSVs are allowed"));
      }
      break;
    case "pdf":
      if (file.mimetype === "application/pdf") {
        cb(null, true);
      } else {
        cb(new InvalidPayloadError("Only PDFs are allowed"));
      }
      break;
    default:
      cb(new InvalidPayloadError("Unknown file Type"));
      break;
  }
};

const getFilePath = (folderPath, mimetype, name) => {
  let extension = ".jpg";
  switch (mimetype) {
    case "image/jpeg":
      extension = ".jpg";
      break;
    case "image/png":
      extension = ".png";
      break;
    case "application/pdf":
      extension = ".pdf";
      break;
    case "text/csv":
      extension = ".csv";
      break;
    default:
      extension = "";
      break;
  }

  let filename =
    +new Date() +
    "-" +
    mongoose.Types.ObjectId() +
    (name ? "-" + name : name) +
    extension;
  let path = !folderPath ? filename : folderPath + "/" + filename;
  return path;
};

const transformImage = () => {
  return sharp()
    .metadata()
    .then(metadata => {
      console.log(metadata.width);
      return sharp().resize(480);
    });
};

const multerS3Config = (folderPath = null, name = "") =>
  multerS3({
    s3: s3Config,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    cacheControl: "max-age=31536000", // cache for one year
    key: function(req, file, cb) {
      let path = getFilePath(folderPath, file.mimetype, name);
      cb(null, path);
    },
    shouldTransform: function(req, file, cb) {
      cb(null, /^image/i.test(file.mimetype));
    },
    transforms: [
      {
        id: "original",
        key: function(req, file, cb) {
          cb(null, getFilePath(folderPath, file.mimetype));
        },
        transform: function(req, file, cb) {
          cb(null, sharp());
        }
      },
      {
        id: "resized",
        key: function(req, file, cb) {
          cb(null, getFilePath(folderPath, file.mimetype));
        },
        transform: function(req, file, cb) {
          cb(null, sharp().jpeg({ quality: 60 }));
        }
      }
    ]
  });

const uploader = ({ fileType, folderPath, name }) => {
  return multer({
    storage: multerS3Config(folderPath, name),
    fileFilter: fileFilter(fileType),
    limits: {
      fileSize: fileType === "image" ? 1024 * 1024 * 15 : 1024 * 1024 * 15 // we are allowing only 1 MB files
    }
  });
};

export default uploader;
