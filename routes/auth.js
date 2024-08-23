const express = require("express");
const router = express.Router();

const { login, register, updateUser } = require("../controllers/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/updateUser", updateUser);

module.exports = router;
