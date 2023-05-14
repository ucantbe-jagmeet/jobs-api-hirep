require("dotenv").config();
require("express-async-errors");
//extra security packages

const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");

const express = require("express");
const app = express();

// connect db
const connectDB = require("./db/connect");
const authenticateUser = require("./middleware/authentication");

// routers
const authRouter = require("./routes/auth");
const jobsRouter = require("./routes/jobs");

// error handler
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

// extra packages
// helmet -> it set various headers to prevent numerous possible attacks
// cors -> (cross origin resource sharing) it is mechanism to allow or restrict requested resources on a web server depending on where the request was initiated
// xss-clear -> it sanitized the user input in that req.body , req.body, req.params ans protects us from cross side scripting attacks where the attacker tries to inject some malicious code
// express-rate-limit -> amount of request user can make

app.set("trust proxy", 1);

app.use(
  rateLimiter({
    windowsMs: 15 * 60 * 1000,
    max: 100,
  })
);
app.use(express.json());

app.use(helmet());
app.use(cors());
app.use(xss());

// routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/jobs", authenticateUser, jobsRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
