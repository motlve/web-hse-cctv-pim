# ==========================
# BUILD STAGE
# ==========================

FROM golang:1.25 AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN go build -o cctv-api .


# ==========================
# RUN STAGE
# ==========================

FROM debian:bookworm-slim

WORKDIR /app

# Install SSL certificate
RUN apt-get update && \
    apt-get install -y ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/cctv-api .

EXPOSE 8081

CMD ["./cctv-api"]