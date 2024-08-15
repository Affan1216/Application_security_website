const mongoose = require('mongoose');
const express = require('express');
//const bodyParser = require('body-parser');

require ('dotenv').config()

const userRouter = require('./routes/userRouter')

const cors = require('cors');

mongoose.set('strictQuery', true)

mongoose.connect(process.env.DB_CONNECT)
    .then(() => {
        console.log('MongoDB connected...');
    })


const app = express();

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000
const corsOption = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors(corsOption));

app.use('', userRouter)

app.get("/",(req,res)=>{
    return res.status(200).json({
        message: "Congrats. Your web server is running"
    })
})

app.listen(PORT, () =>{
    console.log(`Server started on port ${PORT}`);
    console.log(`Click here to access http://localhost:${PORT}`)
});