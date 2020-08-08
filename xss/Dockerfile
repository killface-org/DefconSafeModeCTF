FROM node:12-alpine
# You need this to compile the sqlite3 moduels for NodeJS when building images for the RaspberryPi (armv7).
RUN apk add --no-cache make gcc g++ python
ADD package.json /app/
ADD package-lock.json /app/
WORKDIR /app
RUN npm ci --only=production
ADD . /app
CMD [ "node", "server.js" ]