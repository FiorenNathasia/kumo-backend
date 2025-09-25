const express = require("express");
const router = express.Router();
const recommendationController = require("../controller/recommendationController");

router.get("/:id", recommendationController.getRecommendation);
router.get("/", recommendationController.getAllRecommendation);

module.exports = router;
