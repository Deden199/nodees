import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    xrplWallet: {
        address: { type: String, required: true },
        secret: { type: String, required: true }, // IMPORTANT: Encrypt this in production!
    },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);