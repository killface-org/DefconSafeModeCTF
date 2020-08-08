FROM node:12-alpine
RUN apk add --no-cache chromium
ADD package.json /app/
ADD package-lock.json /app/
WORKDIR /app
RUN npm ci --only=production
ADD . /app
CMD [ "node", "startAgents.js" ]