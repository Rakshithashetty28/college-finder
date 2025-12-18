const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 3000;
const JWT_SECRET = "your_secret_key";

// Connect MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/collegeDB')
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// College Schema
const CollegeSchema = new mongoose.Schema({
  name: String,
  course: String,
  location: String,
  contact: String,
  image: String
});
const College = mongoose.model('College', CollegeSchema);

// Admin credentials (static)
const adminEmail = "admin@example.com";
const adminPassword = "admin123";

// ================== LOGIN ==================
app.post('/admin/login', (req,res)=>{
  const {email, password} = req.body;
  if(email === adminEmail && password === adminPassword){
    const token = jwt.sign({email}, JWT_SECRET, {expiresIn: '1h'});
    return res.json({success:true, token});
  }
  res.json({success:false, message:"Invalid admin credentials"});
});

// Middleware to check token
function auth(req,res,next){
  const token = req.headers['authorization'];
  if(!token) return res.status(401).json({message:"No token provided"});
  jwt.verify(token, JWT_SECRET, (err, decoded)=>{
    if(err) return res.status(401).json({message:"Invalid token"});
    req.admin = decoded;
    next();
  });
}

// ================== ADD COLLEGE ==================
app.post('/admin/addCollege', auth, async (req,res)=>{
  try{
    const college = new College(req.body);
    await college.save();
    res.json({success:true});
  }catch(err){ res.status(500).json({success:false, message:err.message}); }
});

// ================== EDIT COLLEGE ==================
app.put('/admin/editCollege/:id', auth, async (req,res)=>{
  try{
    await College.findByIdAndUpdate(req.params.id, req.body);
    res.json({success:true});
  }catch(err){ res.status(500).json({success:false, message:err.message}); }
});

// ================== DELETE COLLEGE ==================
app.delete('/admin/deleteCollege/:id', auth, async (req,res)=>{
  try{
    await College.findByIdAndDelete(req.params.id);
    res.json({success:true});
  }catch(err){ res.status(500).json({success:false, message:err.message}); }
});

// ================== GET ALL COLLEGES ==================
app.get('/colleges', async (req,res)=>{
  const colleges = await College.find({});
  res.json(colleges);
});

app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`));
