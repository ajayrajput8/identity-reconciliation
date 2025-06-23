import React, { useState } from "react";
import './index.css'
import axios from "axios";

function App() {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    try {
      const res = await axios.post("http://localhost:4000/identify", {
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
  <div className="container">
    <h2 className="heading">Identity Reconciliation</h2>

    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label className="form-label">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          className="form-input"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Phone Number</label>
        <input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter phone number"
          className="form-input"
        />
      </div>
      <button type="submit" className="submit-btn">Identify</button>
    </form>

    {error && <p className="error">{error}</p>}

    {result && (
      <div className="result-box">
        <h4 className="result-heading">Identity Result</h4>
        <p><span className="label">Primary Contact ID:</span> {result.primaryContactId}</p>
        <p><span className="label">Emails:</span> {result.emails.join(", ")}</p>
        <p><span className="label">Phone Numbers:</span> {result.phoneNumbers.join(", ")}</p>
        <p><span className="label">Secondary Contact IDs:</span> {result.secondaryContactIds.join(", ")}</p>
      </div>
    )}
  </div>
);

}

export default App;

