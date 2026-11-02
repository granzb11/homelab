package http

import (
	"context"
	"fmt"

	"mealtracker/api/internal/recipes"
)

// fakeRecipeStore is an in-memory RecipeStore for unit-testing handlers
// without a real database. Not safe for concurrent use - fine for tests.
// Set forceErr to make every method fail with a generic (non-ErrNotFound)
// error, to exercise handlers' 500 branches.
type fakeRecipeStore struct {
	byID     map[string]recipes.Recipe
	nextID   int
	forceErr error
}

func newFakeRecipeStore() *fakeRecipeStore {
	return &fakeRecipeStore{byID: map[string]recipes.Recipe{}}
}

func (f *fakeRecipeStore) List(ctx context.Context) ([]recipes.Recipe, error) {
	if f.forceErr != nil {
		return nil, f.forceErr
	}
	var list []recipes.Recipe
	for _, rec := range f.byID {
		list = append(list, rec)
	}
	return list, nil
}

func (f *fakeRecipeStore) Create(ctx context.Context, in recipes.CreateInput) (recipes.Recipe, error) {
	if f.forceErr != nil {
		return recipes.Recipe{}, f.forceErr
	}
	f.nextID++
	rec := recipes.Recipe{
		ID:       fmt.Sprintf("fake-id-%d", f.nextID),
		Title:    in.Title,
		Cuisine:  in.Cuisine,
		Servings: in.Servings,
	}
	f.byID[rec.ID] = rec
	return rec, nil
}

func (f *fakeRecipeStore) Get(ctx context.Context, id string) (recipes.Recipe, error) {
	rec, ok := f.byID[id]
	if !ok {
		return recipes.Recipe{}, recipes.ErrNotFound
	}
	return rec, nil
}

func (f *fakeRecipeStore) Update(ctx context.Context, id string, in recipes.UpdateInput) (recipes.Recipe, error) {
	if f.forceErr != nil {
		return recipes.Recipe{}, f.forceErr
	}
	if _, ok := f.byID[id]; !ok {
		return recipes.Recipe{}, recipes.ErrNotFound
	}
	rec := recipes.Recipe{ID: id, Title: in.Title, Cuisine: in.Cuisine, Servings: in.Servings}
	f.byID[id] = rec
	return rec, nil
}

func (f *fakeRecipeStore) Delete(ctx context.Context, id string) error {
	if f.forceErr != nil {
		return f.forceErr
	}
	if _, ok := f.byID[id]; !ok {
		return recipes.ErrNotFound
	}
	delete(f.byID, id)
	return nil
}
