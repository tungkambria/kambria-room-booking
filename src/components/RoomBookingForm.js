import { useState, useEffect } from "react";
import { Button, Form, Card, Row, Col } from "react-bootstrap"; // Add Row and Col imports
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import "./RoomBookingForm.css";
import $ from "jquery";
import "bootstrap-datepicker";
import "bootstrap-datepicker/dist/css/bootstrap-datepicker.min.css";
import Inputmask from "inputmask";

const RoomBookingForm = ({ selectedRoom, setBookings }) => {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  useEffect(() => {
    // Initialize input mask for DD/MM/YYYY format
    const inputMask = Inputmask({
      mask: "99/99/9999",
      placeholder: "DD/MM/YYYY",
      alias: "datetime",
      inputFormat: "dd/mm/yyyy",
      clearIncomplete: true,
      oncomplete: function () {
        // Trigger when the input mask is fully completed
        const value = this.value;
        const [day, month, year] = value.split("/").map(Number);
        // Validate date
        const date = new Date(year, month - 1, day);
        if (
          date.getFullYear() === year &&
          date.getMonth() === month - 1 &&
          date.getDate() === day
        ) {
          setDate((prev) => ({
            ...prev,
            day: day.toString(),
            month: month.toString(),
            year: year.toString(),
          }));
        }
      },
    }).mask("#booking-date");

    // Initialize bootstrap-datepicker
    $("#booking-date")
      .datepicker({
        format: "dd/mm/yyyy",
        startDate: "01/01/1900",
        endDate: "31/12/2100",
        language: "en",
        autoclose: true,
        todayHighlight: true,
      })
      .on("changeDate", (e) => {
        // Handle date selection via datepicker
        const date = e.date;
        setDate((prev) => ({
          ...prev,
          day: date.getDate().toString(),
          month: (date.getMonth() + 1).toString(),
          year: date.getFullYear().toString(),
        }));
      });

    // Cleanup on component unmount
    return () => {
      $("#booking-date").datepicker("destroy");
      inputMask.remove();
    };
  }, [setDate]);

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

    try {
      // Add the new booking to Firestore
      const docRef = await addDoc(collection(db, "bookings"), newBooking);

      // Update local state with the new booking (including the auto-generated ID if needed)
      setBookings((prevBookings) => [
        ...prevBookings,
        { ...newBooking, id: docRef.id },
      ]);

      // Clear the form
      setName("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setPurpose("");
    } catch (error) {
      console.error("Error adding booking: ", error);
    }
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
                  type="text"
                  id="booking-date"
                  name="bookingDate"
                  placeholder="DD/MM/YYYY"
                  pattern="\d{2}\/\d{2}\/\d{4}"
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
