// RoomBookingForm.js
import { useState } from "react";
import { Button, Form, Card, Row, Col } from "react-bootstrap"; // Add Row and Col imports
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import "./RoomBookingForm.css";

const RoomBookingForm = ({ selectedRoom, setBookings }) => {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newBooking = {
      name,
      date,
      startTime,
      endTime,
      room: selectedRoom,
      approved: false,
      purpose,
    };

    await addDoc(collection(db, "bookings"), newBooking);

    // Clear the form
    setName("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setPurpose("");
  };

  return (
    <Card className="booking-form-card">
      <Card.Body>
        <h4 className="form-title">Book {selectedRoom}</h4>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Your Name</Form.Label>
                <Form.Control
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter your name"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Start Time</Form.Label>
                <Form.Control
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>End Time</Form.Label>
                <Form.Control
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Full-width Purpose field */}
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Purpose</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Enter the purpose of your booking"
                  style={{ width: "100%" }} // Ensure full width
                />
              </Form.Group>
            </Col>
          </Row>

          <Button type="submit" className="submit-button" size="lg">
            Book Room
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default RoomBookingForm;
