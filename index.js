const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');



const port = process.env.PORT || 4000;


//MIDDLEWARE
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a65gj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


const database = client.db("doctorsPortal_db");
const doctorsCollection = database.collection("doctors");
const appointmentsCollection = database.collection("appointments");




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
