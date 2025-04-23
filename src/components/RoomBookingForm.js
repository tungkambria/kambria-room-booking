import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

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
    <Form onSubmit={handleSubmit}>
      <h5>Book {selectedRoom}</h5>
      <Form.Group className="mb-3">
        <Form.Label>Your Name</Form.Label>
        <Form.Control
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
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
      <Button type="submit">Book</Button>
    </Form>
  );
};

export default RoomBookingForm;
