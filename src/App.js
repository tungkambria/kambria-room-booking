import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Container } from "react-bootstrap";
import Header from "./components/Header";
import RoomList from "./components/RoomList";
import RoomBookingForm from "./components/RoomBookingForm";
import { useState } from "react";
import CalendarView from "./components/CalendarView";
import BookingList from "./components/BookingList";
import AdminDashboard from "./components/AdminDashboard";
import "./App.css";

function App() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookings, setBookings] = useState([]);

  return (
    <Router>
      <Header />
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <Container className="py-4">
                <div className="booking-container">
                  <div className="room-selection-section">
                    <RoomList onSelect={setSelectedRoom} />
                  </div>

                  {selectedRoom && (
                    <div className="booking-details-section">
                      <div className="booking-form-container">
                        <RoomBookingForm
                          selectedRoom={selectedRoom}
                          setBookings={setBookings}
                        />
                      </div>
                      <div className="calendar-container">
                        <CalendarView
                          room={selectedRoom}
                          bookings={bookings}
                          setBookings={setBookings}
                        />
                      </div>
                      <div className="booking-list-container">
                        <BookingList
                          room={selectedRoom}
                          bookings={bookings}
                          setBookings={setBookings}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Container>
            }
          />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
