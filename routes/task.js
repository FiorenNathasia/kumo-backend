const express = require("express");
const router = express.Router();
const taskController = require("../controller/taskController");

router.post("/newtask", taskController.newTask);
router.get("/:id", taskController.getTask);
router.get("/", taskController.getAllTasks);
router.put("/:id", taskController.editTask);
router.delete("/:id", taskController.editTask);

module.exports = router;
