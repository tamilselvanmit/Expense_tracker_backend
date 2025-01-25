// const add = require('./Add.js');

// let arr = [1, 2, 3, 4, 5];
// add(arr);

// const http = require('http');

// const server = http.createServer((req, res) => {
//     res.end('pradeep weds angu');
// });

// const PORT = 5000;

// server.listen(PORT, () => {
//     console.log(Server is running on port ${PORT});
// }); 

// const students = [
//     {id:29,name:"majid",age:25},
//     {id:42,name:"sam",age:20},
//     {id:33,name:"pradeep",age:15},
// ]

const express = require('express');
const app = express();
app.use(express.json());
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const PORT = 8000;

// app.get('/:id', (req, res) => {
//     const { id } = req.params;

//     if (id) {
//         const result = students.find((item) => item.id == id);
//         // res.json(Hello World ${id} and ${name} age is ${age});
//         res.json(Hello World ${result.name} and age is ${result.age});
//     }

//     res.json('Hellooooo World');
// });
const JWT_SECRET = 'your_secret_key';
const mongourl = "mongodb+srv://tamilselvanm2023it:tamilselvanm1234@cluster0.wnvpw.mongodb.net/tracker";      

const expenseSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
});
const expenseModel = mongoose.model('expense', expenseSchema);    

mongoose.connect(mongourl).then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    }); 
}).catch((err) => { 
    console.log(err);
});

app.post("/api/expenses", async (req, res) => {
    const { title, amount } = req.body;
    const newexpense = new expenseModel({
        id: uuidv4(),
        title : title, 
        amount : amount
    });
    const savedexpenses = await newexpense.save();
    res.status(200).json(savedexpenses);
});

//Get all
// app.get("/api/expenses/", async (req, res) => {
//     const expenses = await expenseModel.find().limit();
//     res.status(200).json(expenses);
// });

//Get by Index
app.get("/api/expenses/:index", async (req, res) => {
    const { index } = req.params;
    const expenses = await expenseModel.find().skip(index-1).limit(1);
    res.status(200).json(expenses);
});

//Get by ID
// app.get("/api/expenses/:id", async (req, res) => {
//     const { id } = req.params;
//     const expenses = await expenseModel.find({ id });
//     res.status(200).json(expenses);
// });

app.put("/api/expenses/:id", async (req, res) => {
    try {
        console.log(req.params);
        console.log(req.body);

        const { id } = req.params; 
        const { title, amount } = req.body;

        if (!title || !amount) {
            return res.status(400).json({ message: "Title and amount are required" });
        }

        const updatedExpense = await expenseModel.findOneAndUpdate({ id }, { title, amount });

        if (!updatedExpense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        res.status(200).json(updatedExpense); 
    } catch (error) {
        console.error("Error updating expense:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});


// PATCH /api/expenses/:id
app.patch("/api/expenses/:id", async (req, res) => {
    try {
        const { id } = req.params; // Get the id from the route parameter
        const updateFields = req.body; // Partial fields to update

        if (!updateFields || Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: "No fields to update provided" });
        }

        const updatedExpense = await expenseModel.findOneAndUpdate(
            { id },
            updateFields,
            { new: true } // Return the updated document
        );

        if (!updatedExpense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        res.status(200).json(updatedExpense); // Return the updated expense
    } catch (error) {
        console.error("Error patching expense:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});


// DELETE /api/expenses/:id
app.delete("/api/expenses/:id", async (req, res) => {
    try {
        const { id } = req.params; // Get the id from the route parameter

        const deletedExpense = await expenseModel.findOneAndDelete({ id });

        if (!deletedExpense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        res.status(200).json({ message: "Expense deleted successfully", deletedExpense });
    } catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
});


/Authentication/

//Schema
const userSchema = new mongoose.Schema({
    username: {type:String,required:true,unique:true},
    password:{type:String,required:true},
    });

//Model
const User = mongoose.model("User",userSchema);

//Register api
app.post("/api/user/register",async(req,res)=>{
    const {username,password} = req.body;
//Validation
    if(!username || !password){
        return res.status(400).json({message:"Username is required"});
    }
//Check if user already exists
    const ExsistingUser = await User.find({username});
    if(!ExsistingUser){
        return res.status(400).json({message:"User already exists"});
    }
//Hash the password
    const hashedpass = await bcrypt.hash(password,8);

//Create new user
    const newUser = new User({
        username,
        password:hashedpass,
    })

    await newUser.save();

    return res.status(200).json({message:"User registered successfully"});
})

//Login api
app.post("/api/user/login",async(req,res)=>{
    const {username,password} = req.body;
//Validation
    if(!username || !password){
        return res.status(400).json({message:"Username and password is required"});
    }

//Check if user exists
    const user = await User.findOne({username});
    if(!user){
        return res.status(400).json({message:"User not found"});
    }
//Check if password is correct
    const isPasswordMatch = await bcrypt.compare(password,user.password);
    
    if(!isPasswordMatch){
        return res.status(400).json({message:"Invalid credentials"});
    }

    const token = jwt.sign({username},"Tamil",{expiresIn:"2h"});

    return res.status(200).json(
        {message:"Login successful",
        token:token,
        }
    );
    
})

//midleware to check the jwt 

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    jwt.verify(token, "Tamil", (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Forbidden" });
        }
        req.user = user;
        next();
    });
};
//api to get user details

app.get("/api/user/me",authenticateToken, async (req, res) => {
    const user = await
        
        User.findOne({ username: req.user.username });
    res.status(200).json(user);
}
);