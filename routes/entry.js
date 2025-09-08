const express = require("express");
const router = express.Router();
const entryController = require("../controller/entryController");

router.post("/newentry", entryController.newEntry);
router.get("/:id", entryController.getEntry);
router.get("/", entryController.getEntries);
router.put("/:id", entryController.editEntry);

module.exports = router;
