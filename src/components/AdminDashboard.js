import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  Container,
  Tabs,
  Tab,
  Form,
  Button,
  Card,
  Table,
  Badge,
  Alert,
} from "react-bootstrap";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [newBooking, setNewBooking] = useState({
    room: "",
    date: "",
    startTime: "",
    endTime: "",
    name: "",
    approved: false,
  });
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
    const snap = await getDocs(collection(db, "bookings"));
    setBookings(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchBookings();
    fetchRooms();
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
      await updateDoc(doc(db, "rooms", id), { name: editedRoomName.trim() });
      setEditingRoomId(null);
      fetchRooms();
      showNotification("Room updated successfully");
    } catch (error) {
      showNotification("Error updating room", "danger");
      console.error("Error updating room:", error);
    }
  };

  const deleteRoom = async (id) => {
    try {
      await deleteDoc(doc(db, "rooms", id));
      fetchRooms();
      showNotification("Room deleted successfully");
    } catch (error) {
      showNotification("Error deleting room", "danger");
      console.error("Error deleting room:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBooking((prev) => ({ ...prev, [name]: value }));
  };

  const createBooking = async () => {
    try {
      await addDoc(collection(db, "bookings"), newBooking);
      fetchBookings();
      setNewBooking({
        room: "",
        date: "",
        startTime: "",
        endTime: "",
        name: "",
        approved: false,
      });
      showNotification("Booking created successfully");
    } catch (error) {
      showNotification("Error creating booking", "danger");
      console.error("Error creating booking:", error);
    }
  };

  const toggleApproval = async (id, approved) => {
    try {
      await updateDoc(doc(db, "bookings", id), { approved: !approved });
      fetchBookings();
      showNotification(`Booking ${approved ? "unapproved" : "approved"}`);
    } catch (error) {
      showNotification("Error updating booking", "danger");
      console.error("Error updating booking:", error);
    }
  };

  const deleteBooking = async (id) => {
    try {
      await deleteDoc(doc(db, "bookings", id));
      fetchBookings();
      showNotification("Booking deleted successfully");
    } catch (error) {
      showNotification("Error deleting booking", "danger");
      console.error("Error deleting booking:", error);
    }
  };

  return (
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
                  Add Room
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
                            onChange={(e) => setEditedRoomName(e.target.value)}
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
          <Card className="mb-4 admin-card">
            <Card.Header className="card-header">
              Create New Booking
            </Card.Header>
            <Card.Body>
              <Form className="booking-form">
                <div className="form-row">
                  <Form.Control
                    name="room"
                    placeholder="Room"
                    value={newBooking.room}
                    onChange={handleInputChange}
                    className="mb-3"
                  />
                  <Form.Control
                    name="date"
                    placeholder="Date"
                    type="date"
                    value={newBooking.date}
                    onChange={handleInputChange}
                    className="mb-3"
                  />
                </div>
                <div className="form-row">
                  <Form.Control
                    name="startTime"
                    placeholder="Start Time"
                    type="time"
                    value={newBooking.startTime}
                    onChange={handleInputChange}
                    className="mb-3"
                  />
                  <Form.Control
                    name="endTime"
                    placeholder="End Time"
                    type="time"
                    value={newBooking.endTime}
                    onChange={handleInputChange}
                    className="mb-3"
                  />
                </div>
                <div className="form-row">
                  <Form.Control
                    name="name"
                    placeholder="Name"
                    value={newBooking.name}
                    onChange={handleInputChange}
                    className="mb-3"
                  />
                  <Button
                    variant="primary"
                    onClick={createBooking}
                    className="action-button"
                  >
                    Create Booking
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

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
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>{b.room}</td>
                      <td>{new Date(b.date).toLocaleDateString()}</td>
                      <td>
                        {b.startTime} - {b.endTime}
                      </td>
                      <td>{b.name}</td>
                      <td>
                        <Badge bg={b.approved ? "success" : "warning"}>
                          {b.approved ? "Approved" : "Pending"}
                        </Badge>
                      </td>
                      <td className="actions-cell">
                        <Button
                          size="sm"
                          variant={
                            b.approved ? "outline-warning" : "outline-success"
                          }
                          onClick={() => toggleApproval(b.id, b.approved)}
                          className="me-2 action-button"
                        >
                          {b.approved ? "Unapprove" : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => deleteBooking(b.id)}
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
  );
};

export default AdminDashboard;
