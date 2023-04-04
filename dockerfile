
FROM node:18.15.0-alpine

# Install app dependencies.
COPY package.json /src/package.json
WORKDIR /src
RUN yarn

# Bundle app source.
COPY index.js /src

CMD ["node", "index"]