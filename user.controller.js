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
    if(ExsistingUser){
        return res.status(400).json({message:"User already exists"});
    }
//Hash the password
    const hashedpass = bcrypt.hash(password,8);

//Create new user
    const newUser = new User({
        username:username,
        password:hashedpass,
    })

    await newUser.save();

    return res.status(200).json({message:"User registered successfully"});
})