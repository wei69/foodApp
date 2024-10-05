const mongoose = require("mongoose");
const express = require("express");
const app = express();
const cors = require('cors');
const userRouter = require('./routes/userRouter');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const account = require("./Database/account");

require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: 'http://127.0.0.1:5500',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
};
app.use(cors(corsOptions));

mongoose.set("strictQuery", true);
mongoose.connect(process.env.DB_CONNECT, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("MongoDB connected...");
}).catch(err => {
  console.error("MongoDB connection error:", err);
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
});





// In-memory OTP store
let otpStore = {}; // key: email, value: OTP

// Endpoint to generate and send OTP
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  otpStore[email] = otp;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// Endpoint to verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  const storedOtp = otpStore[email];

  if (storedOtp === otp) {
    delete otpStore[email]; // Remove OTP after successful verification
    res.status(200).json({ message: 'OTP verified successfully' });

  } else {
    res.status(400).json({ message: 'Invalid OTP' });
  }
});




app.post('/request-password-reset', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists in the database
    const user = await account.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Generate a secure token
    const token = crypto.randomBytes(20).toString('hex');

    // Set token expiration time (e.g., 1 hour)
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Create a reset password URL including the token
    const resetUrl = `http://localhost:5000/reset-password?token=${token}`;

    // Create a transporter for sending emails
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // Replace with your email provider
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Compose the email message with HTML content
    const message = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset.</p>
        <p>Click the following link to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    // Send the email
    await transporter.sendMail(message);

    res.status(200).json({ message: 'Password reset link sent to your email' });

  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ message: 'Error processing request' });
  }
});



app.get("/", (req, res) => {
  return res.status(200).json({ 
    message: "Congrats your web server is running!" 
  });
});

app.use("/", userRouter);

const Port = process.env.Port || 3000;
app.listen(Port, () => {
  console.log(`Server is running on port ${Port}`);
});
