// server.js - Node.js Backend with Express and JWT for Authentication

const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your-secret-key'; // Change this to a secure key

app.use(bodyParser.json());
app.use(cors());

// Simulated database
let patients = [];
let appointments = [];
let doctors = [
    { id: 1, name: 'Dr. Adekunle Okafor', specialty: 'Cardiology' },
    // Add more doctors...
];

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = decoded;
        next();
    });
};

// Admin Login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    // Simulate check - replace with real DB check
    if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '4h' });
        res.json({ token });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Verify Token
app.get('/api/admin/verify', verifyToken, (req, res) => {
    res.json({ username: req.user.username });
});

// Get Dashboard Data
app.get('/api/admin/dashboard', verifyToken, (req, res) => {
    // Simulate data
    res.json({
        totalPatients: patients.length,
        appointmentsToday: appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length,
        availableDoctors: doctors.length,
        newEnquiries: 2, // Simulate
        appointmentTrends: { labels: ['Mon', 'Tue'], data: [5, 10] },
        topSpecializations: [{ name: 'Cardiology', appointments: 10, percentage: 40 }],
        recentAppointments: appointments.slice(-5)
    });
});

// Get Patients
app.get('/api/admin/patients', verifyToken, (req, res) => {
    // Simulate stats
    res.json({
        total: patients.length,
        newThisWeek: 5, // Simulate
        returnRate: 60, // Simulate
        patients
    });
});

// Get Appointments
app.get('/api/admin/appointments', verifyToken, (req, res) => {
    res.json(appointments);
});

// Update Appointment Status
app.patch('/api/admin/appointments/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const apt = appointments.find(a => a.id === id);
    if (apt) {
        apt.status = status;
        res.json({ success: true });
    } else {
        res.status(404).json({ message: 'Appointment not found' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// To run: node server.js
// Note: Install dependencies: npm init -y; npm i express jsonwebtoken body-parser cors