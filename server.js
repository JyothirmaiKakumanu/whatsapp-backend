//importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Chats from './sidebarChats.js';
import Pusher from 'pusher';
import cors from 'cors';

//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1207689",
    key: "610a23e5c7eb56b6f9aa",
    secret: "64abe815ee185e253ca7",
    cluster: "ap2",
    useTLS: true
  });

//middlewares
app.use(express.json());
app.use(cors())

app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*')
    res.setHeader('Access-Control-Allow-Headers','*')
    next();
});

//DB config 
const connection_url = 'mongodb+srv://admin:FDL6KfmhOZueCLPK@cluster0.azj9p.mongodb.net/whatsappdb?retryWrites=true&w=majority'

mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection

db.once('open',()=>{
    console.log('DB is connected');
    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();
    changeStream.on('change',(change)=>{
        console.log('A change occured',change);

        if(change.operationType==='insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',
            {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            })
        }else{
            console.log('Error triggering Pusher');
        }
    })
    console.log("end");
});


db.once('open',()=>{
    console.log("chat db entered");
    const chatCollection = db.collection("chats");
    const changeStream = chatCollection.watch();
    changeStream.on('change',(change)=>{
        console.log("A new chat changed",change);
        if(change.operationType==='insert'){
            const chatDetails = change.fullDocument;
            pusher.trigger('newchats','inserted',{
                name: chatDetails.name,
            })
        }else{
            console.log('Error triggering pusher for new chat');
        }
    })
})

//???

//api routes
app.get('/', (req, res) => res.status(200).send('hello world'))

app.get('/messages/sync', (req,res)=>{
    Messages.find((err,data)=>{
        if(err){
            res.status(500).send(err);
        }else{
            res.status(200).send(data);
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body
    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    })

})

app.post('/chats/new',(req,res)=>{
    const dbChat = req.body
    Chats.create(dbChat,(err,data)=>{
        if(err){
            res.status(500).send(err);
        }else{
            res.status(201).send(data);
        }
    })

})

//listen
app.listen(port, () => console.log(`Listening on local host: ${port}`))