FROM rust:1.31 as build

WORKDIR /src
COPY src/backend/ /src/
RUN cargo build --bin backend

FROM alpine:3.14

WORKDIR /app
COPY --from=build /src/target /app/backend/
COPY src/frontend /app/frontend

EXPOSE 8000

ENTRYPOINT /app/backend/backend.exe