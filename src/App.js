import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import Header from "./components/Header";
import RoomList from "./components/RoomList";
import RoomBookingForm from "./components/RoomBookingForm";
import { useState } from "react";
import CalendarView from "./components/CalendarView";
import BookingList from "./components/BookingList";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookings, setBookings] = useState([]);

  return (
    <Router>
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <Container className="my-5">
              <Row>
                <Col md={6}>
                  <RoomList onSelect={setSelectedRoom} />
                </Col>
                <Col md={6}>
                  {selectedRoom && (
                    <RoomBookingForm
                      selectedRoom={selectedRoom}
                      setBookings={setBookings}
                    />
                  )}
                </Col>
              </Row>
              {selectedRoom && (
                <BookingList
                  room={selectedRoom}
                  bookings={bookings}
                  setBookings={setBookings}
                />
              )}
              <Row>
                <Col md={12}>
                  {selectedRoom && (
                    <CalendarView
                      room={selectedRoom}
                      bookings={bookings}
                      setBookings={setBookings}
                    />
                  )}
                </Col>
              </Row>
            </Container>
          }
        />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
