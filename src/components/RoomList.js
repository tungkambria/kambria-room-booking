import { useEffect, useState } from "react";
import { ListGroup, Spinner, Badge } from "react-bootstrap";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDoorOpen } from "@fortawesome/free-solid-svg-icons";
import "./RoomList.css";

const RoomList = ({ onSelect }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const snap = await getDocs(collection(db, "rooms"));
        const roomList = snap.docs.map((doc) => ({
          name: doc.data().name,
          docId: doc.id,
        }));
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
    return (
      <div className="loading-spinner">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="room-list-container">
      <h4 className="section-title">Available Rooms</h4>
      <ListGroup>
        {rooms.map((room) => (
          <ListGroup.Item
            key={room.docId}
            action
            onClick={() => onSelect(room)}
            className="room-item"
          >
            <div className="room-item-content">
              <FontAwesomeIcon icon={faDoorOpen} className="me-2" />
              <span className="room-name">{room.name}</span>
              <Badge bg="primary" className="availability-badge">
                Available
              </Badge>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
};

export default RoomList;
