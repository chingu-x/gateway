const { readFileSync } = require("fs");
const { join } = require("path");
const { importSchema } = require("graphql-import");
const https = require("https");
const express = require("express");
const cors = require("cors");
const { makeExecutableSchema, mergeSchemas } = require("graphql-tools");
const { ApolloServer } = require("apollo-server-express");

const logger = require("./utilities/logger");
const morgan = require("./utilities/morgan");
const resolvers = require("./resolvers");
const { initializeRemoteSchemas } = require("./remote_schemas");
const typeDefs = importSchema(join(__dirname, "schema.graphql"));

const { NODE_PORT = 3000, DISABLE_HTTPS = true } = process.env;

/**
 * Starts the server
 */
async function start() {
  logger.info("Initializing express server");
  const app = express();
  app.use(morgan());

  const corsOptions = {
    origin: [
      /^https\:\/\/(?:.*\.)?tibu\.nu$/,
      /^http\:\/\/localhost\:[0-9]{4}$/,
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  };
  app.use(cors(corsOptions));

  logger.info("Initializing base schema");
  const baseSchema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  logger.info("Initializing remote schemas");
  const remoteSchemas = await initializeRemoteSchemas();

  logger.info("Merging schemas");
  const schema = mergeSchemas({
    schemas: [baseSchema, ...remoteSchemas],
  });

  logger.info("Initializing apollo server");
  const server = new ApolloServer({
    schema,
    introspection: true,
    playground: true,
    context: async ({ req }) => ({
      token: req.headers.authorization.split(' ')[1],
      logger,
    }),
    formatError: error => {
      logger.info(JSON.stringify(error));
      delete error.extensions.exception;
      return error;
    },
    // Exposed on /.well-known/apollo/server-health
    onHealthCheck: () =>
      new Promise((resolve, reject) => {
        // TODO: Add better health checks.
        resolve();
      }),
  });
  server.applyMiddleware({ app, path: "/graphql" });

  if (!DISABLE_HTTPS) {
    const sslOptions = {
      key: readFileSync("/path/to/ssl.key"),
      cert: readFileSync("/path/to/ssl.crt"),
    };

    https.createServer(sslOptions, app).listen(NODE_PORT, () => {
      logger.info(`HTTPS server up and running on port ${NODE_PORT}`);
    });
  } else {
    app.listen(NODE_PORT, () => {
      logger.info(`Server up and running on port ${NODE_PORT}`);
    });
  }
}

start();
