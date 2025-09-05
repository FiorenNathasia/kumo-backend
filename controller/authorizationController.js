const db = require("../db/db");
const bcrypt = require("bcrypt");
const generateAccessToken = require("../util/token");

const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const hashedpassword = await bcrypt.hash(password, 10);
    const user = await db("users").where("email", email).first();
    const newUser = await db("users")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: hashedpassword,
      })
      .returning("*");

    const accessToken = generateAccessToken(newUser[0]);

    return res.status(201).send({
      data: {
        firstName: newUser[0].first_name,
        lastName: newUser[0].last_name,
        email: newUser[0].email,
        accessToken,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db("users").where("email", email).first();
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    const accessToken = generateAccessToken(user);
    res.status(200).send({
      message: "You are succesfully logged in!",
      data: {
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        accessToken,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

module.exports = {
  login,
  signup,
};
