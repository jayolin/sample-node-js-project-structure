import config from "dotenv-extended";
// load environment variables - make sure this is always called as early as possible
config.load();
import mongoose from "mongoose";
import beautifyUnique from "mongoose-beautiful-unique-validation";
mongoose.Promise = global.Promise;
// initialize beautifyUnique on all schema
mongoose.plugin(beautifyUnique);
// required environment variables
["NODE_ENV", "PORT"].forEach(name => {
  if (!process.env[name]) {
    console.error(`Environment variable ${name} is missing`);
    process.exit(1);
  }
});

// console.log(process.env.NODE_ENV);
export const connectDB = (poolSize = 20, autoIndex = true) => {
  // let dbAddress = process.env.MONGO_HOST || "127.0.0.1";
  // let dbPort = process.env.MONGO_PORT || 27017;
  let dbName;
  let connectionString;
  switch (process.env.NODE_ENV) {
    case "test":
      mongoose.set("debug", true);
      dbName = process.env.MONGO_TEST_DATABASE;
      connectionString = `mongodb://localhost:27017,localhost:27018,localhost:27019?replicaSet=rs`;
      break;
    case "production":
      dbName = process.env.MONGO_DATABASE;
      connectionString = `mongodb+srv://${encodeURIComponent(
        process.env.MONGO_USER
      )}:${encodeURIComponent(process.env.MONGO_PASS)}@${
        process.env.MONGO_HOST
      }/test?retryWrites=true&w=majority`;
      break;
    case "staging":
      dbName = process.env.MONGO_DATABASE;
      connectionString = `mongodb+srv://${encodeURIComponent(
        process.env.MONGO_USER
      )}:${encodeURIComponent(process.env.MONGO_PASS)}@${
        process.env.MONGO_HOST
      }/test?retryWrites=true&w=majority`;
      break;
    default:
      dbName = process.env.MONGO_DATABASE;
      mongoose.set("debug", true);
      connectionString = `mongodb://localhost:27017,localhost:27018,localhost:27019?replicaSet=rs`;
  }

  let options = {
    // useMongoClient: true,
    poolSize, // Maintain up to 20(default if not specified) socket connections,
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    autoIndex,
    ssl: ["staging", "production"].indexOf(process.env.NODE_ENV) !== -1,
    // autoReconnect: true,
    dbName,
    useUnifiedTopology: true
  };

  if (
    process.env.MONGO_DB_AUTH === "true" &&
    ["staging", "production"].indexOf(process.env.NODE_ENV) !== -1
  ) {
    options["user"] = encodeURIComponent(process.env.MONGO_USER);
    options["pass"] = encodeURIComponent(process.env.MONGO_PASS);
  }

  let db = mongoose.connect(connectionString, options).catch(err => {
    if (err.message.indexOf("ECONNREFUSED") !== -1) {
      console.error(
        "Error: The server was not able to reach MongoDB. Maybe it's not running?"
      );
      process.exit(1);
    } else {
      throw err;
    }
  });
  db.then(() => {
    console.log("MongoDB Connected");
  }).catch(error => {
    console.error({ error });
  });

  return db;
};
