"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Friend } from "@/lib/friends";
import ItineraryView from "./ItineraryView";
import CalendarView from "./CalendarView";
import EventsList from "./EventsList";
import ExpensesList from "./ExpensesList";
import PeopleList from "./PeopleList";
import TodoChecklist from "./TodoChecklist";
import FinancialDashboard from "./FinancialDashboard";
import RestaurantsClient, { type Restaurant } from "./RestaurantsClient";

type Attachment = { id: string; filename: string; originalName: string; mimeType: string };
type Participant = { id: string; friendId: string; inSplit: boolean; splitValue: string | null };

type Event = {
  id: string;
  tripId: string;
  type: string;
  title: string;
  confirmationCode: string | null;
  provider: string | null;
  startDate: string | null;
  startTime: string | null;
  endDate: string | null;
  endTime: string | null;
  startLocation: string | null;
  endLocation: string | null;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  durationMinutes: number | null;
  partySize: number | null;
  price: string | null;
  currency: string;
  notes: string | null;
  url: string | null;
  photoUrl: string | null;
  previewTitle: string | null;
  splitMode: string;
  paidBy: string;
  createdAt: string;
  participants: Participant[];
  attachments: Attachment[];
};

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

type TripParticipant = {
  id: string;
  tripId: string;
  friendId: string;
  joinDate: string | null;
  leaveDate: string | null;
  notes: string | null;
};

type Todo = {
  id: string;
  tripId: string;
  label: string;
  notes: string | null;
  dueDate: string | null;
  bookedAt: string | null;
  createdAt: string;
};

export type TripCity = {
  id: string;
  tripId: string;
  name: string;
  targetStartDate: string | null;
  targetEndDate: string | null;
  notes: string | null;
  createdAt: string;
};

type Trip = {
  id: string;
  name: string;
  budget: string | null;
  events: Event[];
  expenses: Expense[];
  participants: TripParticipant[];
  todos: Todo[];
  cities: TripCity[];
  restaurants: Restaurant[];
};

const TABS = ["calendar", "expenses", "itinerary", "people", "events", "restaurants"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  itinerary: "Itinerary",
  calendar: "Calendar",
  events: "Events",
  expenses: "Expenses",
  people: "People",
  restaurants: "Restaurants",
};

export default function TripDetailClient({
  trip: initialTrip,
  friendMap,
  isSharedView = false,
}: {
  trip: Trip;
  friendMap: Record<string, Friend>;
  isSharedView?: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("itinerary");
  const [trip, setTrip] = useState(initialTrip);

  const refresh = useCallback(() => router.refresh(), [router]);

  function saveEvent(event: Event) {
    const exists = trip.events.some((e) => e.id === event.id);
    const next = (exists
      ? trip.events.map((e) => (e.id === event.id ? event : e))
      : [...trip.events, event]
    ).sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));
    setTrip({ ...trip, events: next });
    refresh();
  }

  const pendingTodos = trip.todos.filter((t) => !t.bookedAt).length;

  return (
    <div className="space-y-6">
      {/* Todo checklist always visible above tabs */}
      {!isSharedView && (
        <TodoChecklist
          tripId={trip.id}
          todos={trip.todos}
          onUpdate={(todos) => setTrip({ ...trip, todos })}
        />
      )}

      {/* Tabs */}
      <div>
        <div className="flex border-b border-ink-faint gap-0">
          {TABS.map((tab) => {
            if (isSharedView && ["people", "restaurants"].includes(tab)) return null;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-moss text-ink font-medium"
                    : "border-transparent text-ink hover:text-ink"
                }`}
              >
                {TAB_LABELS[tab]}
                {tab === "events" && trip.events.length > 0 && (
                  <span className="ml-1.5 text-xs text-ink">{trip.events.length}</span>
                )}
                {tab === "expenses" && trip.expenses.length > 0 && (
                  <span className="ml-1.5 text-xs text-ink">{trip.expenses.length}</span>
                )}
                {tab === "people" && trip.participants.length > 0 && (
                  <span className="ml-1.5 text-xs text-ink">{trip.participants.length}</span>
                )}
                {tab === "restaurants" && trip.restaurants.length > 0 && (
                  <span className="ml-1.5 text-xs text-ink">{trip.restaurants.length}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-6">
          {activeTab === "itinerary" && (
            <ItineraryView
              tripId={trip.id}
              events={trip.events}
              cities={trip.cities}
              friendMap={friendMap}
              onCitiesUpdate={(cities) => setTrip({ ...trip, cities })}
              onEventSaved={saveEvent}
            />
          )}
          {activeTab === "calendar" && (
            <CalendarView
              events={trip.events}
              friendMap={friendMap}
            />
          )}
          {activeTab === "events" && (
            <EventsList
              tripId={trip.id}
              events={trip.events}
              friendMap={friendMap}
              onUpdate={(events) => { setTrip({ ...trip, events }); refresh(); }}
              isReadOnly={isSharedView}
            />
          )}
          {activeTab === "expenses" && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-ink">Expenses & Financials</h2>
                {!isSharedView && (
                  <button
                    onClick={() => {
                      const expensesListElement = document.querySelector('[data-expenses-list]');
                      if (expensesListElement) {
                        expensesListElement.dispatchEvent(new CustomEvent('openNewExpense'));
                      }
                    }}
                    className="px-4 py-2 bg-moss text-white text-sm font-medium hover:bg-moss transition-colors"
                  >
                    Add expense
                  </button>
                )}
              </div>

              <FinancialDashboard
                trip={trip}
                friendMap={friendMap}
                onRefresh={refresh}
              />
              <div className="border-t border-ink-faint pt-8" data-expenses-list>
                <ExpensesList
                  tripId={trip.id}
                  expenses={trip.expenses}
                  friendMap={friendMap}
                  onUpdate={(expenses) => { setTrip({ ...trip, expenses }); refresh(); }}
                  isReadOnly={isSharedView}
                />
              </div>
            </div>
          )}
          {activeTab === "people" && (
            <PeopleList
              tripId={trip.id}
              participants={trip.participants}
              friendMap={friendMap}
              onUpdate={(participants) => { setTrip({ ...trip, participants }); refresh(); }}
            />
          )}
          {activeTab === "restaurants" && (
            <RestaurantsClient
              tripId={trip.id}
              initialRestaurants={trip.restaurants}
            />
          )}
        </div>
      </div>

      {pendingTodos === 0 && trip.todos.length > 0 && (
        <p className="text-xs text-moss text-center py-2">All items booked ✓</p>
      )}
    </div>
  );
}
