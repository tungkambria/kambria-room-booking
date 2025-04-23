import { Navbar, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments } from "@fortawesome/free-solid-svg-icons";
import "./Header.css";

const Header = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="app-header">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <div className="logo-icon me-3">
            <FontAwesomeIcon icon={faComments} size="lg" />
          </div>
          <span className="brand-text">Kambria Meeting Room Booking</span>
        </Navbar.Brand>
      </Container>
    </Navbar>
  );
};

export default Header;
