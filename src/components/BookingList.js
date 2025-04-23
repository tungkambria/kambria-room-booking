import { useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Table, Card } from "react-bootstrap";
import "./BookingList.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faCalendarAlt,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

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
    <Card className="booking-list-card">
      <Card.Body>
        <h4 className="booking-list-title">Upcoming Bookings for {room}</h4>
        <div className="table-responsive">
          <Table hover className="booking-table">
            <thead>
              <tr>
                <th>
                  <FontAwesomeIcon icon={faUser} className="me-2" /> Name
                </th>
                <th>
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" /> Date
                </th>
                <th>
                  <FontAwesomeIcon icon={faClock} className="me-2" /> Time
                </th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr key={i}>
                  <td>{b.name}</td>
                  <td>{new Date(b.date).toLocaleDateString("vi")}</td>
                  <td>
                    {b.startTime} - {b.endTime}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        b.approved ? "approved" : "pending"
                      }`}
                    >
                      {b.approved ? "Approved" : "Pending"}
                    </span>
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
