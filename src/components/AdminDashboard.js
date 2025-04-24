import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import {
  Container,
  Tabs,
  Tab,
  Form,
  Button,
  Card,
  Table,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import "./AdminDashboard.css";
import AuthGuard from "./AuthGuard";
import { formatRecurrenceInfo, weekDays } from "../utils";

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [newBooking, setNewBooking] = useState({
    room: "",
    date: "",
    startTime: "",
    endTime: "",
    name: "",
    purpose: "",
    isRecurring: false,
    recurrenceType: "weekly",
    recurrenceEndDate: "",
    recurrenceDays: [],
  });
  const [editingBooking, setEditingBooking] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState("");
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editedRoomName, setEditedRoomName] = useState("");
  const [activeTab, setActiveTab] = useState("rooms");
  const [notification, setNotification] = useState(null);

  const showNotification = (message, variant = "success") => {
    setNotification({ message, variant });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchRooms = async () => {
    const snap = await getDocs(collection(db, "rooms"));
    setRooms(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const fetchBookings = async () => {
    try {
      const roomsSnapshot = await getDocs(collection(db, "rooms"));
      const roomsData = roomsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const allBookings = [];
      for (const room of roomsData) {
        const bookingsRef = collection(db, "rooms", room.id, "bookings");
        const bookingsSnapshot = await getDocs(bookingsRef);
        const roomBookings = bookingsSnapshot.docs.map((doc) => ({
          id: doc.id,
          room: room.name,
          roomId: room.id,
          ...doc.data(),
        }));
        allBookings.push(...roomBookings);
      }

      setBookings(allBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      showNotification("Error fetching bookings", "danger");
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchRooms(); // eslint-disable-next-line
  }, []);

  const createRoom = async () => {
    if (!newRoom.trim()) {
      showNotification("Room name cannot be empty", "danger");
      return;
    }
    try {
      await addDoc(collection(db, "rooms"), { name: newRoom.trim() });
      setNewRoom("");
      fetchRooms();
      showNotification("Room created successfully");
    } catch (error) {
      showNotification("Error creating room", "danger");
      console.error("Error creating room:", error);
    }
  };

  const updateRoom = async (id) => {
    if (!editedRoomName.trim()) {
      showNotification("Room name cannot be empty", "danger");
      return;
    }
    try {
      // Update room name in rooms collection
      await updateDoc(doc(db, "rooms", id), { name: editedRoomName.trim() });

      // Get all bookings for the room
      const bookingsRef = collection(db, "rooms", id, "bookings");
      const bookingsSnapshot = await getDocs(bookingsRef);

      // Update room name in each booking
      const updatePromises = bookingsSnapshot.docs.map(async (bookingDoc) => {
        await updateDoc(doc(db, "rooms", id, "bookings", bookingDoc.id), {
          room: editedRoomName.trim(),
        });
      });

      // Wait for all booking updates to complete
      await Promise.all(updatePromises);

      // Refresh data
      await Promise.all([fetchRooms(), fetchBookings()]);

      setEditingRoomId(null);
      showNotification("Room and associated bookings updated successfully");
    } catch (error) {
      showNotification("Error updating room and bookings", "danger");
      console.error("Error updating room and bookings:", error);
    }
  };

  const deleteRoom = async (id) => {
    try {
      // Get all bookings for the room
      const bookingsRef = collection(db, "rooms", id, "bookings");
      const bookingsSnapshot = await getDocs(bookingsRef);

      // Delete each booking
      const deletePromises = bookingsSnapshot.docs.map(async (bookingDoc) => {
        await deleteDoc(doc(db, "rooms", id, "bookings", bookingDoc.id));
      });

      // Wait for all bookings to be deleted
      await Promise.all(deletePromises);

      // Delete the room
      await deleteDoc(doc(db, "rooms", id));

      // Refresh rooms and bookings
      await Promise.all([fetchRooms(), fetchBookings()]);
      showNotification("Room and all associated bookings deleted successfully");
    } catch (error) {
      showNotification("Error deleting room and bookings", "danger");
      console.error("Error deleting room and bookings:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "isRecurring") {
      setNewBooking((prev) => ({ ...prev, isRecurring: checked }));
    } else if (name === "recurrenceDays") {
      setNewBooking((prev) => {
        const dayId = parseInt(value);
        const updatedDays = prev.recurrenceDays.includes(dayId)
          ? prev.recurrenceDays.filter((id) => id !== dayId)
          : [...prev.recurrenceDays, dayId];
        return { ...prev, recurrenceDays: updatedDays };
      });
    } else {
      setNewBooking((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "isRecurring") {
      setEditingBooking((prev) => ({ ...prev, isRecurring: checked }));
    } else if (name === "recurrenceDays") {
      setEditingBooking((prev) => {
        const dayId = parseInt(value);
        const updatedDays = prev.recurrenceDays.includes(dayId)
          ? prev.recurrenceDays.filter((id) => id !== dayId)
          : [...prev.recurrenceDays, dayId];
        return { ...prev, recurrenceDays: updatedDays };
      });
    } else {
      setEditingBooking((prev) => ({ ...prev, [name]: value }));
    }
  };

  const createBooking = async () => {
    try {
      const roomQuery = query(
        collection(db, "rooms"),
        where("name", "==", newBooking.room)
      );
      const roomSnapshot = await getDocs(roomQuery);

      if (roomSnapshot.empty) {
        showNotification("Room not found", "danger");
        return;
      }

      const roomId = roomSnapshot.docs[0].id;
      const roomRef = doc(db, "rooms", roomId);
      const bookingsRef = collection(roomRef, "bookings");

      const bookingData = {
        name: newBooking.name,
        date: newBooking.date,
        startTime: newBooking.startTime,
        endTime: newBooking.endTime,
        purpose: newBooking.purpose,
        isRecurring: newBooking.isRecurring,
        recurrenceType: newBooking.isRecurring
          ? newBooking.recurrenceType
          : null,
        recurrenceEndDate: newBooking.isRecurring
          ? newBooking.recurrenceEndDate
          : null,
        recurrenceDays: newBooking.isRecurring ? newBooking.recurrenceDays : [],
      };

      await addDoc(bookingsRef, bookingData);

      fetchBookings();
      setNewBooking({
        room: "",
        date: "",
        startTime: "",
        endTime: "",
        name: "",
        purpose: "",
        isRecurring: false,
        recurrenceType: "weekly",
        recurrenceEndDate: "",
        recurrenceDays: [],
      });
      showNotification("Booking created successfully");
    } catch (error) {
      showNotification("Error creating booking", "danger");
      console.error("Error creating booking:", error);
    }
  };

  const updateBooking = async () => {
    try {
      const bookingRef = doc(
        db,
        "rooms",
        editingBooking.roomId,
        "bookings",
        editingBooking.id
      );
      await updateDoc(bookingRef, {
        name: editingBooking.name,
        date: editingBooking.date,
        startTime: editingBooking.startTime,
        endTime: editingBooking.endTime,
        purpose: editingBooking.purpose,
        isRecurring: editingBooking.isRecurring,
        recurrenceType: editingBooking.isRecurring
          ? editingBooking.recurrenceType
          : null,
        recurrenceEndDate: editingBooking.isRecurring
          ? editingBooking.recurrenceEndDate
          : null,
        recurrenceDays: editingBooking.isRecurring
          ? editingBooking.recurrenceDays
          : [],
      });

      setEditingBooking(null);
      fetchBookings();
      showNotification("Booking updated successfully");
    } catch (error) {
      showNotification("Error updating booking", "danger");
      console.error("Error updating booking:", error);
    }
  };

  const deleteBooking = async (id, roomId) => {
    try {
      const bookingRef = doc(db, "rooms", roomId, "bookings", id);
      await deleteDoc(bookingRef);
      fetchBookings();
      showNotification("Booking deleted successfully");
    } catch (error) {
      showNotification("Error deleting booking", "danger");
      console.error("Error deleting booking:", error);
    }
  };

  const startEditing = (booking) => {
    setEditingBooking({
      ...booking,
      date: new Date(booking.date).toISOString().split("T")[0],
      recurrenceDays: booking.recurrenceDays || [],
    });
  };

  const cancelEditing = () => {
    setEditingBooking(null);
  };

  return (
    <AuthGuard>
      <Container className="admin-dashboard py-4">
        {notification && (
          <Alert
            variant={notification.variant}
            className="notification-alert"
            onClose={() => setNotification(null)}
            dismissible
          >
            {notification.message}
          </Alert>
        )}

        <h2 className="dashboard-title">Admin Dashboard</h2>

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-4 admin-tabs"
        >
          <Tab eventKey="rooms" title="Manage Rooms">
            <Card className="mb-4 admin-card">
              <Card.Header className="card-header">Room Management</Card.Header>
              <Card.Body>
                <div className="room-form-container">
                  <Form.Control
                    placeholder="New room name"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    className="mb-3"
                  />
                  <Button onClick={createRoom} className="action-button">
                    Add
                  </Button>
                </div>

                <Table striped hover className="admin-table">
                  <thead>
                    <tr>
                      <th>Room Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => (
                      <tr key={room.id}>
                        <td>
                          {editingRoomId === room.id ? (
                            <Form.Control
                              value={editedRoomName}
                              onChange={(e) =>
                                setEditedRoomName(e.target.value)
                              }
                            />
                          ) : (
                            room.name
                          )}
                        </td>
                        <td className="actions-cell">
                          {editingRoomId === room.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => updateRoom(room.id)}
                                className="me-2 action-button"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => setEditingRoomId(null)}
                                className="action-button"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline-primary"
                                className="me-2 action-button"
                                onClick={() => {
                                  setEditingRoomId(room.id);
                                  setEditedRoomName(room.name);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => deleteRoom(room.id)}
                                className="action-button"
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>

          <Tab eventKey="bookings" title="Manage Bookings">
            {editingBooking ? (
              <Card className="mb-4 admin-card">
                <Card.Header className="card-header">Edit Booking</Card.Header>
                <Card.Body>
                  <Form className="booking-form">
                    <Row>
                      <Col md={6}>
                        <Form.Select
                          name="room"
                          value={editingBooking.room}
                          onChange={handleEditInputChange}
                          className="mb-3"
                          disabled
                        >
                          <option value="">Select a room</option>
                          {rooms.map((room) => (
                            <option key={room.id} value={room.name}>
                              {room.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={6}>
                        <Form.Control
                          name="date"
                          placeholder="Date"
                          type="date"
                          value={editingBooking.date}
                          onChange={handleEditInputChange}
                          className="mb-3"
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Control
                          name="startTime"
                          placeholder="Start Time"
                          type="time"
                          value={editingBooking.startTime}
                          onChange={handleEditInputChange}
                          className="mb-3"
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Control
                          name="endTime"
                          placeholder="End Time"
                          type="time"
                          value={editingBooking.endTime}
                          onChange={handleEditInputChange}
                          className="mb-3"
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Control
                          name="purpose"
                          placeholder="Purpose"
                          type="text"
                          value={editingBooking.purpose}
                          onChange={handleEditInputChange}
                          className="mb-3"
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Control
                          name="name"
                          placeholder="Name"
                          value={editingBooking.name}
                          onChange={handleEditInputChange}
                          className="mb-3"
                        />
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="edit-recurring-meeting"
                        label="Recurring Meeting"
                        name="isRecurring"
                        checked={editingBooking.isRecurring}
                        onChange={handleEditInputChange}
                      />
                    </Form.Group>
                    {editingBooking.isRecurring && (
                      <>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Recurrence Type</Form.Label>
                              <Form.Select
                                name="recurrenceType"
                                value={editingBooking.recurrenceType}
                                onChange={handleEditInputChange}
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
                                name="recurrenceEndDate"
                                type="date"
                                value={editingBooking.recurrenceEndDate}
                                onChange={handleEditInputChange}
                                className="mb-3"
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        {editingBooking.recurrenceType === "weekly" && (
                          <Form.Group className="mb-3">
                            <Form.Label>Repeat On</Form.Label>
                            <div className="day-selector">
                              {weekDays.map((day) => (
                                <Form.Check
                                  key={day.id}
                                  type="checkbox"
                                  id={`edit-day-${day.id}`}
                                  label={day.name}
                                  name="recurrenceDays"
                                  value={day.id}
                                  checked={editingBooking.recurrenceDays.includes(
                                    day.id
                                  )}
                                  onChange={handleEditInputChange}
                                  inline
                                />
                              ))}
                            </div>
                          </Form.Group>
                        )}
                      </>
                    )}
                    <div>
                      <Button
                        variant="success"
                        onClick={updateBooking}
                        className="action-button me-2"
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={cancelEditing}
                        className="action-button"
                      >
                        Cancel
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            ) : (
              <Card className="mb-4 admin-card">
                <Card.Header className="card-header">
                  Create New Booking
                </Card.Header>
                <Card.Body>
                  <Form className="booking-form">
                    <Row>
                      <Col md={6}>
                        <Form.Select
                          name="room"
                          value={newBooking.room}
                          onChange={handleInputChange}
                          className="mb-3"
                        >
                          <option value="">Select a room</option>
                          {rooms.map((room) => (
                            <option key={room.id} value={room.name}>
                              {room.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={6}>
                        <Form.Control
                          name="date"
                          placeholder="Date"
                          type="date"
                          value={newBooking.date}
                          onChange={handleInputChange}
                          className="mb-3"
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Control
                          name="startTime"
                          placeholder="Start Time"
                          type="time"
                          value={newBooking.startTime}
                          onChange={handleInputChange}
                          className="mb-3"
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Control
                          name="endTime"
                          placeholder="End Time"
                          type="time"
                          value={newBooking.endTime}
                          onChange={handleInputChange}
                          className="mb-3"
                        />
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Control
                          name="purpose"
                          placeholder="Purpose"
                          type="text"
                          value={newBooking.purpose}
                          onChange={handleInputChange}
                          className="mb-3"
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Control
                          name="name"
                          placeholder="Name"
                          value={newBooking.name}
                          onChange={handleInputChange}
                          className="mb-3"
                        />
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="new-recurring-meeting"
                        label="Recurring Meeting"
                        name="isRecurring"
                        checked={newBooking.isRecurring}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                    {newBooking.isRecurring && (
                      <>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Recurrence Type</Form.Label>
                              <Form.Select
                                name="recurrenceType"
                                value={newBooking.recurrenceType}
                                onChange={handleInputChange}
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
                                name="recurrenceEndDate"
                                type="date"
                                value={newBooking.recurrenceEndDate}
                                onChange={handleInputChange}
                                className="mb-3"
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        {newBooking.recurrenceType === "weekly" && (
                          <Form.Group className="mb-3">
                            <Form.Label>Repeat On</Form.Label>
                            <div className="day-selector">
                              {weekDays.map((day) => (
                                <Form.Check
                                  key={day.id}
                                  type="checkbox"
                                  id={`new-day-${day.id}`}
                                  label={day.name}
                                  name="recurrenceDays"
                                  value={day.id}
                                  checked={newBooking.recurrenceDays.includes(
                                    day.id
                                  )}
                                  onChange={handleInputChange}
                                  inline
                                />
                              ))}
                            </div>
                          </Form.Group>
                        )}
                      </>
                    )}
                    <Button
                      variant="primary"
                      onClick={createBooking}
                      className="action-button"
                    >
                      Create Booking
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            )}

            <Card className="admin-card">
              <Card.Header className="card-header">All Bookings</Card.Header>
              <Card.Body>
                <Table striped hover responsive className="admin-table">
                  <thead>
                    <tr>
                      <th>Room</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Name</th>
                      <th>Purpose</th>
                      <th>Recurrence</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td>{b.room}</td>
                        <td>{new Date(b.date).toLocaleDateString("vi")}</td>
                        <td>
                          {b.startTime} - {b.endTime}
                        </td>
                        <td>{b.name}</td>
                        <td>{b.purpose}</td>
                        <td>{formatRecurrenceInfo(b)}</td>
                        <td className="actions-cell">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => startEditing(b)}
                            className="action-button me-2"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => deleteBooking(b.id, b.roomId)}
                            className="action-button"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      </Container>
    </AuthGuard>
  );
};

export default AdminDashboard;
