"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";

type Todo = {
  id: string;
  tripId: string;
  label: string;
  notes: string | null;
  dueDate: string | null;
  bookedAt: string | null;
  createdAt: string;
};

export default function TodoChecklist({
  tripId,
  todos: initialTodos,
  onUpdate,
}: {
  tripId: string;
  todos: Todo[];
  onUpdate: (todos: Todo[]) => void;
}) {
  const [todos, setTodos] = useState(initialTodos);
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const pending = todos.filter((t) => !t.bookedAt);
  const done = todos.filter((t) => t.bookedAt);

  async function toggle(todo: Todo) {
    const bookedAt = todo.bookedAt ? null : new Date().toISOString();
    const res = await fetch(`/api/trips/${tripId}/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookedAt }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    const next = todos.map((t) => (t.id === todo.id ? updated : t));
    setTodos(next);
    onUpdate(next);
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setAdding(true);
    const res = await fetch(`/api/trips/${tripId}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel.trim() }),
    });
    if (res.ok) {
      const todo = await res.json();
      const next = [...todos, todo];
      setTodos(next);
      onUpdate(next);
      setNewLabel("");
      setShowAdd(false);
    }
    setAdding(false);
  }

  async function deleteTodo(id: string) {
    await fetch(`/api/trips/${tripId}/todos/${id}`, { method: "DELETE" });
    const next = todos.filter((t) => t.id !== id);
    setTodos(next);
    onUpdate(next);
  }

  if (todos.length === 0 && !showAdd) {
    return (
      <div className="border border-dashed border-ink-faint p-4 flex items-center justify-between">
        <span className="text-sm text-ink-muted">No items to book yet</span>
        <button
          onClick={() => setShowAdd(true)}
          className="text-sm text-moss hover:text-moss-dark"
        >
          + Add item
        </button>
      </div>
    );
  }

  return (
    <div className="border border-ink-faint bg-panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-faint">
        <h2 className="text-sm font-medium text-ink">
          To book
          {pending.length > 0 && (
            <span className="ml-2 text-xs bg-gold-tint text-gold px-1.5 py-0.5">{pending.length}</span>
          )}
        </h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs text-moss hover:text-moss-dark"
        >
          + Add item
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addTodo} className="flex gap-2 px-4 py-3 border-b border-ink-faint">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. Book return flight"
            autoFocus
            className="flex-1 border border-ink-faint bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:border-moss focus:outline-none"
          />
          <button
            type="submit"
            disabled={adding || !newLabel.trim()}
            className="bg-moss text-white text-xs px-3 py-1.5 hover:bg-moss-dark disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setShowAdd(false); setNewLabel(""); }}
            className="text-xs text-ink-muted hover:text-ink px-2"
          >
            ✕
          </button>
        </form>
      )}

      {pending.length > 0 && (
        <ul className="divide-y divide-ink-faint">
          {pending.map((todo) => (
            <li key={todo.id} className="flex items-center gap-3 px-4 py-2.5 group">
              <button
                onClick={() => toggle(todo)}
                className="w-4 h-4 border border-ink-faint flex-shrink-0 flex items-center justify-center hover:border-moss"
                aria-label="Mark as booked"
              />
              <span className="flex-1 text-sm text-ink">{todo.label}</span>
              {todo.dueDate && (
                <span className="text-xs text-ink-muted">{formatDate(todo.dueDate)}</span>
              )}
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-xs text-ink-faint hover:text-red-500 opacity-0 group-hover:opacity-100"
                aria-label="Delete"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <div>
          <button
            onClick={() => setShowDone(!showDone)}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-ink-muted hover:text-ink border-t border-ink-faint"
          >
            <span>{showDone ? "▾" : "▸"}</span>
            {done.length} booked
          </button>
          {showDone && (
            <ul className="divide-y divide-ink-faint border-t border-ink-faint">
              {done.map((todo) => (
                <li key={todo.id} className="flex items-center gap-3 px-4 py-2.5 group">
                  <button
                    onClick={() => toggle(todo)}
                    className="w-4 h-4 border border-moss bg-moss flex-shrink-0 flex items-center justify-center hover:bg-moss-dark"
                    aria-label="Mark as pending"
                  >
                    <span className="text-white text-xs leading-none">✓</span>
                  </button>
                  <span className="flex-1 text-sm text-ink-muted line-through">{todo.label}</span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-xs text-ink-faint hover:text-red-500 opacity-0 group-hover:opacity-100"
                    aria-label="Delete"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
