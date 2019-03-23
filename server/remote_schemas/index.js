const { initialize: initializeAccountsSchema } = require("./accounts_service");

const initializeRemoteSchemas = () => {
  return Promise.all([
    initializeAccountsSchema(),
  ]).then(remoteSchemas => remoteSchemas.filter(schema => schema));
};

module.exports = { initializeRemoteSchemas };
