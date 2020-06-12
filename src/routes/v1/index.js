import express from "express";
let router = express.Router();
// import other routes
import sampleRoute from "./sampleRoute";

// mount routes
router.use("/", sampleRoute);

module.exports = router;
