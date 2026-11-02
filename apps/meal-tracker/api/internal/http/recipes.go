package http

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"mealtracker/api/internal/recipes"
)

// RecipeStore is what RecipeHandlers needs from a recipe backend. It's
// defined here (the consumer), not in internal/recipes, so unit tests can
// swap in a fake instead of a real database. *recipes.Store satisfies this
// implicitly.
type RecipeStore interface {
	List(ctx context.Context) ([]recipes.Recipe, error)
	Create(ctx context.Context, in recipes.CreateInput) (recipes.Recipe, error)
	Get(ctx context.Context, id string) (recipes.Recipe, error)
	Update(ctx context.Context, id string, in recipes.UpdateInput) (recipes.Recipe, error)
	Delete(ctx context.Context, id string) error
}

// RecipeHandlers adapts HTTP requests to a RecipeStore. It owns no
// business logic itself - just request decoding, status codes, and
// response encoding.
type RecipeHandlers struct {
	Recipes RecipeStore
}

func (h *RecipeHandlers) List(w http.ResponseWriter, r *http.Request) {
	list, err := h.Recipes.List(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

func (h *RecipeHandlers) Create(w http.ResponseWriter, r *http.Request) {
	var input recipes.CreateInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	rec, err := h.Recipes.Create(r.Context(), input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(rec)
}

func (h *RecipeHandlers) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	rec, err := h.Recipes.Get(r.Context(), id)
	if err != nil {
		writeStoreError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rec)
}

func (h *RecipeHandlers) Update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var input recipes.UpdateInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	rec, err := h.Recipes.Update(r.Context(), id, input)
	if err != nil {
		writeStoreError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(rec)
}

func (h *RecipeHandlers) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	if err := h.Recipes.Delete(r.Context(), id); err != nil {
		writeStoreError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// writeStoreError maps a recipes.Store error to the right HTTP status:
// ErrNotFound becomes 404, anything else is a 500.
func writeStoreError(w http.ResponseWriter, err error) {
	if errors.Is(err, recipes.ErrNotFound) {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	http.Error(w, err.Error(), http.StatusInternalServerError)
}
