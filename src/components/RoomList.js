import { useEffect, useState } from "react";
import { ListGroup, Spinner } from "react-bootstrap";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

const RoomList = ({ onSelect }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const snap = await getDocs(collection(db, "rooms"));
        const roomList = snap.docs.map((doc) => doc.data().name);
        setRooms(roomList);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  if (loading) {
    return <Spinner animation="border" variant="primary" />;
  }

  return (
    <ListGroup>
      {rooms.map((room) => (
        <ListGroup.Item key={room} action onClick={() => onSelect(room)}>
          {room}
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default RoomList;
