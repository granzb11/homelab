package http

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"mealtracker/api/internal/recipes"
)

func newTestMux(t *testing.T) *http.ServeMux {
	t.Helper()
	h := &RecipeHandlers{Recipes: newFakeRecipeStore()}

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

	t.Run("List returns created recipes", func(t *testing.T) {
		createReq := httptest.NewRequest(http.MethodPost, "/recipes", bytes.NewBufferString(
			`{"title":"ListMe","cuisine":"x","servings":2}`))
		createRec := httptest.NewRecorder()
		mux.ServeHTTP(createRec, createReq)

		listReq := httptest.NewRequest(http.MethodGet, "/recipes", nil)
		listRec := httptest.NewRecorder()
		mux.ServeHTTP(listRec, listReq)

		if listRec.Code != http.StatusOK {
			t.Fatalf("List: got status %d, body %s", listRec.Code, listRec.Body.String())
		}
		var list []recipes.Recipe
		if err := json.Unmarshal(listRec.Body.Bytes(), &list); err != nil {
			t.Fatalf("decoding list response: %v", err)
		}
		if len(list) == 0 {
			t.Fatal("expected at least one recipe in the list")
		}
	})

	t.Run("Update existing recipe", func(t *testing.T) {
		createReq := httptest.NewRequest(http.MethodPost, "/recipes", bytes.NewBufferString(
			`{"title":"Original","cuisine":"x","servings":2}`))
		createRec := httptest.NewRecorder()
		mux.ServeHTTP(createRec, createReq)

		var created recipes.Recipe
		if err := json.Unmarshal(createRec.Body.Bytes(), &created); err != nil {
			t.Fatalf("decoding create response: %v", err)
		}

		putReq := httptest.NewRequest(http.MethodPut, "/recipes/"+created.ID, bytes.NewBufferString(
			`{"title":"Updated","cuisine":"y","servings":5}`))
		putRec := httptest.NewRecorder()
		mux.ServeHTTP(putRec, putReq)

		if putRec.Code != http.StatusOK {
			t.Fatalf("Update: got status %d, body %s", putRec.Code, putRec.Body.String())
		}
		var updated recipes.Recipe
		if err := json.Unmarshal(putRec.Body.Bytes(), &updated); err != nil {
			t.Fatalf("decoding update response: %v", err)
		}
		if updated.Title != "Updated" || updated.Cuisine != "y" || updated.Servings != 5 {
			t.Fatalf("got %+v, want updated fields", updated)
		}
	})

	t.Run("Update missing id returns 404", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPut, "/recipes/00000000-0000-0000-0000-000000000000",
			bytes.NewBufferString(`{"title":"x","cuisine":"x","servings":1}`))
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusNotFound {
			t.Fatalf("got status %d, want 404", rec.Code)
		}
	})

	t.Run("Update with invalid JSON returns 400", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPut, "/recipes/any-id", bytes.NewBufferString("not json"))
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("got status %d, want 400", rec.Code)
		}
	})
}

// The tests below call handlers directly (bypassing the mux) so they can
// inject a store failure via forceErr and assert the 500 branch, which the
// happy-path tests above never exercise.

func TestRecipeHandlers_StoreErrors(t *testing.T) {
	boom := errors.New("boom")

	t.Run("List 500s on store error", func(t *testing.T) {
		h := &RecipeHandlers{Recipes: &fakeRecipeStore{forceErr: boom}}
		req := httptest.NewRequest(http.MethodGet, "/recipes", nil)
		rec := httptest.NewRecorder()
		h.List(rec, req)

		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("got status %d, want 500", rec.Code)
		}
	})

	t.Run("Create 500s on store error", func(t *testing.T) {
		h := &RecipeHandlers{Recipes: &fakeRecipeStore{forceErr: boom}}
		req := httptest.NewRequest(http.MethodPost, "/recipes", bytes.NewBufferString(
			`{"title":"x","cuisine":"x","servings":1}`))
		rec := httptest.NewRecorder()
		h.Create(rec, req)

		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("got status %d, want 500", rec.Code)
		}
	})

	t.Run("Update 500s on store error", func(t *testing.T) {
		h := &RecipeHandlers{Recipes: &fakeRecipeStore{forceErr: boom}}
		req := httptest.NewRequest(http.MethodPut, "/recipes/any-id", bytes.NewBufferString(
			`{"title":"x","cuisine":"x","servings":1}`))
		req.SetPathValue("id", "any-id")
		rec := httptest.NewRecorder()
		h.Update(rec, req)

		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("got status %d, want 500", rec.Code)
		}
	})

	t.Run("Delete 500s on store error", func(t *testing.T) {
		h := &RecipeHandlers{Recipes: &fakeRecipeStore{forceErr: boom}}
		req := httptest.NewRequest(http.MethodDelete, "/recipes/any-id", nil)
		req.SetPathValue("id", "any-id")
		rec := httptest.NewRecorder()
		h.Delete(rec, req)

		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("got status %d, want 500", rec.Code)
		}
	})
}
