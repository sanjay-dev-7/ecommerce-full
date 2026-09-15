const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
            minlength: 6,
            select: false, // Ensures password is not returned in API responses by default
        },
        role: {
            type: String,
            enum: ['Customer', 'Admin'],
            default: 'Customer',
        },
    },
    { timestamps: true }
);

// Encrypt password before saving to the database
userSchema.pre('save', async function (next) {
    // If password isn't modified, skip hashing
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);