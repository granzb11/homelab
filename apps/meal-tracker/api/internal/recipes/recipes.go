package recipes

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ErrNotFound is returned by Get, Update and Delete when no recipe matches
// the given id. Callers (the HTTP layer) translate this into a 404.
var ErrNotFound = errors.New("recipe not found")

// Recipe mirrors one row of the recipes table.
type Recipe struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Cuisine  string `json:"cuisine"`
	Servings int    `json:"servings"`
}

// CreateInput is what a caller supplies to create a new recipe.
type CreateInput struct {
	Title    string `json:"title"`
	Cuisine  string `json:"cuisine"`
	Servings int    `json:"servings"`
}

// UpdateInput is what a caller supplies to replace an existing recipe.
type UpdateInput struct {
	Title    string `json:"title"`
	Cuisine  string `json:"cuisine"`
	Servings int    `json:"servings"`
}

// Store provides CRUD access to recipes backed by Postgres.
type Store struct {
	DB *pgxpool.Pool
}

func NewStore(db *pgxpool.Pool) *Store {
	return &Store{DB: db}
}

func (s *Store) List(ctx context.Context) ([]Recipe, error) {
	rows, err := s.DB.Query(ctx, "SELECT id, title, cuisine, servings FROM recipes")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Recipe
	for rows.Next() {
		var rec Recipe
		if err := rows.Scan(&rec.ID, &rec.Title, &rec.Cuisine, &rec.Servings); err != nil {
			return nil, err
		}
		list = append(list, rec)
	}
	return list, nil
}

func (s *Store) Create(ctx context.Context, in CreateInput) (Recipe, error) {
	rec := Recipe{Title: in.Title, Cuisine: in.Cuisine, Servings: in.Servings}
	query := "INSERT INTO recipes (title, cuisine, servings) VALUES ($1, $2, $3) RETURNING id"
	err := s.DB.QueryRow(ctx, query, rec.Title, rec.Cuisine, rec.Servings).Scan(&rec.ID)
	if err != nil {
		return Recipe{}, err
	}
	return rec, nil
}

func (s *Store) Get(ctx context.Context, id string) (Recipe, error) {
	var rec Recipe
	query := "SELECT id, title, cuisine, servings FROM recipes WHERE id = $1"
	err := s.DB.QueryRow(ctx, query, id).Scan(&rec.ID, &rec.Title, &rec.Cuisine, &rec.Servings)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Recipe{}, ErrNotFound
		}
		return Recipe{}, err
	}
	return rec, nil
}

func (s *Store) Update(ctx context.Context, id string, in UpdateInput) (Recipe, error) {
	var rec Recipe
	query := "UPDATE recipes SET title = $1, cuisine = $2, servings = $3 WHERE id = $4 RETURNING id, title, cuisine, servings"
	err := s.DB.QueryRow(ctx, query, in.Title, in.Cuisine, in.Servings, id).Scan(&rec.ID, &rec.Title, &rec.Cuisine, &rec.Servings)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Recipe{}, ErrNotFound
		}
		return Recipe{}, err
	}
	return rec, nil
}

func (s *Store) Delete(ctx context.Context, id string) error {
	tag, err := s.DB.Exec(ctx, "DELETE FROM recipes WHERE id = $1", id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
