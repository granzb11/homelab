package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	apihttp "mealtracker/api/internal/http"
	"mealtracker/api/internal/recipes"
)

func healthzHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "ok")
}

func main() {
	ctx := context.Background()

	pool, err := pgxpool.New(ctx, "postgres:///meal_tracker_dev")
	if err != nil {
		log.Fatalf("connecting to postgres: %v", err)
	}
	defer pool.Close()

	recipeHandlers := &apihttp.RecipeHandlers{Recipes: recipes.NewStore(pool)}

	http.HandleFunc("/healthz", healthzHandler)
	http.HandleFunc("/recipes", recipeHandlers.List)
	http.HandleFunc("POST /recipes", recipeHandlers.Create)
	http.HandleFunc("GET /recipes/{id}", recipeHandlers.Get)
	http.HandleFunc("PUT /recipes/{id}", recipeHandlers.Update)
	http.HandleFunc("DELETE /recipes/{id}", recipeHandlers.Delete)

	fmt.Println("listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
