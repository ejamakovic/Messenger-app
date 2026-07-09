// AuthPage.tsx

import { useState } from "react";
import { login, register} from "../../services/jwt.service";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import type { RegisterRequest } from "../../models/registerRequest";
import styles from "./AuthPage.module.css";
import type { ValidationError } from "../../models/validationError";

export default function AuthPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const { saveSession } = useAuth();
  const navigate = useNavigate();

  const hasError = (field: string) =>
    errors.some(error => error.field === field);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    try {
      let data;
      if (isRegistering) {
        const registrationData: RegisterRequest = {
          username,
          email,
          password,
          firstName,
          lastName
        };
        data = await register(registrationData);
      } else {
        data = await login(username, password);
      }

      const tokenToUse = data.accessToken;
      saveSession(data.user, tokenToUse);
      navigate("/"); 
    } catch(err:any){

      if(Array.isArray(err.response?.data)){
          setErrors(err.response.data);
      }
      else {
          setErrors([
              {
                  field: "general",
                  message: "An authentication error occurred."
              }
          ]);
      }
  }
};

return (
    <div className={styles.authWrapper}>
      <div className={styles.authCard}>
        <h2>{isRegistering ? "Create an Account" : "Welcome Back"}</h2>
        
        {errors.length > 0 && (
          <div className={styles.errorBanner}>
              <ul>
                  {errors.map((error,index)=>(
                      <li key={index}>
                          <b>{error.field}:</b> {error.message}
                      </li>
                  ))}
              </ul>
          </div>
      )}

        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required
              className={hasError("username") ? styles.inputError : ""}
            />
          </div>

          {isRegistering && (
            <>
              <div className={styles.inputGroup}>
                <label>First Name</label>
                <input 
                  type="text" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  required
                  className={hasError("firstName") ? styles.inputError : ""}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Last Name</label>
                <input 
                  type="text" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  required
                  className={hasError("lastName") ? styles.inputError : ""}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                  className={hasError("email") ? styles.inputError : ""}
                />
              </div>
            </>
          )}

          <div className={styles.inputGroup}>
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              className={hasError("password") ? styles.inputError : ""}
            />
          </div>

          <button type="submit" className={styles.submitBtn}>
            {isRegistering ? "Sign Up" : "Log In"}
          </button>
        </form>

        <button onClick={() => setIsRegistering(!isRegistering)} className={styles.switchModeBtn}>
          {isRegistering ? "Already have an account? Log In" : "Need an account? Register"}
        </button>
      </div>
    </div>
  );
}