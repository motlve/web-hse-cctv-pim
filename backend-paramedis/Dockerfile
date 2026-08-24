# =========================
# BUILD STAGE
# =========================
FROM golang:1.25-bookworm AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -o paramedis-api .


# =========================
# RUNTIME STAGE
# =========================
FROM debian:bookworm-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/paramedis-api .

EXPOSE 8083

CMD ["./paramedis-api"]