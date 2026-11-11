import { createContext, useContext, useState } from 'react';

export const STATUSES = ['Pending', 'Under Review', 'Approved', 'Ready for Claiming', 'Completed'];
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

// Everything is kept in memory (resets on refresh). Swap for a database later.
export function AppProvider({ children }) {
  const [requests, setRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notes, setNotes] = useState([{ id: 0, text: 'Welcome to Barangay Services!' }]);

  const notify = (text) => setNotes((n) => [{ id: Date.now() + Math.random(), text }, ...n]);

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
    <Ctx.Provider value={{ requests, bookings, notes, addRequest, advance, isTaken, addBooking }}>
      {children}
    </Ctx.Provider>
  );
}
