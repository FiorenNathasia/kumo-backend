require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const authRouter = require("./routes/auth");
const verify = require("./middleware/verify");

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRouter);
app.use(verify);

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
