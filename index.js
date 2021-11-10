const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const admin = require("firebase-admin");


var serviceAccount = require("./doctors-portal-a687d-firebase-adminsdk-dp18h-4886f769c0.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


async function verify (req, res, next){

    if(req.headers?.authorization?.startsWith('Bearer ')){
        const token = req.headers.authorization.split(' ')[1];

        try{
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch{

        }
    }

    next();
}




const port = process.env.PORT || 4000;


//MIDDLEWARE
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a65gj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


const database = client.db("doctorsPortal_db");
const doctorsCollection = database.collection("doctors");
const appointmentsCollection = database.collection("appointments");
const usersAppointmentsCollection = database.collection('usersAppointments');
const usersCollection = database.collection('users');




async function run(){
    try{
        await client.connect();

        //post doctor:
        app.post('/doctors', async(req, res)=>{
            const doctor = req.body;
            const result = await doctorsCollection.insertOne(doctor);
            res.json(result);
        })
        //get doctors:
        app.get('/doctors', async(req, res)=>{
            const cursor = doctorsCollection.find({});
            const result = await cursor.toArray();
            res.send(result);
        })

        //post appointment:
        app.post('/appointments', async(req, res)=>{
            const appointment = req.body;
            const result = await appointmentsCollection.insertOne(appointment);
            res.json(result);
        })
        //get appointments:
        app.get('/appointments', async(req, res)=>{
            const cursor = appointmentsCollection.find({});
            const result = await cursor.toArray();
            res.send(result);
        })

        //post new user:
        app.post('/users', async(req, res)=> {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        })
        //get users:
        app.get('/users', async(req, res)=> {
            const cursor = usersCollection.find({});
            const query = await cursor.toArray();
            res.send(query);
        })
        //put user:
        app.put('/users', async(req, res) =>{
            const user = req.body;
            const filter = {email: user.email};
            const options = {upsert: true};
            const updateDoc = {$set: user};
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        })
        // update a user as admin:
        app.put('/users/admin', verify, async(req, res)=>{
            const user = req.body;
            const requester = req.decodedEmail;
            if(requester){
                const requesterAccount = await usersCollection.find({email: requester});
                if(requesterAccount.role === 'admin'){
                console.log(user);
                const filter = {email: user.email};
                const updateDoc = {$set: {role: 'admin'}};
                const result = await usersCollection.updateOne(filter, updateDoc);
                res.json(result);
                }
            }
            else{
                res.status(401).json({authorization: 'failed'})
            }
            
        })

        //admin check:
        app.get('/users/admin/:email', async(req, res)=>{
            const email = req.params.email;
            const query = {email: email};
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if(user?.role === 'admin'){
                isAdmin = true;
            }
            res.send({admin: isAdmin});
        })

        //post users appointments:
        app.post('/allAppointments', async(req, res) =>{
            const userAppointment = req.body;
            const result = await usersAppointmentsCollection.insertOne(userAppointment);
            res.json(result);
        })
        //get users appointments by email:
        app.get('/allAppointments', verify, async(req, res) =>{
            const email = req.query.email;
            const date = new Date(req.query.date).toLocaleDateString();
            const query = {email: email, date: date};
            const cursor = usersAppointmentsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

    }
    finally{
        // await client.close();
    }
}

run().catch(console.dir);


app.get('/', (req, res) =>{
    res.send('doctors portal server running');
})

app.listen(port, () =>{
    console.log('doctors portal server at port ', port);
})
