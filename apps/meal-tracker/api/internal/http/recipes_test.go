package http

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"mealtracker/api/internal/recipes"
	"mealtracker/api/internal/testutil"
)

func newTestMux(t *testing.T) *http.ServeMux {
	t.Helper()
	pool := testutil.NewTestPool(t)
	h := &RecipeHandlers{Recipes: recipes.NewStore(pool)}

	mux := http.NewServeMux()
	mux.HandleFunc("/recipes", h.List)
	mux.HandleFunc("POST /recipes", h.Create)
	mux.HandleFunc("GET /recipes/{id}", h.Get)
	mux.HandleFunc("PUT /recipes/{id}", h.Update)
	mux.HandleFunc("DELETE /recipes/{id}", h.Delete)
	return mux
}

func TestRecipeHandlers(t *testing.T) {
	mux := newTestMux(t)

	t.Run("Create then Get", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/recipes", bytes.NewBufferString(
			`{"title":"Carnitas Bowls","cuisine":"mexican","servings":4}`))
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusCreated {
			t.Fatalf("Create: got status %d, body %s", rec.Code, rec.Body.String())
		}

		var created recipes.Recipe
		if err := json.Unmarshal(rec.Body.Bytes(), &created); err != nil {
			t.Fatalf("decoding create response: %v", err)
		}
		if created.ID == "" {
			t.Fatal("expected a generated id")
		}

		getReq := httptest.NewRequest(http.MethodGet, "/recipes/"+created.ID, nil)
		getRec := httptest.NewRecorder()
		mux.ServeHTTP(getRec, getReq)

		if getRec.Code != http.StatusOK {
			t.Fatalf("Get: got status %d, body %s", getRec.Code, getRec.Body.String())
		}
	})

	t.Run("Get missing id returns 404", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/recipes/00000000-0000-0000-0000-000000000000", nil)
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusNotFound {
			t.Fatalf("got status %d, want 404", rec.Code)
		}
	})

	t.Run("Create with invalid JSON returns 400", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/recipes", bytes.NewBufferString("not json"))
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("got status %d, want 400", rec.Code)
		}
	})

	t.Run("Delete then Get returns 404", func(t *testing.T) {
		createReq := httptest.NewRequest(http.MethodPost, "/recipes", bytes.NewBufferString(
			`{"title":"ToDelete","cuisine":"x","servings":1}`))
		createRec := httptest.NewRecorder()
		mux.ServeHTTP(createRec, createReq)

		var created recipes.Recipe
		if err := json.Unmarshal(createRec.Body.Bytes(), &created); err != nil {
			t.Fatalf("decoding create response: %v", err)
		}

		delReq := httptest.NewRequest(http.MethodDelete, "/recipes/"+created.ID, nil)
		delRec := httptest.NewRecorder()
		mux.ServeHTTP(delRec, delReq)
		if delRec.Code != http.StatusNoContent {
			t.Fatalf("Delete: got status %d", delRec.Code)
		}

		getReq := httptest.NewRequest(http.MethodGet, "/recipes/"+created.ID, nil)
		getRec := httptest.NewRecorder()
		mux.ServeHTTP(getRec, getReq)
		if getRec.Code != http.StatusNotFound {
			t.Fatalf("Get after delete: got status %d, want 404", getRec.Code)
		}
	})
}
