//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');
const e = require('express');
const { redirect } = require('express/lib/response');

const homeStartingContent = "Neuralink Corporation is a neurotechnology company developing implantable brain-machine interfaces (BMIs) and was founded by Elon Musk and others. The company's headquarters is in the Pioneer Building in San Francisco sharing offices with OpenAI.Neuralink was launched in 2016 and was first publicly reported in March 2017.";
const aboutContent = "Daily Journal is a simple blog website. You just have to register and then you can compose, update, and delete your article. The website uses MongoDB to store the database. The technology used in the making of this website is ejs, javascript, node js, CSS, and express. The website is kept free to use such that maximum people can use it. If you encounter any issues or bugs you can contact the developer, contacts details are available on the contact page.";
const contactContent = "A very thank you for visiting this website, it means a lot to us. If you have any complaints/suggestions, You can mail us, we will take the required step as fast as we can. If you like my work and wanna connect me on LinkedIn, then a very warm welcome to you.";

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({
  secret: "ourlittlesecret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/blogDB', {useNewUrlParser: true});

const blogSchema = new mongoose.Schema({
  email: String,
  password: String,
  Heading: String,
  writeup: String
});

blogSchema.plugin(passportLocalMongoose);
blogSchema.plugin(findOrCreate);

const blog = mongoose.model('blog', blogSchema);
passport.use(blog.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  blog.findById(id, function(err, user) {
    done(err, user);
  });
});

app.get("/", function(req, res){
  res.render('home');
});

app.get("/login", function(req, res){
  res.render('login');
});

app.get("/register", function(req, res){
  res.render('register');
});

app.get("/home2", function(req, res){
  if(req.isAuthenticated()){
  blog.find({"Heading":{$ne: null}}, function(err, post){
    if(err){
      console.log(err);
    }else{
      if(post){
    res.render("home2", {
      staringContent: homeStartingContent,
      posts: post
      });
    }
    }
  });
  }else{
    res.redirect('/login');
  }
});
app.get("/about", function(req, res){
  res.render('about', {abContent: aboutContent});
});
app.get("/contact", function(req, res){
  res.render('contact', {coContent: contactContent});
});
app.get("/compose", function(req, res){
  if(req.isAuthenticated()){
  res.render('compose');
  }else{
    res.redirect('/login');
  }
});
app.post("/compose", function(req, res){
  const post = {
    title: req.body.postTitle,
    content: req.body.postBody
  };
  const postd = new blog({
    Heading: post.title,
    writeup: post.content
  });
  postd.save(function(err){
    if(!err){
      res.redirect("/home2");
    }
  });
});
app.get("/posts/:postID", function(req, res){
  const requestedPostId = req.params.postID;
  blog.findOne({_id: requestedPostId}, function(err, post){

    res.render("post", {
 
      title: post.Heading,
 
      content: post.writeup,

      ide: requestedPostId
    });
 
  });
});

app.post("/register", function(req, res){

  blog.register({username: req.body.username}, req.body.password, function(err, user){
      if(err){
          console.log(err);
          res.redirect("/register");
      }else{
          passport.authenticate("local")(req, res, function(){
              res.redirect("/home2");
          });
      }
  });
  
  });

  app.post("/login", function(req, res){

    const user = new blog({
        username: req.body.username,
        password: req.body.password
    });
    
    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/home2");
            });
        }
    });
    
  });

app.get("/delete/:ID", function(req, res){
  const requestid = req.params.ID;
  blog.findOneAndDelete({_id: requestid}, function(err){
    if(err){
      console.log(err);
    }
    else{
      res.redirect("/home2");
    }
  });
});

app.get("/update/:id", function(req, res){
  const reqid = req.params.id;
  blog.findOne({_id: reqid}, function(err, post){
    if(err){
      console.log(err);
    }
    else{
     res.render("update", {heading: post.Heading, 
    idname: reqid});
    }
  });
});

app.post("/toupdate/:idn", function(req, res){
  const newbody = req.body.postBody;
  blog.findOneAndUpdate({_id: req.params.idn}, {writeup: newbody},
    function(err){
    if(err){
      console.log(err);
    }
    else{
      res.redirect("/home2");
    }
  });
});

app.get("/logout", function(req, res){

  req.logout();
  res.redirect("/");
});

app.listen(process.env.PORT ||3000, function() {
  console.log("Server started on port 3000");
});
