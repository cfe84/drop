FROM node:14-alpine as nodebuild
WORKDIR /app
COPY backend/package.json .
COPY backend/package-lock.json .
RUN npm install 
COPY backend/src/ ./src/
COPY backend/tsconfig.json .
RUN npm run build

FROM node:14-alpine as noderun
WORKDIR /app
COPY --from=nodebuild /app/dist/ ./
COPY backend/package*.json ./
COPY frontend/ /app/static/
COPY migrate.js ./
RUN npm install --only=prod
EXPOSE 8080
ENV port=8080
ENV PORT=8080
ENV STATIC_CONTENT=/app/static
ENTRYPOINT node index.js
