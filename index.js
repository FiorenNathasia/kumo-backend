require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const authRouter = require("./routes/auth");
const entryRouter = require("./routes/entry");
const taskRouter = require("./routes/task");
recommedationRouter = require("./routes/recommendation");
const verify = require("./middleware/verify");

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRouter);
app.use(verify);

app.use("/api/entry", entryRouter);
app.use("/api/task", taskRouter);
app.use("/api/recommendation", recommedationRouter);

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
