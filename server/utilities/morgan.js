const morgan = require("morgan");
const logger = require("./logger");

// Configures morgan to log requests using the defined winston logger
module.exports = () =>
  morgan("tiny", {
    stream: logger.stream,
    // Skip logging healthcheck reqeuests
    skip: req => req.originalUrl === "/.well-known/apollo/server-health",
  });
