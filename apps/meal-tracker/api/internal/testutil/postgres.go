//go:build integration

// Package testutil provides test helpers for the integration test tier.
package testutil

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
)

// NewTestPool returns a connection pool with schema.sql applied, torn down
// automatically when the test finishes.
//
// If TEST_DATABASE_URL is set (a CI job that already provisioned a dev
// database), it connects there directly - no Docker needed. Otherwise it
// starts a throwaway local Postgres container, for running `go test
// -tags=integration ./...` on a dev machine with no other setup.
func NewTestPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	ctx := context.Background()

	if url := os.Getenv("TEST_DATABASE_URL"); url != "" {
		return connectToProvisionedDB(t, ctx, url)
	}
	return startLocalContainer(t, ctx)
}

func connectToProvisionedDB(t *testing.T, ctx context.Context, url string) *pgxpool.Pool {
	t.Helper()

	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		t.Fatalf("connecting to %s: %v", url, err)
	}
	t.Cleanup(pool.Close)

	schema, err := os.ReadFile(schemaSQLPath())
	if err != nil {
		t.Fatalf("reading schema.sql: %v", err)
	}
	if _, err := pool.Exec(ctx, string(schema)); err != nil {
		t.Fatalf("applying schema.sql: %v", err)
	}

	return pool
}

func startLocalContainer(t *testing.T, ctx context.Context) *pgxpool.Pool {
	t.Helper()

	container, err := postgres.Run(ctx, "postgres:16-alpine",
		postgres.WithDatabase("meal_tracker_test"),
		postgres.WithUsername("test"),
		postgres.WithPassword("test"),
		postgres.WithInitScripts(schemaSQLPath()),
		postgres.BasicWaitStrategies(),
	)
	if err != nil {
		t.Fatalf("starting postgres container: %v", err)
	}
	t.Cleanup(func() {
		if err := container.Terminate(ctx); err != nil {
			t.Logf("terminating postgres container: %v", err)
		}
	})

	connString, err := container.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		t.Fatalf("getting connection string: %v", err)
	}

	pool, err := pgxpool.New(ctx, connString)
	if err != nil {
		t.Fatalf("connecting to test postgres: %v", err)
	}
	t.Cleanup(pool.Close)

	return pool
}

// schemaSQLPath finds api/schema.sql relative to this source file, so it
// resolves correctly no matter which package's test is running.
func schemaSQLPath() string {
	_, thisFile, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(thisFile), "..", "..", "schema.sql")
}
