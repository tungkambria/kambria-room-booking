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
  Row,
  Col,
  Form,
  Button,
  Card,
  Table,
} from "react-bootstrap";

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
    if (!newRoom.trim()) return;
    await addDoc(collection(db, "rooms"), { name: newRoom.trim() });
    setNewRoom("");
    fetchRooms();
  };

  const updateRoom = async (id) => {
    if (!editedRoomName.trim()) return;
    await updateDoc(doc(db, "rooms", id), { name: editedRoomName.trim() });
    setEditingRoomId(null);
    fetchRooms();
  };

  const deleteRoom = async (id) => {
    await deleteDoc(doc(db, "rooms", id));
    fetchRooms();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBooking((prev) => ({ ...prev, [name]: value }));
  };

  const createBooking = async () => {
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
  };

  const toggleApproval = async (id, approved) => {
    await updateDoc(doc(db, "bookings", id), { approved: !approved });
    fetchBookings();
  };

  const deleteBooking = async (id) => {
    await deleteDoc(doc(db, "bookings", id));
    fetchBookings();
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Admin Dashboard</h2>
      <Card className="mb-4">
        <Card.Header>Manage Rooms</Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col xs={8}>
              <Form.Control
                placeholder="New room name"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
              />
            </Col>
            <Col>
              <Button onClick={createRoom}>Add Room</Button>
            </Col>
          </Row>
          <Table striped bordered hover responsive>
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
                  <td>
                    {editingRoomId === room.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => updateRoom(room.id)}
                          className="me-2"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingRoomId(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="warning"
                          className="me-2"
                          onClick={() => {
                            setEditingRoomId(room.id);
                            setEditedRoomName(room.name);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => deleteRoom(room.id)}
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
      <Card className="mb-4">
        <Card.Header>Create New Booking</Card.Header>
        <Card.Body>
          <Form>
            <Row>
              <Col>
                <Form.Control
                  name="room"
                  placeholder="Room"
                  value={newBooking.room}
                  onChange={handleInputChange}
                  className="mb-2"
                />
              </Col>
              <Col>
                <Form.Control
                  name="date"
                  placeholder="Date"
                  type="date"
                  value={newBooking.date}
                  onChange={handleInputChange}
                  className="mb-2"
                />
              </Col>
              <Col>
                <Form.Control
                  name="startTime"
                  placeholder="Start Time"
                  type="time"
                  value={newBooking.startTime}
                  onChange={handleInputChange}
                  className="mb-2"
                />
              </Col>
              <Col>
                <Form.Control
                  name="endTime"
                  placeholder="End Time"
                  type="time"
                  value={newBooking.endTime}
                  onChange={handleInputChange}
                  className="mb-2"
                />
              </Col>
              <Col>
                <Form.Control
                  name="name"
                  placeholder="Name"
                  value={newBooking.name}
                  onChange={handleInputChange}
                  className="mb-2"
                />
              </Col>
              <Col>
                <Button variant="primary" onClick={createBooking}>
                  Create
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>Bookings</Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Room</th>
                <th>Date</th>
                <th>Time</th>
                <th>Name</th>
                <th>Approved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.room}</td>
                  <td>{b.date}</td>
                  <td>
                    {b.startTime} - {b.endTime}
                  </td>
                  <td>{b.name}</td>
                  <td>{b.approved ? "✅" : "❌"}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="warning"
                      onClick={() => toggleApproval(b.id, b.approved)}
                      className="me-2"
                    >
                      Toggle
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deleteBooking(b.id)}
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
    </Container>
  );
};

export default AdminDashboard;
