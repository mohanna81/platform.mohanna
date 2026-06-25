"use client";
import React, { useState, useEffect, useMemo } from "react";
import Layout from "@/components/common/Layout";
import Modal from "@/components/common/Modal";
import { useAuth } from "@/lib/auth/AuthContext";
import { meetingsService } from "@/lib/api/services/meetings";
import { actionItemsService } from "@/lib/api/services/actionitems";
import type { Meeting } from "@/lib/api/services/meetings";
import type { ActionItem } from "@/lib/api/services/actionitems";
import { formatTimeWithTimezone } from "@/lib/utils/timezone";

/* ── types ── */
type CalendarEvent =
  | { kind: "meeting"; date: Date; data: Meeting }
  | { kind: "action"; date: Date; data: ActionItem };

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

/* ── helpers ── */
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

function getMeetingDotColor(m: Meeting): string {
  const now = new Date();
  if (m.status === "Cancelled") return "bg-red-500";
  if (m.status === "Completed") return "bg-gray-400";
  const end = new Date(`${m.date}T${m.endTime}`);
  const start = new Date(`${m.date}T${m.startTime}`);
  if (end < now) return "bg-orange-400";
  if (start <= now && end > now) return "bg-green-500";
  return "bg-[#2B4EAE]";
}

function getActionDotColor(a: ActionItem): string {
  const now = new Date();
  const due = new Date(a.implementationDate);
  if (a.status === "Complete") return "bg-green-500";
  if (a.status === "At Risk") return "bg-red-400";
  if (due < now) return "bg-red-500";
  return "bg-amber-400";
}

function getActionStatusBadge(status: string) {
  switch (status) {
    case "Complete": return "bg-green-100 text-green-700";
    case "At Risk": return "bg-red-100 text-red-700";
    case "In Progress": return "bg-blue-100 text-blue-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

/* ── component ── */
export default function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filter, setFilter] = useState<"all" | "meetings" | "actions">("all");

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  /* ── fetch data ── */
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([
      meetingsService.getAttendeeMeetings(user.id).catch(() => ({ success: false, data: null })),
      actionItemsService.getActionItems().catch(() => ({ success: false, data: null })),
    ]).then(([mRes, aRes]) => {
      if (mRes.success && mRes.data) {
        const raw = mRes.data as any;
        setMeetings(Array.isArray(raw) ? raw : raw.data ?? []);
      }
      if (aRes.success && aRes.data) {
        const raw = aRes.data as any;
        setActionItems(Array.isArray(raw) ? raw : raw.data ?? []);
      }
    }).finally(() => setLoading(false));
  }, [user?.id]);

  /* ── build calendar grid ── */
  const calendarDays = useMemo<CalendarDay[]>(() => {
    const firstOfMonth = new Date(currentYear, currentMonth, 1);
    const start = new Date(firstOfMonth);
    start.setDate(start.getDate() - firstOfMonth.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);

      const events: CalendarEvent[] = [];

      if (filter !== "actions") {
        meetings.forEach((m) => {
          if (sameDay(new Date(m.date), day)) {
            events.push({ kind: "meeting", date: new Date(m.date), data: m });
          }
        });
      }

      if (filter !== "meetings") {
        actionItems.forEach((a) => {
          if (a.implementationDate && sameDay(new Date(a.implementationDate), day)) {
            events.push({ kind: "action", date: new Date(a.implementationDate), data: a });
          }
        });
      }

      days.push({
        date: day,
        isCurrentMonth: day.getMonth() === currentMonth,
        isToday: sameDay(day, today),
        events,
      });
    }
    return days;
  }, [currentMonth, currentYear, meetings, actionItems, filter]);

  /* ── upcoming events (side panel) ── */
  const upcomingEvents = useMemo<CalendarEvent[]>(() => {
    const now = new Date();
    const results: CalendarEvent[] = [];

    if (filter !== "actions") {
      meetings
        .filter((m) => new Date(m.date) >= now && m.status === "Scheduled")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5)
        .forEach((m) => results.push({ kind: "meeting", date: new Date(m.date), data: m }));
    }

    if (filter !== "meetings") {
      actionItems
        .filter((a) => a.status !== "Complete" && new Date(a.implementationDate) >= now)
        .sort((a, b) => new Date(a.implementationDate).getTime() - new Date(b.implementationDate).getTime())
        .slice(0, 5)
        .forEach((a) => results.push({ kind: "action", date: new Date(a.implementationDate), data: a }));
    }

    return results.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 8);
  }, [meetings, actionItems, filter]);

  const formatEventDate = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <Layout>
      <div className="p-4 sm:p-8 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#0b1320]">Calendar</h1>
              <p className="text-sm text-gray-500 mt-0.5">Meetings and action item deadlines in one view</p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm self-start sm:self-auto">
              {(["all", "meetings", "actions"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition capitalize ${
                    filter === f
                      ? "bg-[#2B4EAE] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {f === "all" ? "All" : f === "meetings" ? "Meetings" : "Action Items"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-6">

            {/* ── Calendar grid ── */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

              {/* Month nav */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-[#0b1320]">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </h2>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-1 text-xs bg-[#FFF9E5] text-[#2B4EAE] font-semibold rounded-lg border border-[#2B4EAE]/20 hover:bg-[#2B4EAE]/10 transition"
                  >
                    Today
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))}
                    className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))}
                    className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-gray-100">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid */}
              {loading ? (
                <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>
              ) : (
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, i) => (
                    <div
                      key={i}
                      className={`min-h-[110px] p-2 border-b border-r border-gray-100 transition-colors ${
                        !day.isCurrentMonth ? "bg-gray-50/60" : "bg-white hover:bg-gray-50/50"
                      } ${day.isToday ? "ring-2 ring-inset ring-[#2B4EAE]/30" : ""}`}
                    >
                      <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                        day.isToday
                          ? "bg-[#2B4EAE] text-white"
                          : day.isCurrentMonth ? "text-gray-700" : "text-gray-300"
                      }`}>
                        {day.date.getDate()}
                      </div>

                      <div className="space-y-0.5">
                        {day.events.slice(0, 3).map((ev, j) => (
                          <button
                            key={j}
                            onClick={() => setSelectedEvent(ev)}
                            className={`w-full text-left flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium truncate transition hover:opacity-80 ${
                              ev.kind === "meeting"
                                ? "bg-[#2B4EAE]/10 text-[#2B4EAE]"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              ev.kind === "meeting" ? getMeetingDotColor(ev.data as Meeting) : getActionDotColor(ev.data as ActionItem)
                            }`} />
                            <span className="truncate">
                              {ev.kind === "meeting" ? (ev.data as Meeting).title : (ev.data as ActionItem).title}
                            </span>
                          </button>
                        ))}
                        {day.events.length > 3 && (
                          <p className="text-xs text-gray-400 pl-1">+{day.events.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Legend */}
              <div className="px-6 py-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2B4EAE]" />Meeting (upcoming)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" />Meeting (live / complete)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" />Meeting (past)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />Action item deadline</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Overdue / cancelled</span>
              </div>
            </div>

            {/* ── Upcoming panel ── */}
            <div className="xl:w-72 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm">Upcoming</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Next scheduled events</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {upcomingEvents.length === 0 ? (
                    <p className="px-5 py-8 text-center text-sm text-gray-400">Nothing upcoming</p>
                  ) : upcomingEvents.map((ev, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedEvent(ev)}
                      className="w-full text-left px-5 py-3 hover:bg-gray-50 transition flex items-start gap-3"
                    >
                      <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                        ev.kind === "meeting" ? getMeetingDotColor(ev.data as Meeting) : getActionDotColor(ev.data as ActionItem)
                      }`} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {ev.kind === "meeting" ? (ev.data as Meeting).title : (ev.data as ActionItem).title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatEventDate(ev.date)}</p>
                        <span className={`inline-flex mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          ev.kind === "meeting" ? "bg-[#2B4EAE]/10 text-[#2B4EAE]" : "bg-amber-100 text-amber-700"
                        }`}>
                          {ev.kind === "meeting" ? "Meeting" : "Action Item"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Event detail modal ── */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.kind === "meeting" ? "Meeting Details" : "Action Item Details"}
        size="lg"
      >
        {selectedEvent?.kind === "meeting" && (() => {
          const m = selectedEvent.data as Meeting;
          return (
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0b1320]">{m.title}</h3>
                  <p className="text-gray-500 mt-1">
                    {new Date(m.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                  <p className="text-gray-500">
                    {formatTimeWithTimezone(m.startTime, m.date, m.timezone)} – {formatTimeWithTimezone(m.endTime, m.date, m.timezone)}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    m.status === "Scheduled" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    m.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" :
                    "bg-red-50 text-red-700 border-red-200"
                  }`}>{m.status}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    m.meetingType === "Virtual" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-teal-50 text-teal-700 border-teal-200"
                  }`}>{m.meetingType}</span>
                </div>
              </div>
              {m.agenda && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Agenda</p>
                  <p className="text-gray-700 whitespace-pre-line">{m.agenda}</p>
                </div>
              )}
              {m.attendees?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Attendees ({m.attendees.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {m.attendees.map((a) => (
                      <span key={a._id} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">{a.name}</span>
                    ))}
                  </div>
                </div>
              )}
              {m.meetingType === "Virtual" && m.meetingLink && m.status !== "Completed" && (
                <a
                  href={m.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#2B4EAE] text-white rounded-xl text-sm font-semibold hover:bg-[#1e3a8a] transition"
                >
                  Join Meeting
                </a>
              )}
            </div>
          );
        })()}

        {selectedEvent?.kind === "action" && (() => {
          const a = selectedEvent.data as ActionItem;
          const assignedName = typeof a.assignTo === "object" && a.assignTo !== null ? (a.assignTo as any).name : undefined;
          return (
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0b1320]">{a.title}</h3>
                  <p className="text-gray-500 mt-1">
                    Due: {new Date(a.implementationDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${getActionStatusBadge(a.status)}`}>
                  {a.status}
                </span>
              </div>
              {a.description && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                  <p className="text-gray-700 whitespace-pre-line">{a.description}</p>
                </div>
              )}
              {assignedName && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Assigned To</p>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">{assignedName}</span>
                </div>
              )}
              <p className="text-xs text-gray-400 italic">Use the Action Items page to update status or add comments.</p>
            </div>
          );
        })()}
      </Modal>
    </Layout>
  );
}
