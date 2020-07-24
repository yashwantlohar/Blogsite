//jshint esversion:6
const dotenv=require("dotenv");
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const _ = require("lodash");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-yashwant:yash2108@cluster0.ewdsu.mongodb.net/blogDB",{useNewUrlParser:true,useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const postSchema= new mongoose.Schema({
    title:String,
    category:String,
    content:String,
    createdby:String,
    time:String
});
const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    googleId:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User=mongoose.model('User',userSchema);
const Post=mongoose.model('Post',postSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL:"http://localhost:3000/auth/google/secrets",

   },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id },{name:profile.displayName}, function (err, user) {
      return cb(err, user);
    });
  }
));



const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";


app.get("/",function (req,res) {
    res.render("starting-page");
})

app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/blogsite",
  passport.authenticate("google", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/home");
 });

app.get("/home", function(req, res){
    Post.find({},function (err,posts) {
         res.render("home", {startingContent: homeStartingContent,posts: posts});
    });

});







app.get("/login",function (req,res) {
    res.render("login");
});
app.get("/register",function (req,res) {
    res.render("register");
});
app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});

app.get("/compose", function(req, res){
    if(req.isAuthenticated()){
          res.render("compose");
      }else{
          res.redirect("/login");
      }
});

app.post("/compose", function(req, res){
    // console.log(req.user);
  const post = new Post({
      title: req.body.postTitle,
      category:req.body.postCategory,
      content: req.body.postBody,
      createdby:req.user.name
  });
  post.save(function (err) {
      if(!err){
          res.redirect("/home");
      }
  });

});

app.get("/posts/:postId", function(req, res){
  const requestedPostId = req.params.postId;

  Post.findOne({_id:requestedPostId},function (err,post) {
      res.render("post",{title:post.title,category:post.category,content:post.content,createdby:post.createdby});
  });

});

app.get("/delete",function (req,res) {
    console.log(req.body);
});

app.post("/register",function (req,res) {
    User.register({username:req.body.username,useremail:req.body.useremail},req.body.password,function (err , user) {
        if(err){
            console.log(err);
            res.redirect("/register");
        }else {
            passport.authenticate("local")(req,res , function () {
                res.redirect("/home");
            });
        }
    });
});


app.post("/login",function (req,res) {

    const user= new User({
        useremail:req.body.useremail,
        password:req.body.password
    });

    req.login(user,function (err) {
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res , function () {
                res.redirect("/home");
            });
        }
    });

});

app.get("/logout",function (req,res) {
    req.logout();
    res.redirect("/");
});



app.listen(process.env.PORT||3000, function() {
  console.log("Server has started successfully");
});
