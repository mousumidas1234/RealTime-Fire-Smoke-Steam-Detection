'use client';

import { useEffect, useState } from 'react';
import { Calendar, Database, Edit3, Eye, Flame, PlaySquare, Save, Trash2, Wind, Droplets, X } from 'lucide-react';

type Detection = { type: 'fire' | 'smoke' | 'steam'; confidence: number };
type Event = {
  id: string;
  timestamp: string;
  detections: Detection[];
  image_url: string;
  status?: 'Open' | 'Reviewed' | 'Archived';
  notes?: string;
};

const icons = { fire: Flame, smoke: Wind, steam: Droplets };
const colors = { fire: 'text-rose-600', smoke: 'text-orange-600', steam: 'text-sky-600' };
const apiBase = () => process.env.NEXT_PUBLIC_API_URL || `http://${window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname}:8000`;

export default function RecordingsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selected, setSelected] = useState<Event | null>(null);
  const [editing, setEditing] = useState<Event | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Event['status']>('Open');
  const [loading, setLoading] = useState(true);

  const loadEvents = () => {
    setLoading(true);
    fetch(`${apiBase()}/events`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void Promise.resolve().then(loadEvents);
  }, []);

  const beginEdit = (event: Event) => {
    setEditing(event);
    setNotes(event.notes || '');
    setStatus(event.status || 'Open');
  };

  const saveEdit = async () => {
    if (!editing) return;
    const response = await fetch(`${apiBase()}/events/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, status }),
    });
    if (response.ok) {
      const updated = await response.json();
      setEvents((prev) => prev.map((event) => (event.id === updated.id ? updated : event)));
      setEditing(null);
    }
  };

  const deleteEvent = async (event: Event) => {
    if (!window.confirm(`Delete incident ${event.id}?`)) return;
    const response = await fetch(`${apiBase()}/events/${event.id}`, { method: 'DELETE' });
    if (response.ok) {
      setEvents((prev) => prev.filter((item) => item.id !== event.id));
      if (selected?.id === event.id) setSelected(null);
      if (editing?.id === event.id) setEditing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#003c71] flex items-center gap-2">
          <PlaySquare className="text-[#f58220]" /> Incident Evidence
        </h2>
        <p className="text-xs text-slate-600 mt-1">Annotated captures can be reviewed, edited, archived, or deleted.</p>
      </div>

      {loading ? (
        <p className="text-slate-600 text-sm">Loading evidence...</p>
      ) : events.length === 0 ? (
        <div className="rounded-2xl p-8 bg-white border border-slate-200 text-slate-600 text-sm shadow-sm">
          No incident captures yet. Start monitoring; confirmed detections are retained here with their annotated frame.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <article key={event.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">Incident {event.id}</p>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase text-[#003c71]">
                      {event.status || 'Open'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex gap-1 mt-1">
                    <Calendar size={13} />
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {event.detections.map((d, i) => {
                      const Icon = icons[d.type];
                      return (
                        <span key={`${d.type}-${i}`} className={`flex items-center gap-1 text-xs font-bold uppercase ${colors[d.type]}`}>
                          <Icon size={14} />
                          {d.type} {Math.round(d.confidence * 100)}%
                        </span>
                      );
                    })}
                  </div>
                  {event.notes && <p className="mt-3 text-xs text-slate-600">Notes: {event.notes}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelected(event)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#003c71] text-white text-xs font-bold cursor-pointer">
                    <Eye size={14} /> Review
                  </button>
                  <button onClick={() => beginEdit(event)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-[#003c71] text-xs font-bold cursor-pointer hover:bg-slate-50">
                    <Edit3 size={14} /> Edit
                  </button>
                  <button onClick={() => void deleteEvent(event)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold cursor-pointer hover:bg-rose-100">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex gap-3">
        <Database className="text-[#f58220] shrink-0" size={18} />
        <p className="text-xs text-slate-700">Evidence is stored under <code>backend/recordings</code>. Deleting an entry also removes its annotated image.</p>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="max-w-3xl w-full bg-white rounded-2xl p-4" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="w-full rounded-xl" src={`${apiBase()}${selected.image_url}`} alt="Annotated incident evidence" />
            <button onClick={() => setSelected(null)} className="mt-3 text-sm font-bold text-[#003c71] cursor-pointer">Close review</button>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <form className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl" onSubmit={(event) => { event.preventDefault(); void saveEdit(); }} onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#003c71]">Edit incident {editing.id}</h3>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <label className="mb-2 block text-xs font-bold uppercase text-slate-600">Status</label>
            <select value={status} onChange={(event) => setStatus(event.target.value as Event['status'])} className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#f58220]">
              <option>Open</option>
              <option>Reviewed</option>
              <option>Archived</option>
            </select>
            <label className="mb-2 block text-xs font-bold uppercase text-slate-600">Notes</label>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#f58220]" placeholder="Add investigation notes or action taken." />
            <button type="submit" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#003c71] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#002b52] cursor-pointer">
              <Save size={16} /> Save changes
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
