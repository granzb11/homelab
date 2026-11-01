.PHONY: build run test fmt vet psql

build:
	cd api && go build ./...

run:
	cd api && go run ./cmd/api

test:
	cd api && go test ./...

fmt:
	cd api && go fmt ./...

vet:
	cd api && go vet ./...

psql:
	psql meal_tracker_dev
