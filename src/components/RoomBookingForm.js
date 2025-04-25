import { useState } from "react";
import { Button, Form, Card, Row, Col, Alert, Modal } from "react-bootstrap";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
} from "firebase/firestore";
import "./RoomBookingForm.css";
import {
  formatDateGMT7,
  getTodayGMT7,
  generateOccurrences,
  weekDays,
} from "../utils";

const sendyUrl = process.env.REACT_APP_SENDY_URL;
const apiKey = process.env.REACT_APP_SENDY_API_KEY;
const listId = process.env.REACT_APP_SENDY_LIST_ID;

// Utility function to subscribe an email to Sendy list
const subscribeToSendy = async (email, name) => {
  if (!sendyUrl || !apiKey || !listId) {
    console.error("Sendy configuration is missing");
    return false;
  }

  try {
    const response = await fetch(`${sendyUrl}/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        api_key: apiKey,
        list: listId,
        email: email,
        name: name || "",
      }).toString(),
    });

    const result = await response.json();
    if (result.success) {
      console.log(`Subscribed ${email} to Sendy list`);
      return true;
    } else {
      console.error(`Failed to subscribe ${email}:`, result.message);
      return false;
    }
  } catch (error) {
    console.error(`Error subscribing ${email} to Sendy:`, error);
    return false;
  }
};

// Utility function to send an email to a single email using Sendy
const sendEmailToSingleEmail = async (
  email,
  subject,
  htmlContent,
  name = ""
) => {
  if (!sendyUrl || !apiKey || !listId) {
    console.error("Sendy configuration is missing");
    return false;
  }

  try {
    // Step 1: Subscribe the email to the Sendy list
    const subscribed = await subscribeToSendy(email, name);
    if (!subscribed) {
      console.error(`Failed to subscribe ${email} to Sendy list`);
      return false;
    }

    // Step 2: Create and send a campaign to the list
    const response = await fetch(`${sendyUrl}/api/campaigns/create.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        api_key: apiKey,
        from_name: "KOLVN Room Booking System",
        from_email: "noreply@kambria.io", // Replace with your sender email
        reply_to: "noreply@kambria.io",
        subject: subject,
        html_text: htmlContent,
        brand_id: "1", // Replace with your brand ID
        send_campaign: "1", // Send immediately
        list_ids: listId,
      }).toString(),
    });

    const result = await response.json();
    if (result.success) {
      console.log(`Email sent successfully to ${email}`);

      // Step 3 (Optional): Unsubscribe the email to keep the list clean
      const unsubscribeResponse = await fetch(`${sendyUrl}/unsubscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          api_key: apiKey,
          list: listId,
          email: email,
        }).toString(),
      });

      const unsubscribeResult = await unsubscribeResponse.json();
      if (unsubscribeResult.success) {
        console.log(`Unsubscribed ${email} from Sendy list`);
      } else {
        console.warn(
          `Failed to unsubscribe ${email}:`,
          unsubscribeResult.message
        );
      }

      return true;
    } else {
      console.error(`Failed to send email to ${email}:`, result.message);
      return false;
    }
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    return false;
  }
};

// Confirmation Modal Component
const ICSConfirmationModal = ({ show, onConfirm, onCancel, booking }) => {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>Download Calendar Event</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Would you like to download an ICS file for the booking of{" "}
        {booking?.room.name} on {booking?.date} from {booking?.startTime} to{" "}
        {booking?.endTime}?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Download
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const RoomBookingForm = ({ selectedRoom, setBookings }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState(null);

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("weekly");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [recurrenceDays, setRecurrenceDays] = useState([]);

  // State for confirmation modal
  const [showICSModal, setShowICSModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);

  const handleRecurrenceDayChange = (dayId) => {
    setRecurrenceDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((id) => id !== dayId)
        : [...prev, dayId]
    );
  };

  const handleDateChange = (e, isRecurrenceEndDate = false) => {
    const selectedDate = new Date(e.target.value);
    const today = getTodayGMT7();

    if (selectedDate < today) {
      setError(
        isRecurrenceEndDate
          ? "Recurrence end date cannot be in the past"
          : "Cannot book for past dates"
      );
      return;
    }

    const formattedDate = formatDateGMT7(selectedDate);
    if (isRecurrenceEndDate) {
      setRecurrenceEndDate(formattedDate);
    } else {
      setDate(formattedDate);
    }
    setError(null);
  };

  const checkTimeSlotAvailability = async () => {
    if (!date || !startTime || !endTime || !selectedRoom) return false;

    const occurrences = isRecurring
      ? generateOccurrences(
          new Date(date),
          new Date(recurrenceEndDate),
          recurrenceType,
          recurrenceDays
        )
      : [new Date(date)];

    for (const occurrence of occurrences) {
      const formattedDate = formatDateGMT7(occurrence);

      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      const newStart = startHours * 60 + startMinutes;
      const newEnd = endHours * 60 + endMinutes;

      if (newStart >= newEnd) {
        setError("End time must be after start time");
        return false;
      }

      try {
        const roomRef = doc(db, "rooms", selectedRoom.docId);
        const bookingsRef = collection(roomRef, "bookings");
        const q = query(bookingsRef, where("date", "==", formattedDate));
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
              `Time slot conflicts with an existing booking on ${formattedDate} (${booking.startTime} - ${booking.endTime})`
            );
            return false;
          }
        }
      } catch (err) {
        console.error("Error checking time slots:", err);
        setError("Error checking time slot availability");
        return false;
      }
    }

    return true;
  };

  const generateICSFile = (booking) => {
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
      `SUMMARY:Room Booking - ${booking.room.name}`,
      `DESCRIPTION:Purpose: ${booking.purpose}\\nBooked by: ${booking.name}`,
      `LOCATION:${booking.room.name}`,
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
      `RoomBooking-${booking.room.name}-${booking.date}.ics`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const sendBookingEmails = async (booking) => {
    const bookerSubject = `Booking Confirmation for ${booking.room.name}`;
    const adminSubject = `New Booking for ${booking.room.name}`;
    const emailContent = `
      <h2>Booking Details</h2>
      <p><strong>Room:</strong> ${booking.room.name}</p>
      <p><strong>Date:</strong> ${booking.date}</p>
      <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
      <p><strong>Purpose:</strong> ${booking.purpose}</p>
      <p><strong>Booked by:</strong> ${booking.name} (${booking.email})</p>
    `;

    // Subscribe booker to Sendy list
    const bookerSubscribed = await subscribeToSendy(
      booking.email,
      booking.name
    );
    if (!bookerSubscribed) {
      console.warn("Failed to subscribe booker to Sendy list");
      setError(
        "Booking successful, but failed to subscribe your email for notifications."
      );
    }

    // Send email to booker
    const bookerSent = await sendEmailToSingleEmail(
      booking.email,
      bookerSubject,
      emailContent
    );

    // Send emails to admins
    const adminEmails = [
      "liencao@kambria.io",
      "tungpham@kambria.io",
      "dung_le@ohmnilabs.com",
    ];

    const adminResults = await Promise.all(
      adminEmails.map(async (adminEmail) => {
        // Subscribe admin to Sendy list if not already subscribed
        await subscribeToSendy(adminEmail, "Admin");
        return sendEmailToSingleEmail(adminEmail, adminSubject, emailContent);
      })
    );

    // Log results and provide user feedback
    if (!bookerSent) {
      console.warn("Failed to send email to booker");
      setError(
        "Booking successful, but failed to send confirmation email to you."
      );
    }
    adminResults.forEach((success, index) => {
      if (!success) {
        console.warn(`Failed to send email to admin ${adminEmails[index]}`);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    const isAvailable = await checkTimeSlotAvailability();
    if (!isAvailable) return;

    const newBooking = {
      name,
      email,
      date,
      startTime,
      endTime,
      purpose,
      room: selectedRoom,
      isRecurring,
      recurrenceType: isRecurring ? recurrenceType : null,
      recurrenceEndDate: isRecurring ? recurrenceEndDate : null,
      recurrenceDays: isRecurring ? recurrenceDays : [],
    };

    try {
      const roomRef = doc(db, "rooms", selectedRoom.docId);
      const bookingsRef = collection(roomRef, "bookings");
      const docRef = await addDoc(bookingsRef, {
        ...newBooking,
        room: selectedRoom.name, // Store only the name in Firestore
      });

      setBookings((prevBookings) => [
        ...prevBookings,
        { ...newBooking, id: docRef.id, room: selectedRoom },
      ]);

      // Send notification emails
      await sendBookingEmails(newBooking);

      // Store the booking and show confirmation modal for ICS
      setPendingBooking(newBooking);
      setShowICSModal(true);

      // Clear the form
      setName("");
      setEmail("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setPurpose("");
      setIsRecurring(false);
      setRecurrenceType("weekly");
      setRecurrenceEndDate("");
      setRecurrenceDays([]);
    } catch (error) {
      console.error("Error adding booking: ", error);
      setError("Error submitting booking");
    }
  };

  // Handle ICS download confirmation
  const handleICSConfirm = () => {
    if (pendingBooking) {
      downloadICSFile(pendingBooking);
    }
    setShowICSModal(false);
    setPendingBooking(null);
  };

  // Handle ICS download cancellation
  const handleICSCancel = () => {
    setShowICSModal(false);
    setPendingBooking(null);
  };

  const getInputDateValue = (formattedDate) => {
    if (!formattedDate) return "";
    return formattedDate.split("-").reverse().join("-");
  };

  return (
    <>
      <Card className="booking-form-card">
        <Card.Body>
          <h4 className="form-title">Book {selectedRoom.name}</h4>
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
                    type="date"
                    onChange={(e) => handleDateChange(e)}
                    min={getInputDateValue(formatDateGMT7(getTodayGMT7()))}
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
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Your Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Purpose</Form.Label>
                  <Form.Control
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Enter the purpose of your booking"
                    style={{ width: "100%" }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="recurring-meeting"
                label="Recurring Meeting"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
            </Form.Group>

            {isRecurring && (
              <>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Recurrence Type</Form.Label>
                      <Form.Select
                        value={recurrenceType}
                        onChange={(e) => setRecurrenceType(e.target.value)}
                        className="form-control"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>End Date</Form.Label>
                      <Form.Control
                        type="date"
                        onChange={(e) => handleDateChange(e, true)}
                        min={getInputDateValue(formatDateGMT7(getTodayGMT7()))}
                        required={isRecurring}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {recurrenceType === "weekly" && (
                  <Form.Group className="mb-3">
                    <Form.Label>Repeat On</Form.Label>
                    <div className="day-selector">
                      {weekDays.map((day) => (
                        <Form.Check
                          key={day.id}
                          type="checkbox"
                          id={`day-${day.id}`}
                          label={day.name}
                          checked={recurrenceDays.includes(day.id)}
                          onChange={() => handleRecurrenceDayChange(day.id)}
                          inline
                        />
                      ))}
                    </div>
                  </Form.Group>
                )}
              </>
            )}
            <Button type="submit" className="submit-button" size="lg">
              Book Room
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <ICSConfirmationModal
        show={showICSModal}
        onConfirm={handleICSConfirm}
        onCancel={handleICSCancel}
        booking={pendingBooking}
      />
    </>
  );
};

export default RoomBookingForm;
