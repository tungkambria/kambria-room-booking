import { useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Table } from "react-bootstrap";

const BookingList = ({ room, bookings, setBookings }) => {
  useEffect(() => {
    const fetchBookings = async () => {
      const q = query(collection(db, "bookings"), where("room", "==", room));
      const snapshot = await getDocs(q);
      setBookings(snapshot.docs.map((doc) => doc.data()));
    };
    if (room) fetchBookings();
  }, [room, setBookings]);

  return (
    <>
      <h5>Bookings for {room}</h5>
      <Table striped bordered>
        <thead>
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b, i) => (
            <tr key={i}>
              <td>{b.name}</td>
              <td>{b.date}</td>
              <td>
                {b.startTime} - {b.endTime}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};

export default BookingList;
