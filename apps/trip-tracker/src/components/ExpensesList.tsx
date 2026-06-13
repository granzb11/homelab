"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";
import { OWNER_ID, type SplitParticipant } from "@/lib/split";
import type { Friend } from "@/lib/friends";
import SplitEditor from "./SplitEditor";

type Participant = { id: string; friendId: string; inSplit: boolean; splitValue: string | null };

type Expense = {
  id: string;
  tripId: string;
  title: string;
  amount: string | null;
  currency: string;
  date: string | null;
  category: string;
  notes: string | null;
  splitMode: string;
  paidBy: string;
  createdAt: string;
  participants: Participant[];
};

const EXPENSE_CATEGORIES = [
  "GROCERIES",
  "FOOD",
  "TRANSPORT",
  "ACTIVITIES",
  "ACCOMMODATION",
  "ENTERTAINMENT",
  "OTHER",
];

export default function ExpensesList({
  tripId,
  expenses,
  friendMap,
  onUpdate,
}: {
  tripId: string;
  expenses: Expense[];
  friendMap: Record<string, Friend>;
  onUpdate: (expenses: Expense[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Expense | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Listen for custom event from parent
  useEffect(() => {
    const element = document.querySelector('[data-expenses-list]');
    if (element) {
      const handleOpenNew = () => openNew();
      element.addEventListener('openNewExpense', handleOpenNew);
      return () => element.removeEventListener('openNewExpense', handleOpenNew);
    }
  }, []);

  const EMPTY_FORM: Expense = {
    id: "",
    tripId,
    title: "",
    amount: null,
    currency: "USD",
    date: new Date().toISOString().split("T")[0],
    category: "OTHER",
    notes: null,
    splitMode: "EVEN",
    paidBy: OWNER_ID,
    createdAt: new Date().toISOString(),
    participants: [{ id: "", friendId: OWNER_ID, inSplit: true, splitValue: null }],
  };

  function openNew() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsCreating(true);
  }

  function openEdit(expense: Expense) {
    setForm(expense);
    setEditingId(expense.id);
    setIsCreating(false);
  }

  function cancel() {
    setForm(null);
    setEditingId(null);
    setIsCreating(false);
  }

  async function save() {
    if (!form || !form.title.trim() || !form.amount) {
      alert("Please fill in title and amount");
      return;
    }

    const method = form.id ? "PATCH" : "POST";
    const url = form.id ? `/api/trips/${tripId}/expenses/${form.id}` : `/api/trips/${tripId}/expenses`;

    const payload = {
      ...form,
      splitParticipants: form.participants,
    };

    try {
      const res = await fetch(url, { method, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Failed to save");

      const saved = await res.json();

      if (form.id) {
        onUpdate(expenses.map((e) => (e.id === form.id ? saved : e)));
      } else {
        onUpdate([...expenses, saved]);
      }

      cancel();
    } catch (err) {
      console.error("Error saving expense:", err);
      alert("Failed to save expense");
    }
  }

  async function deleteExpense(id: string) {
    if (!confirm("Delete this expense?")) return;

    try {
      const res = await fetch(`/api/trips/${tripId}/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");

      onUpdate(expenses.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Error deleting expense:", err);
      alert("Failed to delete expense");
    }
  }

  const friends = Object.values(friendMap);
  const allFriends = friends.length > 0 ? friends : [];

  if (form) {
    const allParticipants = [OWNER_ID, ...allFriends.map((f) => f.id)];
    const formParticipants = form.participants || [{ id: "", friendId: OWNER_ID, inSplit: true, splitValue: null }];

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-ink">{form.id ? "Edit expense" : "New expense"}</h2>

        <div className="space-y-3 border border-ink-faint p-4">
          <div>
            <label className="block text-xs text-ink mb-1 font-medium">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-ink-faint text-sm focus:outline-none focus:border-moss"
              placeholder="e.g. Groceries"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ink mb-1 font-medium">Amount</label>
              <input
                type="number"
                step="0.01"
                value={form.amount || ""}
                onChange={(e) => setForm({ ...form, amount: e.target.value || null })}
                className="w-full px-3 py-2 border border-ink-faint text-sm focus:outline-none focus:border-moss"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs text-ink mb-1 font-medium">Date</label>
              <input
                type="date"
                value={form.date || ""}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-ink-faint text-sm focus:outline-none focus:border-moss"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ink mb-1 font-medium">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-ink-faint text-sm focus:outline-none focus:border-moss"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-ink mb-1 font-medium">Currency</label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-ink-faint text-sm focus:outline-none focus:border-moss"
                placeholder="USD"
                maxLength={3}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-ink mb-1 font-medium">Notes</label>
            <textarea
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value || null })}
              className="w-full px-3 py-2 border border-ink-faint text-sm focus:outline-none focus:border-moss resize-none"
              rows={2}
              placeholder="Optional notes"
            />
          </div>

          {form.amount && (
            <SplitEditor
              friends={allFriends}
              value={{
                splitMode: form.splitMode as any,
                paidBy: form.paidBy,
                participants: formParticipants as any,
              }}
              price={String(form.amount)}
              currency={form.currency}
              onChange={(state) =>
                setForm({
                  ...form,
                  splitMode: state.splitMode,
                  paidBy: state.paidBy,
                  participants: state.participants.map((p) => ({
                    id: "",
                    friendId: p.friendId,
                    inSplit: p.inSplit,
                    splitValue: p.splitValue !== null ? String(p.splitValue) : null,
                  })),
                })
              }
            />
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={save}
            className="px-4 py-2 bg-moss text-white text-sm font-medium hover:bg-moss transition-colors"
          >
            Save
          </button>
          <button
            onClick={cancel}
            className="px-4 py-2 border border-ink-faint text-ink text-sm font-medium hover:bg-panel transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-ink">Your expenses</h2>

      {expenses.length === 0 ? (
        <p className="text-sm text-ink p-4 border border-ink-faint bg-panel">
          No expenses yet. Click "Add expense" to track group costs.
        </p>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <div key={expense.id} className="border border-ink-faint p-3 hover:bg-panel transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-medium text-sm text-ink">{expense.title}</p>
                  <p className="text-xs text-ink mt-1">
                    {expense.date ? new Date(expense.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                    {expense.category && ` · ${expense.category.replace(/_/g, " ")}`}
                  </p>
                </div>
                <p className="text-sm font-medium text-ink">{formatPrice(expense.amount, expense.currency)}</p>
              </div>

              {expense.participants.length > 0 && (
                <div className="flex gap-1 mb-3 flex-wrap">
                  {expense.participants
                    .filter((p) => p.inSplit)
                    .map((p) => (
                      <span key={p.friendId} className="text-xs bg-moss/10 text-moss px-2 py-1">
                        {p.friendId === OWNER_ID ? "You" : friendMap[p.friendId]?.name || "Friend"}
                      </span>
                    ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(expense)}
                  className="text-xs text-moss hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteExpense(expense.id)}
                  className="text-xs text-gold hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
