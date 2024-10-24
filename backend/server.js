// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());


const MONGODB_URI = 'mongodb://localhost:27017/crm_database';


// MongoDB Connection with detailed options and error handling
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => {
    console.log('Successfully connected to MongoDB via Compass');
    console.log('Database Name:', mongoose.connection.name);
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if unable to connect
});

// Monitor MongoDB connection
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

// Customer Schema with timestamps
const customerSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Customer name is required'],
        trim: true
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: { 
        type: String, 
        required: [true, 'Phone number is required'],
        trim: true
    },
    status: { 
        type: String, 
        required: true,
        enum: ['active', 'inactive', 'pending']
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

const Customer = mongoose.model('Customer', customerSchema);

// Routes with better error handling
// Get all customers
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ 
            message: 'Error fetching customers',
            error: error.message 
        });
    }
});

// Add new customer
app.post('/api/customers', async (req, res) => {
    try {
        const customer = new Customer(req.body);
        const newCustomer = await customer.save();
        res.status(201).json(newCustomer);
    } catch (error) {
        console.error('Error adding customer:', error);
        if (error.code === 11000) { // Duplicate key error
            res.status(400).json({ 
                message: 'Email already exists',
                error: error.message 
            });
        } else {
            res.status(400).json({ 
                message: 'Error adding customer',
                error: error.message 
            });
        }
    }
});


// Delete customer
app.delete('/api/customers/:id', async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ 
            message: 'Error deleting customer',
            error: error.message 
        });
    }
});

// Update customer
app.put('/api/customers/:id', async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json(customer);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(400).json({ 
            message: 'Error updating customer',
            error: error.message 
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));