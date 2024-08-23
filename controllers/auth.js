const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../errors");

const register = async (req, res) => {
  try {
    const user = await User.create({ ...req.body });
    const token = user.createJWT();
    res.status(StatusCodes.CREATED).json({ user: { name: user.name ,token: token } });
  } catch (error) {
    console.error('Error creating user or generating token:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Error registering user' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new BadRequestError("Please provide email and password");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthenticatedError("Invalid Credentials");
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid Credentials");
  }

  // compare password

  const token = user.createJWT();
  res.status(StatusCodes.OK).json({ user: { name: user.name, token: token }});
};

module.exports = {
  register,
  login,
};
