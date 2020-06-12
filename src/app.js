import http from "http";
import express from "express";
import bodyParser from "body-parser";
import requestIP from "request-ip";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import {
  asValue,
  createContainer,
  Lifetime,
  InjectionMode,
  asClass
} from "awilix";
import { scopePerRequest } from "awilix-express";
import helmet from "helmet";
import Auth from "repositories/AuthRepository";
import { connectDB } from "config/db";
// import cors from "middleware/cors";
import cors from "cors";
import errors from "middleware/errors";
import error404 from "middleware/404";
//import application routes
import routes from "./routes";
// connect to db
let db = connectDB(10, true);
// db.then(db => {
//   console.log(db);
// });
//create app
let app = express();

// so we can get the client's IP address
// app.enable("trust proxy");

// set default timezone
// momentTimezone.tz.setDefault(process.env.DEFAULT_TIMEZONE);

// setup helmet
// Helmet includes a whopping 12 packages that all work to block malicious parties
// from breaking or using an application to hurt its users
app.use(helmet());

app.server = http.createServer(app);

// Parse application/json
app.use(
  bodyParser.json({
    limit: process.env.BODY_LIMIT
  })
);

app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// setup dependency injection
const container = createContainer({
  injectionMode: InjectionMode.PROXY
});
// load all repositories
container.loadModules(
  [
    [
      "repositories/*.js",
      {
        lifetime: Lifetime.SCOPED,
        register: asClass
      }
    ]
  ],
  {
    // we want `AuthRepository` to be registered as `authRepository`.
    formatName: "camelCase",
    resolverOptions: {},
    cwd: __dirname
  }
);
// load all models
container.loadModules(
  [
    [
      "models/*.js",
      {
        lifetime: Lifetime.SCOPED,
        register: asValue
      }
    ]
  ],
  {
    cwd: __dirname
  }
);

// initialize passport and jwt
app.use(new Auth(container.cradle).initialize());

// Middleware to create a scope per request.
app.use(scopePerRequest(container));

app.use((req, res, next) => {
  // We still want to register the user!
  // req.container is a scope!
  req.container.register({
    db: asValue(db),
    currentUser: asValue({}), // from auth middleware...
    ipAddress: asValue(requestIP.getClientIp(req)),
    roleIds: asValue({
      youverify: process.env.YOUVERIFY_VENDOR_SUPER_ADMIN_ROLE_ID,
      cac: process.env.CAC_VENDOR_SUPER_ADMIN_ROLE_ID,
      degree: process.env.DEGREE_VENDOR_SUPER_ADMIN_ROLE_ID
    })
  });
  next();
});

// log only 4xx and 5xx responses to console
app.use(
  morgan("dev", {
    skip: function(req, res) {
      return res.statusCode < 400;
    }
  })
);

// log all requests to access.log
app.use(
  morgan("combined", {
    stream: fs.createWriteStream(path.join(__dirname, "logs/access.log"), {
      flags: "a"
    })
  })
);

/**
 * Preflight Middleware
 */

// Enable CORS
app.use(
  cors({
    origin: (origin, cb) => {
      let allowed_origins = process.env.ALLOWED_ORIGINS;
      if (allowed_origins.trim() == "*") {
        cb(null, true);
      } else {
        let origins = allowed_origins.split(",");
        if (origins.indexOf(origin) != -1 || !origin) {
          cb(null, true);
        } else {
          cb(new Error(`Origin('${origin}') not allowed`, false));
        }
      }
    },
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  })
);
// console.log(process.env.ALLOWED_ORIGINS);
// Add headers
// app.use(function(req, res, next) {
//   // Website you wish to allow to connect
//   res.setHeader("Access-Control-Allow-Origin", "*");

//   // Request methods you wish to allow
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

//   // Request headers you wish to allow
//   res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

//   // Set to true if you need the website to include cookies in the requests sent
//   // to the API (e.g. in case you use sessions)
//   res.setHeader("Access-Control-Allow-Credentials", true);

//   // Pass to next layer of middleware
//   next();
// });
// remove some headers here - Nginx will set them
app.use(function(req, res, next) {
  res.removeHeader("Vary");
  res.removeHeader("Strict-Transport-Security");
  next();
});
// Mount API routes
app.use("/", routes);

/**
 * Postflight Middleware
 */
// handle 404's
app.use(error404);

// handle errors (404 is not technically an error)
app.use(errors);

// Dispose container when the server closes.
app.server.on("close", () => container.dispose());

export default app;
