import { useEffect, useState } from "react";
import { auth, provider } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { Button, Alert, Container } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

const allowedEmails = [
  "liencao@kambria.io",
  "tungpham@kambria.io",
  "dung_le@ohmnilabs.com",
];

const AuthGuard = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      if (!allowedEmails.includes(email)) {
        await signOut(auth);
        setError(
          "Access denied. Only authorized staff can access this dashboard."
        );
        return;
      }

      setUser(result.user);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const email = user.email;
        if (allowedEmails.includes(email)) {
          setUser(user);
        } else {
          signOut(auth);
          setError(
            "Access denied. Only authorized staff can access this dashboard."
          );
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!user) {
    return (
      <Container className="d-flex flex-column justify-content-center align-items-center vh-100">
        <h2 className="mb-4">User Login</h2>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        <Button variant="primary" onClick={handleLogin}>
          <FontAwesomeIcon icon={faGoogle} className="me-2" />
          Sign in with Google
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Container className="d-flex justify-content-end p-3">
        <Button variant="outline-secondary" onClick={handleLogout}>
          Logout ({user.email})
        </Button>
      </Container>
      {children}
    </>
  );
};

export default AuthGuard;
