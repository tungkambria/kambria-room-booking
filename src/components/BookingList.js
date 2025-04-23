import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { Table, Card } from "react-bootstrap";
import "./BookingList.css";
import { weekDays } from "../utils";

const BookingList = ({ room, bookings, setBookings }) => {
  const [roomName, setRoomName] = useState(room.name);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!room || !room.docId) return;

      const bookingsRef = collection(db, "rooms", room.docId, "bookings");
      const snapshot = await getDocs(bookingsRef);
      setBookings(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    fetchBookings();
  }, [room, setBookings]);

  useEffect(() => {
    setRoomName(room.name);
  }, [room]);

  return (
    <Card className="booking-list-card">
      <Card.Body>
        <h4 className="booking-list-title">Upcoming Bookings for {roomName}</h4>
        <div className="table-responsive">
          <Table hover className="booking-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Purpose</th>
                <th>Recurrence</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr key={b.id || i}>
                  <td>{b.name}</td>
                  <td>{new Date(b.date).toLocaleDateString("vi")}</td>
                  <td>
                    {b.startTime} - {b.endTime}
                  </td>
                  <td>{b.purpose}</td>
                  <td>
                    {b.isRecurring && (
                      <>
                        {b.recurrenceType} until{" "}
                        {new Date(b.recurrenceEndDate).toLocaleDateString()}
                        {b.recurrenceDays.length > 0 && (
                          <div>
                            Days:{" "}
                            {b.recurrenceDays
                              .map((d) => weekDays[d].name)
                              .join(", ")}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default BookingList;
