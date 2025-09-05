const express = require("express");
const router = express.Router();
const authorizationController = require("../controller/authorizationController");

router.post("/login", authorizationController.login);
router.post("/signup", authorizationController.signup);

module.exports = router;
