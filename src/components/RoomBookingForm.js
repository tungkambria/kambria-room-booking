import { useState } from "react";
import { Button, Form, Card } from "react-bootstrap";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import "./RoomBookingForm.css";

const RoomBookingForm = ({ selectedRoom, setBookings }) => {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newBooking = {
      name,
      date,
      startTime,
      endTime,
      room: selectedRoom,
      approved: false,
    };

    await addDoc(collection(db, "bookings"), newBooking);

    // Clear the form
    setName("");
    setDate("");
    setStartTime("");
    setEndTime("");

    // Immediately update bookings list in state
    if (setBookings) {
      setBookings((prev) => [...prev, newBooking]);
    }
  };

  return (
    <Card className="booking-form-card">
      <Card.Body>
        <h4 className="form-title">Book {selectedRoom}</h4>
        <Form onSubmit={handleSubmit}>
          <div className="form-grid">
            <Form.Group className="mb-3">
              <Form.Label>Your Name</Form.Label>
              <Form.Control
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Start Time</Form.Label>
              <Form.Control
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>End Time</Form.Label>
              <Form.Control
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </Form.Group>
          </div>

          <Button type="submit" className="submit-button" size="lg">
            Book Room
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default RoomBookingForm;
