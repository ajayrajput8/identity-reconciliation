//IMPORTS :
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require('cors');
const connectDB = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());


// DATABASE CONNECTION :
connectDB();

// MODEL SCHEMA :
const contactSchema = new mongoose.Schema({
  phoneNumber: String,
  email: String,
  linkedId: mongoose.Schema.Types.ObjectId,
  linkPrecedence: {
    type: String,
    enum: ["primary", "secondary"],
    default: "primary"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: Date
});

contactSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Contact = mongoose.model("Contact", contactSchema);

// FUNCTIONALITY:
app.post("/identify", async (req, res) => {
  const { email, phoneNumber } = req.body;

  // If email or phoneNumber is missing ->
  if (!email && !phoneNumber) {
    return res.status(400).json({ error: "Email or phoneNumber required" });
  }

  try {
    // Finding user in database
    const contacts = await Contact.find({
      $or: [
        { email: email },
        { phoneNumber: phoneNumber }
      ]
    }).sort({ createdAt: 1 });

    // User found
    if(contacts.length !==0 ){
      console.log("User Found")
    }


    // Find matching contacts by email or phone number :
    if (contacts.length === 0) {
      const newContact = await Contact.create({ email, phoneNumber });
      console.log("User Created Successfully");
      return res.json({
        primaryContactId: newContact._id,
        emails: [newContact.email].filter(Boolean),
        phoneNumbers: [newContact.phoneNumber].filter(Boolean),
        secondaryContactIds: []
      });
    }

    // Determine the primary contact
    let primary = contacts.find(c => c.linkPrecedence === "primary") || contacts[0];

    // Update other "primary" contacts to "secondary"
    for (let c of contacts) {
      if (c._id.toString() !== primary._id.toString() && c.linkPrecedence === "primary") {
        c.linkPrecedence = "secondary";
        c.linkedId = primary._id;
        await c.save();
      }
    }

    // Get all contacts linked to the primary
    const allLinked = await Contact.find({
      $or: [
        { _id: primary._id },
        { linkedId: primary._id }
      ]
    });

    // Prepare sets of existing emails and phone numbers
    const existingEmails = new Set(allLinked.map(c => c.email).filter(Boolean));
    const existingPhones = new Set(allLinked.map(c => c.phoneNumber).filter(Boolean));

    // Add new secondary contact if new info is provided
    if ((email && !existingEmails.has(email)) || (phoneNumber && !existingPhones.has(phoneNumber))) {
      await Contact.create({
        email,
        phoneNumber,
        linkedId: primary._id,
        linkPrecedence: "secondary"
      });
    }

    // Fetch updated contacts
    const updatedContacts = await Contact.find({
      $or: [
        { _id: primary._id },
        { linkedId: primary._id }
      ]
    });

    // Build the response
    const response = {
      primaryContactId: primary._id,
      emails: [...new Set(updatedContacts.map(c => c.email).filter(Boolean))],
      phoneNumbers: [...new Set(updatedContacts.map(c => c.phoneNumber).filter(Boolean))],
      secondaryContactIds: updatedContacts
        .filter(c => c.linkPrecedence === "secondary")
        .map(c => c._id)
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(4000, () => console.log("Server running on port 4000"));
