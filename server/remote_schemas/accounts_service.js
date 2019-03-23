const fetch = require("node-fetch");
const { HttpLink } = require("apollo-link-http");
const { setContext } = require("apollo-link-context");
const { onError } = require("apollo-link-error");
const {
  makeRemoteExecutableSchema,
  introspectSchema,
} = require("graphql-tools");
const logger = require("../utilities/logger");

const http = new HttpLink({ uri: "http://accounts-service/graphql", fetch });

const context = setContext((_, previousContext) => ({
  headers: {
    Authorization: previousContext.graphqlContext.token,
  },
})).concat(http);

const link = onError(({ response, graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    response.errors = graphQLErrors.map(({ message, locations, path }) => ({
      message,
      locations,
      path,
    }));
  }

  if (networkError) {
    logger.error(networkError);
  }
}).concat(context);

const initialize = async () => {
  let schema;
  try {
    schema = await introspectSchema(http);
  } catch (err) {
    logger.error(err);
  }

  return schema ? makeRemoteExecutableSchema({ schema, link }) : null;
};

module.exports = { initialize };
