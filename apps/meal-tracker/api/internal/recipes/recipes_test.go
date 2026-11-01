package recipes

import (
	"context"
	"errors"
	"testing"

	"mealtracker/api/internal/testutil"
)

func TestStore(t *testing.T) {
	pool := testutil.NewTestPool(t)
	store := NewStore(pool)
	ctx := context.Background()

	reset := func(t *testing.T) {
		t.Helper()
		if _, err := pool.Exec(ctx, "TRUNCATE recipes CASCADE"); err != nil {
			t.Fatalf("resetting table: %v", err)
		}
	}

	t.Run("Create and Get", func(t *testing.T) {
		reset(t)
		rec, err := store.Create(ctx, CreateInput{Title: "Carnitas Bowls", Cuisine: "mexican", Servings: 4})
		if err != nil {
			t.Fatalf("Create: %v", err)
		}
		if rec.ID == "" {
			t.Fatal("expected a generated id")
		}

		got, err := store.Get(ctx, rec.ID)
		if err != nil {
			t.Fatalf("Get: %v", err)
		}
		if got != rec {
			t.Fatalf("got %+v, want %+v", got, rec)
		}
	})

	t.Run("Get missing id returns ErrNotFound", func(t *testing.T) {
		reset(t)
		_, err := store.Get(ctx, "00000000-0000-0000-0000-000000000000")
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("got err %v, want ErrNotFound", err)
		}
	})

	t.Run("Create rejects invalid servings", func(t *testing.T) {
		reset(t)
		_, err := store.Create(ctx, CreateInput{Title: "Bad", Cuisine: "x", Servings: -1})
		if err == nil {
			t.Fatal("expected an error for servings <= 0, got nil")
		}
	})

	t.Run("List returns created recipes", func(t *testing.T) {
		reset(t)
		a, err := store.Create(ctx, CreateInput{Title: "A", Cuisine: "x", Servings: 2})
		if err != nil {
			t.Fatalf("Create A: %v", err)
		}
		b, err := store.Create(ctx, CreateInput{Title: "B", Cuisine: "y", Servings: 3})
		if err != nil {
			t.Fatalf("Create B: %v", err)
		}

		list, err := store.List(ctx)
		if err != nil {
			t.Fatalf("List: %v", err)
		}
		if len(list) != 2 {
			t.Fatalf("got %d recipes, want 2", len(list))
		}
		ids := map[string]bool{a.ID: true, b.ID: true}
		for _, rec := range list {
			if !ids[rec.ID] {
				t.Errorf("unexpected recipe in list: %+v", rec)
			}
		}
	})

	t.Run("Update existing recipe", func(t *testing.T) {
		reset(t)
		rec, err := store.Create(ctx, CreateInput{Title: "Original", Cuisine: "x", Servings: 2})
		if err != nil {
			t.Fatalf("Create: %v", err)
		}

		updated, err := store.Update(ctx, rec.ID, UpdateInput{Title: "Updated", Cuisine: "y", Servings: 5})
		if err != nil {
			t.Fatalf("Update: %v", err)
		}
		if updated.Title != "Updated" || updated.Cuisine != "y" || updated.Servings != 5 {
			t.Fatalf("got %+v, want updated fields", updated)
		}
	})

	t.Run("Update missing id returns ErrNotFound", func(t *testing.T) {
		reset(t)
		_, err := store.Update(ctx, "00000000-0000-0000-0000-000000000000", UpdateInput{Title: "x", Cuisine: "x", Servings: 1})
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("got err %v, want ErrNotFound", err)
		}
	})

	t.Run("Delete existing recipe", func(t *testing.T) {
		reset(t)
		rec, err := store.Create(ctx, CreateInput{Title: "ToDelete", Cuisine: "x", Servings: 2})
		if err != nil {
			t.Fatalf("Create: %v", err)
		}

		if err := store.Delete(ctx, rec.ID); err != nil {
			t.Fatalf("Delete: %v", err)
		}
		_, err = store.Get(ctx, rec.ID)
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected recipe to be gone, got err %v", err)
		}
	})

	t.Run("Delete missing id returns ErrNotFound", func(t *testing.T) {
		reset(t)
		err := store.Delete(ctx, "00000000-0000-0000-0000-000000000000")
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("got err %v, want ErrNotFound", err)
		}
	})

	t.Run("Cascade deletes ingredients with their recipe", func(t *testing.T) {
		reset(t)
		rec, err := store.Create(ctx, CreateInput{Title: "WithIngredients", Cuisine: "x", Servings: 2})
		if err != nil {
			t.Fatalf("Create: %v", err)
		}

		_, err = pool.Exec(ctx, "INSERT INTO recipe_ingredients (recipe_id, position, name) VALUES ($1, 1, 'salt')", rec.ID)
		if err != nil {
			t.Fatalf("inserting ingredient: %v", err)
		}

		if err := store.Delete(ctx, rec.ID); err != nil {
			t.Fatalf("Delete: %v", err)
		}

		var count int
		err = pool.QueryRow(ctx, "SELECT count(*) FROM recipe_ingredients WHERE recipe_id = $1", rec.ID).Scan(&count)
		if err != nil {
			t.Fatalf("counting ingredients: %v", err)
		}
		if count != 0 {
			t.Fatalf("got %d ingredients after cascade delete, want 0", count)
		}
	})
}
