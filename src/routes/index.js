import express from "express";
import routerV1 from "routes/v1";
import MethodNotAllowedHandler from "middleware/methodNotAllowed";

let router = express.Router();
router
  .route("/")
  .get((req, res) => {
    res.status(200).send(`
        ---------------------------------


        Bare Node js project setup API v1 - 
        
        
        ----------------------------------
        `);
  })
  .all(MethodNotAllowedHandler);
// Mount V1 routes
router.use("/v1", routerV1);

module.exports = router;
