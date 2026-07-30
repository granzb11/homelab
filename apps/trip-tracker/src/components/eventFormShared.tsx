import type { SplitMode, SplitParticipant } from "@/lib/split";
import { OWNER_ID } from "@/lib/split";

export type Attachment = { id: string; filename: string; originalName: string; mimeType: string };
export type Participant = { id: string; friendId: string; inSplit: boolean; splitValue: string | null };

export type Event = {
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

export const EVENT_TYPES = ["FLIGHT", "HOTEL", "AIRBNB", "TRAIN", "BUS", "RENTAL_CAR", "FOOD_TOUR", "CITY_TOUR", "MUSEUM", "RESTAURANT", "ACTIVITY", "OTHER"] as const;

export const EVENT_ICONS: Record<string, string> = {
  FLIGHT: "✈", HOTEL: "🏨", AIRBNB: "🏠", TRAIN: "🚆", BUS: "🚌", RENTAL_CAR: "🚗",
  FOOD_TOUR: "🍜", CITY_TOUR: "🗺", MUSEUM: "🏛", RESTAURANT: "🍽", ACTIVITY: "🎯", OTHER: "📋",
};

// Opacity-based hue tints adapt to both the light surface and the dark ground.
export const TYPE_COLORS: Record<string, string> = {
  FLIGHT: "bg-blue-500/10 border-blue-500/25",
  HOTEL: "bg-purple-500/10 border-purple-500/25",
  AIRBNB: "bg-pink-500/10 border-pink-500/25",
  TRAIN: "bg-moss-tint/60 border-moss/30",
  BUS: "bg-panel border-ink-faint",
  RENTAL_CAR: "bg-gold-tint/60 border-gold/30",
  FOOD_TOUR: "bg-orange-500/10 border-orange-500/25",
  CITY_TOUR: "bg-cyan-500/10 border-cyan-500/25",
  MUSEUM: "bg-indigo-500/10 border-indigo-500/25",
  RESTAURANT: "bg-rose-500/10 border-rose-500/25",
  ACTIVITY: "bg-yellow-500/10 border-yellow-500/25",
  OTHER: "bg-panel border-ink-faint",
};

export type FieldConfig = {
  startDateLabel: string;
  endDateLabel: string;
  startTimeLabel: string;
  endTimeLabel: string;
  startTimeRequired: boolean;
  startLocationLabel: string | null;
  endLocationLabel: string | null;
  providerLabel: string;
  showDuration: boolean;
  showPartySize: boolean;
  titlePlaceholder: string;
};

export function getFieldConfig(type: string): FieldConfig {
  switch (type) {
    case "FLIGHT":
      return {
        startDateLabel: "Departure date",
        endDateLabel: "Arrival date",
        startTimeLabel: "Departure time *",
        endTimeLabel: "Arrival time",
        startTimeRequired: true,
        startLocationLabel: "From",
        endLocationLabel: "To",
        providerLabel: "Airline",
        showDuration: false,
        showPartySize: false,
        titlePlaceholder: "e.g. EI116 IAD → DUB",
      };
    case "HOTEL":
      return {
        startDateLabel: "Check-in date",
        endDateLabel: "Checkout date",
        startTimeLabel: "Check-in time *",
        endTimeLabel: "Checkout time",
        startTimeRequired: true,
        startLocationLabel: "Address",
        endLocationLabel: null,
        providerLabel: "Booking platform",
        showDuration: false,
        showPartySize: false,
        titlePlaceholder: "e.g. Hilton Tokyo",
      };
    case "AIRBNB":
      return {
        startDateLabel: "Check-in date",
        endDateLabel: "Checkout date",
        startTimeLabel: "Check-in time *",
        endTimeLabel: "Checkout time",
        startTimeRequired: true,
        startLocationLabel: "Address",
        endLocationLabel: null,
        providerLabel: "Platform",
        showDuration: false,
        showPartySize: false,
        titlePlaceholder: "e.g. Cozy flat in Salzburg",
      };
    case "TRAIN":
      return {
        startDateLabel: "Departure date",
        endDateLabel: "Arrival date",
        startTimeLabel: "Departure time",
        endTimeLabel: "Arrival time",
        startTimeRequired: false,
        startLocationLabel: "Departure station",
        endLocationLabel: "Arrival station",
        providerLabel: "Operator",
        showDuration: false,
        showPartySize: false,
        titlePlaceholder: "e.g. Eurostar London → Paris",
      };
    case "BUS":
      return {
        startDateLabel: "Departure date",
        endDateLabel: "Arrival date",
        startTimeLabel: "Departure time",
        endTimeLabel: "Arrival time",
        startTimeRequired: false,
        startLocationLabel: "From",
        endLocationLabel: "To",
        providerLabel: "Operator",
        showDuration: false,
        showPartySize: false,
        titlePlaceholder: "e.g. FlixBus Vienna → Graz",
      };
    case "RENTAL_CAR":
      return {
        startDateLabel: "Pickup date",
        endDateLabel: "Drop-off date",
        startTimeLabel: "Pickup time",
        endTimeLabel: "Drop-off time",
        startTimeRequired: false,
        startLocationLabel: "Pickup location",
        endLocationLabel: "Drop-off location",
        providerLabel: "Rental company",
        showDuration: false,
        showPartySize: false,
        titlePlaceholder: "e.g. Hertz compact, Vienna",
      };
    case "RESTAURANT":
      return {
        startDateLabel: "Reservation date",
        endDateLabel: "",
        startTimeLabel: "Reservation time *",
        endTimeLabel: "",
        startTimeRequired: true,
        startLocationLabel: "Address",
        endLocationLabel: null,
        providerLabel: "Platform",
        showDuration: false,
        showPartySize: true,
        titlePlaceholder: "e.g. Nobu Tokyo",
      };
    case "FOOD_TOUR":
      return {
        startDateLabel: "Date",
        endDateLabel: "",
        startTimeLabel: "Start time",
        endTimeLabel: "",
        startTimeRequired: false,
        startLocationLabel: "Location",
        endLocationLabel: null,
        providerLabel: "Provider",
        showDuration: true,
        showPartySize: false,
        titlePlaceholder: "e.g. Tsukiji Market tour",
      };
    case "CITY_TOUR":
      return {
        startDateLabel: "Date",
        endDateLabel: "",
        startTimeLabel: "Start time",
        endTimeLabel: "",
        startTimeRequired: false,
        startLocationLabel: "Location",
        endLocationLabel: null,
        providerLabel: "Provider",
        showDuration: true,
        showPartySize: false,
        titlePlaceholder: "e.g. Walking tour",
      };
    case "MUSEUM":
      return {
        startDateLabel: "Date",
        endDateLabel: "",
        startTimeLabel: "Start time",
        endTimeLabel: "",
        startTimeRequired: false,
        startLocationLabel: "Location",
        endLocationLabel: null,
        providerLabel: "Museum",
        showDuration: true,
        showPartySize: false,
        titlePlaceholder: "e.g. MoMA",
      };
    case "ACTIVITY":
      return {
        startDateLabel: "Date",
        endDateLabel: "",
        startTimeLabel: "Start time",
        endTimeLabel: "",
        startTimeRequired: false,
        startLocationLabel: "Location",
        endLocationLabel: null,
        providerLabel: "Provider",
        showDuration: true,
        showPartySize: false,
        titlePlaceholder: "e.g. Kayaking",
      };
    default:
      return {
        startDateLabel: "Start date",
        endDateLabel: "End date",
        startTimeLabel: "Start time",
        endTimeLabel: "End time",
        startTimeRequired: false,
        startLocationLabel: "Location",
        endLocationLabel: null,
        providerLabel: "Provider",
        showDuration: false,
        showPartySize: false,
        titlePlaceholder: "e.g. Transfer",
      };
  }
}

export function getTimeDisplayLabels(type: string) {
  const cfg = getFieldConfig(type);
  return {
    start: cfg.startTimeLabel.replace(" *", "").split(" ")[0],
    end: cfg.endTimeLabel.split(" ")[0],
  };
}

export type EventFormShape = {
  type: typeof EVENT_TYPES[number];
  title: string;
  confirmationCode: string;
  provider: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  startLocation: string;
  endLocation: string;
  city: string;
  state: string;
  durationMinutes: string | number;
  partySize: string | number;
  price: string;
  currency: string;
  notes: string;
  url: string;
  splitMode: SplitMode;
  paidBy: string;
  participants: SplitParticipant[];
};

export const EMPTY_FORM: EventFormShape = {
  type: "FLIGHT",
  title: "",
  confirmationCode: "",
  provider: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  startLocation: "",
  endLocation: "",
  city: "",
  state: "",
  durationMinutes: "",
  partySize: "",
  price: "",
  currency: "USD",
  notes: "",
  url: "",
  splitMode: "EVEN",
  paidBy: OWNER_ID,
  participants: [{ friendId: OWNER_ID, inSplit: true, splitValue: null }],
};

export function eventToForm(e: Event): EventFormShape {
  return {
    type: e.type as EventFormShape["type"],
    title: e.title,
    confirmationCode: e.confirmationCode ?? "",
    provider: e.provider ?? "",
    startDate: e.startDate ? e.startDate.slice(0, 10) : "",
    startTime: e.startTime ?? "",
    endDate: e.endDate ? e.endDate.slice(0, 10) : "",
    endTime: e.endTime ?? "",
    startLocation: e.startLocation ?? "",
    endLocation: e.endLocation ?? "",
    city: e.city ?? "",
    state: e.state ?? "",
    durationMinutes: e.durationMinutes ?? "",
    partySize: e.partySize ?? "",
    price: e.price ?? "",
    currency: e.currency,
    notes: e.notes ?? "",
    url: e.url ?? "",
    splitMode: e.splitMode as SplitMode,
    paidBy: e.paidBy,
    participants: e.participants.length > 0
      ? e.participants.map(p => ({ friendId: p.friendId, inSplit: p.inSplit, splitValue: p.splitValue != null ? parseFloat(p.splitValue) : null }))
      : [{ friendId: OWNER_ID, inSplit: true, splitValue: null }],
  };
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-ink mb-1.5">{label}</label>
      {children}
    </div>
  );
}
