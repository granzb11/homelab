.PHONY: build run test test-unit test-integration fmt vet psql

build:
	cd api && go build ./...

run:
	cd api && go run ./cmd/api

# Fast tier: no database, no Docker. Safe to run on every commit.
test-unit:
	cd api && go test ./...

# Slow tier: real Postgres, either a local testcontainer (nothing to set up)
# or TEST_DATABASE_URL pointing at a CI-provisioned dev database.
test-integration:
	cd api && go test -tags=integration ./...

test: test-unit test-integration

fmt:
	cd api && go fmt ./...

vet:
	cd api && go vet ./...

psql:
	psql meal_tracker_dev
