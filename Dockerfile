FROM node:10-slim

# Create app directory
WORKDIR /app

# Set the environment
EXPOSE 3000

# Install dependencies for bcrypt
RUN apt-get update \
  && apt-get install -y build-essential \
  && apt-get install -y python

# Install app dependencies
COPY package.json yarn.lock ./
RUN yarn --pure-lockfile

# Bundle app source
COPY server server

CMD ["yarn", "start"]