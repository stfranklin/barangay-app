import { createContext, useCallback, useContext, useState } from 'react';

export const STATUSES = ['Pending', 'Under Review', 'Approved', 'Ready for Claiming', 'Completed'];
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

// Everything is kept in memory (resets on refresh). Swap for a database later.
export function AppProvider({ children }) {
  const [requests, setRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notes, setNotes] = useState([]);

  const notify = (text) => setNotes((n) => [{ id: Date.now() + Math.random(), text, read: false }, ...n]);
  const markNotificationsRead = useCallback(
    () => setNotes((current) => current.map((note) => ({ ...note, read: true }))),
    [],
  );

  const addRequest = (r) => {
    const ref = 'BRGY-' + String(requests.length + 1).padStart(4, '0');
    const req = { ...r, ref, status: 0, date: new Date().toLocaleDateString() };
    setRequests([req, ...requests]);
    notify(`Request ${ref} (${r.doc}) was submitted.`);
    return req;
  };

  const advance = (ref) => {
    const r = requests.find((x) => x.ref === ref);
    if (!r || r.status >= STATUSES.length - 1) return;
    setRequests(requests.map((x) => (x.ref === ref ? { ...x, status: x.status + 1 } : x)));
    notify(`Request ${ref} is now "${STATUSES[r.status + 1]}".`);
  };

  const isTaken = (kind, date, time) =>
    bookings.some((b) => b.kind === kind && b.date === date && b.time === time);

  // Conflict detection: refuses a slot that is already reserved.
  const addBooking = (b) => {
    if (isTaken(b.kind, b.date, b.time)) return false;
    setBookings([{ ...b, id: Date.now() }, ...bookings]);
    notify(`${b.title} booked for ${b.date}, ${b.time}.`);
    return true;
  };

  return (
    <Ctx.Provider value={{ requests, bookings, notes, addRequest, advance, isTaken, addBooking, markNotificationsRead }}>
      {children}
    </Ctx.Provider>
  );
}
