const express = require("express");
const router = express.Router();
const journalController = require("../controller/journalController");

router.post("/newjournal", journalController.newJournal);

module.exports = router;
