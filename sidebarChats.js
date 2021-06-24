import mongoose from 'mongoose';

const whatsappChats =mongoose.Schema({
    name: String
});

export default mongoose.model("chats",whatsappChats);