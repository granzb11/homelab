// Package testutil provides test helpers shared across internal packages.
package testutil

import (
	"context"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
)

// NewTestPool starts a throwaway Postgres container, loads schema.sql into
// it, and returns a connection pool. The container and pool are torn down
// automatically when the test finishes.
func NewTestPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	ctx := context.Background()

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
