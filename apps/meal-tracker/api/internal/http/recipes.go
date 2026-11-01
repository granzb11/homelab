package http

import (
	"encoding/json"
	"errors"
	"net/http"

	"mealtracker/api/internal/recipes"
)

// RecipeHandlers adapts HTTP requests to a recipes.Store. It owns no
// business logic itself - just request decoding, status codes, and
// response encoding.
type RecipeHandlers struct {
	Recipes *recipes.Store
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
