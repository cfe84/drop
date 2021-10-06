FROM node:14-alpine as nodebuild
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install 
COPY src/ ./src/
COPY tsconfig.json .
RUN npm run build

FROM node:14-alpine as noderun
WORKDIR /app
COPY --from=nodebuild /app/dist/ ./
COPY package*.json ./
RUN npm install --only=prod
EXPOSE 8080
ENV port=8080
ENV PORT=8080
ENTRYPOINT node index.js