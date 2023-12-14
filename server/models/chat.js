import mongoose from 'mongoose';
mongoose.set('strictQuery', false);


const url = "mongodb+srv://SirBillyBobJoe:hoanh2005@cluster0.8ts8the.mongodb.net/chats?retryWrites=true&w=majority";
console.log('connecting to', url);

mongoose.connect(url)
    .then(result => {
        console.log('connected to MongoDB');
    })
    .catch((error) => {
        console.log('error connecting to MongoDB:', error.message);
    });


const messageSchema = new mongoose.Schema({
    name:String,
    time: Date,
    text: String,

});


const chatSchema = new mongoose.Schema({
    name: String,
    messages: [messageSchema] ,
    owner:String
});

chatSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

export const Chat = mongoose.model('Chat', chatSchema);
export const Message = mongoose.model('Message', messageSchema);