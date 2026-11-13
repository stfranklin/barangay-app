import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './auth';

export const STATUSES = ['Pending', 'Under Review', 'Approved', 'Ready for Claiming', 'Completed'];
export const REJECTED = 5; // status 0-4 follow STATUSES, 5 = Rejected
export const statusLabel = (s) => (s === REJECTED ? 'Rejected' : STATUSES[s] || 'Pending');
export const rowToRequest = (r) => ({
  id: r.id,
  ref: 'BRGY-' + String(r.id).padStart(4, '0'),
  doc: r.doc, name: r.full_name, address: r.address, contact: r.contact, purpose: r.purpose,
  status: r.status,
  date: new Date(r.created_at).toLocaleDateString(),
});
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

// Document requests are saved in Supabase. Bookings and notifications are still in memory.
export function AppProvider({ children }) {
  const [requests, setRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notes, setNotes] = useState([]);

  const notify = (text) => setNotes((n) => [{ id: Date.now() + Math.random(), text, read: false }, ...n]);
  const markNotificationsRead = useCallback(
    () => setNotes((current) => current.map((note) => ({ ...note, read: true }))),
    [],
  );

  const { session } = useAuth();
  const userId = session?.user?.id;

  const loadRequests = useCallback(async () => {
    if (!userId) { setRequests([]); return null; }
    const { data, error } = await supabase.from('requests').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (!error) setRequests((data || []).map(rowToRequest));
    return error?.message || null;
  }, [userId]);
  useEffect(() => { loadRequests(); }, [loadRequests]);

  const addRequest = async (r) => {
    const { data, error } = await supabase.from('requests')
      .insert({ user_id: userId, doc: r.doc, full_name: r.name, address: r.address, contact: r.contact, purpose: r.purpose, status: 0 })
      .select().single();
    if (error) return { error: error.message };
    const req = rowToRequest(data);
    setRequests((current) => [req, ...current]);
    notify(`Request ${req.ref} (${req.doc}) was submitted.`);
    return { request: req };
  };

  const toMinutes = (time) => {
    const [clock, period] = time.split(' ');
    let [hours, minutes] = clock.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };
  const isTaken = (kind, date, startTime, endTime = startTime) =>
    bookings.some((b) => {
      if (b.kind !== kind || b.date !== date) return false;
      if (kind !== 'court') return b.time === startTime;
      const bookedStart = toMinutes(b.startTime || b.time);
      const bookedEnd = toMinutes(b.endTime || b.time) + (b.endTime ? 0 : 60);
      return toMinutes(startTime) < bookedEnd && toMinutes(endTime) > bookedStart;
    });

  // Conflict detection: refuses a slot that is already reserved.
  const addBooking = (b) => {
    if (isTaken(b.kind, b.date, b.startTime || b.time, b.endTime || b.time)) return false;
    setBookings([{ ...b, id: Date.now() }, ...bookings]);
    notify(b.kind === 'court'
      ? `${b.title} booked for ${b.date}, ${b.startTime}–${b.endTime}. Total: ₱${b.fee}.`
      : `${b.title} booked for ${b.date}, ${b.time}.`);
    return true;
  };

  return (
    <Ctx.Provider value={{ requests, bookings, notes, addRequest, loadRequests, isTaken, addBooking, markNotificationsRead }}>
      {children}
    </Ctx.Provider>
  );
}
