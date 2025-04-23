import { useState, useEffect } from "react";
import { Button, Form, Card, Row, Col, Alert } from "react-bootstrap";
import { db } from "../firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
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
  const [error, setError] = useState(null);

  const formatDateGMT7 = (date) => {
    // Adjust for GMT+7 (7 hours ahead of UTC)
    date.setHours(date.getHours() + 7);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getTodayGMT7 = () => {
    const today = new Date();
    today.setHours(today.getHours() + 7); // Adjust to GMT+7
    return new Date(today.setHours(0, 0, 0, 0)); // Set to midnight
  };

  useEffect(() => {
    const today = getTodayGMT7();
    const todayFormatted = `${String(today.getDate()).padStart(
      2,
      "0"
    )}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

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
        const selectedDate = new Date(year, month - 1, day);
        const today = getTodayGMT7();

        if (selectedDate < today) {
          setError("Cannot book for past dates");
          return;
        }

        if (
          selectedDate.getFullYear() === year &&
          selectedDate.getMonth() === month - 1 &&
          selectedDate.getDate() === day
        ) {
          setDate(formatDateGMT7(selectedDate));
        }
      },
    }).mask("#booking-date");

    // Initialize bootstrap-datepicker with minDate set to today
    $("#booking-date")
      .datepicker({
        format: "dd/mm/yyyy",
        startDate: todayFormatted, // Set minimum date to today
        endDate: "31/12/2100",
        language: "en",
        autoclose: true,
        todayHighlight: true,
      })
      .on("changeDate", (e) => {
        // Handle date selection via datepicker
        const selectedDate = e.date;
        const today = getTodayGMT7();

        if (selectedDate < today) {
          setError("Cannot book for past dates");
          return;
        }

        setDate(formatDateGMT7(selectedDate));
      });

    // Cleanup on component unmount
    return () => {
      $("#booking-date").datepicker("destroy");
      inputMask.remove();
    };
  }, [setDate]);

  const checkTimeSlotAvailability = async () => {
    if (!date || !startTime || !endTime || !selectedRoom) return false;

    // Convert times to minutes for easier comparison
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    const newStart = startHours * 60 + startMinutes;
    const newEnd = endHours * 60 + endMinutes;

    if (newStart >= newEnd) {
      setError("End time must be after start time");
      return false;
    }

    try {
      const q = query(
        collection(db, "bookings"),
        where("room", "==", selectedRoom),
        where("date", "==", date)
      );
      const snapshot = await getDocs(q);

      for (const doc of snapshot.docs) {
        const booking = doc.data();
        const [existingStartHours, existingStartMinutes] = booking.startTime
          .split(":")
          .map(Number);
        const [existingEndHours, existingEndMinutes] = booking.endTime
          .split(":")
          .map(Number);
        const existingStart = existingStartHours * 60 + existingStartMinutes;
        const existingEnd = existingEndHours * 60 + existingEndMinutes;

        if (
          (newStart >= existingStart && newStart < existingEnd) ||
          (newEnd > existingStart && newEnd <= existingEnd) ||
          (newStart <= existingStart && newEnd >= existingEnd)
        ) {
          setError(
            `Time slot conflicts with an existing booking (${booking.startTime} - ${booking.endTime})`
          );
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error("Error checking time slots:", err);
      setError("Error checking time slot availability");
      return false;
    }
  };

  const generateICSFile = (booking) => {
    // Format date and time for ICS (YYYYMMDDTHHMMSS)
    const formatICSDateTime = (dateStr, timeStr) => {
      const [year, month, day] = dateStr.split("-");
      const [hours, minutes] = timeStr.split(":");
      return `${year}${month}${day}T${hours}${minutes}00`;
    };

    const startDateTime = formatICSDateTime(booking.date, booking.startTime);
    const endDateTime = formatICSDateTime(booking.date, booking.endTime);
    const now = new Date();
    const timestamp =
      now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Room Booking System//EN",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@roombookingsystem`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${startDateTime}`,
      `DTEND:${endDateTime}`,
      `SUMMARY:Room Booking - ${booking.room}`,
      `DESCRIPTION:Purpose: ${booking.purpose}\\nBooked by: ${booking.name}`,
      `LOCATION:${booking.room}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    return icsContent;
  };

  const downloadICSFile = (booking) => {
    const icsContent = generateICSFile(booking);
    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `RoomBooking-${booking.room}-${booking.date}.ics`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate time slot
    const isAvailable = await checkTimeSlotAvailability();
    if (!isAvailable) return;

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
      downloadICSFile(newBooking);
    } catch (error) {
      console.error("Error adding booking: ", error);
      setError("Error submitting booking");
    }
  };

  return (
    <Card className="booking-form-card">
      <Card.Body>
        <h4 className="form-title">Book {selectedRoom}</h4>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
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
                  style={{ width: "100%" }}
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
