import { Navbar, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <Navbar bg="dark" variant="dark">
      <Container>
        <Navbar.Brand>
          <Link className="text-white text-decoration-none" to="/">
            Kambria Meeting Room Booking
          </Link>
        </Navbar.Brand>
      </Container>
    </Navbar>
  );
};
export default Header;
