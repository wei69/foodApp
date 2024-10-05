const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const Account = require("../Database/account");

const accountSignup = async (req, role, res) => {
  try {
    // Validate if the member name is already taken
    let nameNotTaken = await validateAccountName(req.name);
    if (!nameNotTaken) {
      return res.status(400).json({
        message: `Account name is already registered.`,
      });
    }

    const { name, email  } = req;

    //Check if name and email are empty or contain only whitespace
    if (!name || !email || !name.trim() || !email.trim()) {
      return res.status(400).json({
        message: "Name and email are required fields and cannot be empty.",
      });
    }
// email format // 
const emailFormatRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailFormatRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format. Please provide a valid email address.",
      });
    }

    // Validate if the email is already registered
    let emailNotRegistered = await validateEmail(req.email);
    if (!emailNotRegistered) {
      return res.status(400).json({
        message: `Email is already registered.`,
      });
    }

    // Hash the password
    const password = await bcrypt.hash(req.password, 12);

    // Create a new member instance
    const newAccount = new Account({
      ...req,
      password,
      role,
    });
    

    // Save the new member to the database
    await newAccount.save();
    
    // Send success response
    return res.status(201).json({
      message: "Hurry! You are now successfully registered. Please login.",
    });
  } catch (err) {
    // Handle errors
    return res.status(500).json({
      message: `${err.message}`,
    });
  }
};

const validateAccountName = async (name) => {
  let account = await Account.findOne({ name });
  return account ? false : true;
};

const validateEmail = async (email) => {
  let account = await Account.findOne({ email });
  return account ? false : true;
};

const accountLogin =  async (req, role, res) => {
  let { name, password , email } = req;
  console.log(name, password ,email);
  const account = await Account.findOne({ name });
  if (!account) {
    return res.status(404).json({
      message: "Account name is not found. Invalid login credential",
    });
  }
  if (account.role !== role) {
    return res.status(403).json({
      message: "Please make sure you are logging in from the right role",
    });
  }



  
  if (!name || !password || !name.trim() || !password.trim()) {
    return res.status(400).json({
      message: "name and password are required fields and cannot be empty.",
    });
  }
  let isMatch = await bcrypt.compare(password, account.password);
  if (isMatch) {
    let token = jwt.sign(
      {
        role: account.role,
        name: account.name,
        email: account.email,
      },

      process.env.APP_SECRET,
      { expiresIn: "3 days" }
    );

    let result = {
      name: account.name,
      role: account.role,
      email: account.email,
      token: token,
      expiresIn: 168,
    };

    return res.status(200).json({
      ...result,
      message: "you are now sucessfully login",
    });
  } else {
    return res.status(403).json({
      message: "Incorrect username or password",
    });
  }
};

const accountAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access Denied. No token provided or token is improperly formatted.",
    });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.APP_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        message: "Invalid token.",
      });
    }
    console.log(decoded.name);
    req.name = decoded.name;
    next();
  });
};


const checkRole = (roles) => async (req, res, next) => {
  let { name } = req;
  const account = await Account.findOne({ name });
  if (!roles.includes(account.role)) {
    return res.redirect('/login.html');
  }
  next();
};

module.exports = {
  accountSignup,
  accountLogin,
  accountAuth,
  checkRole,
};
