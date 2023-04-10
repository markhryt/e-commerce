const express = require('express');
const passport = require('passport')
const Sequalize = require('sequelize');
const bodyParser = require('body-parser');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid')
const cookieParser = require('cookie-parser');;
const cors= require('cors');

const Orders = require('./models/orders');
const Customers = require('./models/customers');
const Products = require('./models/products');
const Categories = require('./models/categories');
const Order_details = require('./models/order_details');
const { json } = require('body-parser');
let cart = [];

const port  = 3000;
const app = express();
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));




app.use(cookieParser('session'));


app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  secret: 'session',
  resave: false,
  saveUninitialized: false,
  cookie:{
    secure: false,
    sameSite: 'none',
    maxAge: 1000*60*60*24
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser('session'))


passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },async (email, password, done) => {
    try {
      const user = await Customers.findOne({ where: { email: email } });
  
      // If user does not exist
      if (!user) {
        return done(null, false, { message: 'Incorrect email.' });
      }
  
      // Compare password hash
      const isMatch = await bcrypt.compare(password, user.password.toString());
  
      // If password does not match
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }
  
      // If everything is correct, return the user object
      console.log('all correct1')
      console.log(user.id)
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

  
passport.serializeUser((user, done) => {
  console.log('all correct 2')
  console.log(user.id)
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  console.log('all correct 3')
  try {
    const user = await Customers.findByPk(id);

    if (!user) {
      return done(null, false, { message: 'Incorrect user ID.' });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
});

app.use(express.json());

    //POST METHODS

  app.post('/register', async (req, res) => {
    const { email, full_name, address, password } = req.body;
  
    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Save the new user to the database
      
      const id = uuidv4();

      const user = await Customers.create({
        id,
        email,
        full_name,
        address,
        password: hashedPassword,
      });
  
      // Return the new user object
      // res.json(user);
      res.render('login.ejs')

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error registering new user.' });
    }
  });
 
  app.post('/login',passport.authenticate('local'),
  function(req, res) {
    console.log(req.sessionID);
    res.clearCookie('sessionId')
    res.cookie('sessionId', req.sessionID);
    res.json({message:'hey'})
});
  
  app.post('/add-to-cart', async(req, res)=>{
    const itemId = req.body.product_id;
    const item = await Products.findByPk(itemId)
    cart.push(item)
    res.render('cart.ejs', {cart: cart})
  })

  app.post('/remove-from-cart', async (req, res)=>{
    const itemId = req.body.product_id;
    
    cart = cart.filter((item)=>{
      item.id != itemId
    })
    res.render('cart.ejs', {cart: cart})
  });

  app.post('/categories', async (req, res)=>{
    const categoryId = req.body.category_id;
    const category = await Categories.findByPk(categoryId);
    const products = await Products.findAll({where:{category_id: categoryId}});
    res.render('category.ejs', {category: category.name, products: products})
  });

  app.post('/logout', function(req, res){
    req.logout(function(err) {
      if (err) { return next(err); }
      req.session.destroy(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
    });
  });

  app.post('/checkout', (req, res)=>{
    res.render('checkout.ejs', {cart: cart});
  })
  app.post('/buy', async (req, res)=>{
   let id = uuidv4();
   let amount = cart.length;
   let userId = req.session.userId;
   if(amount>1 && req.isAuthenticated()){
    Orders.create({
      id: id,
      amount: amount,
      customer_id: userId
    });
    res.send('Thank you for purchase')
   }
  res.redirect('/')
  })
    //GET METHODS


app.get('/', function ( req, res){
    
    res.send(req.body)
});

app.get('/api/orders/:id', function ( req, res){
    let id = req.params.id;
    Orders.findByPk(id).then((order)=>{
        if(order){
            res.json(order);
        }else{
            res.status(404).send();
        }
        
    })
});


// app.get('/username', async (req, res) => {
//     console.log(req.cookies)
//     res.status(201).json({userName: "Customer"})
// });

app.get('/username', (req, res) => {
  const sessionId = req.cookies.sessionId;
  req.sessionStore.get(sessionId, (error, session) => {
    if (error) {
          // Handle error
          console.log(error+" error occured")
    }
    if(session){
      let userId = session.passport.user;
      Customers.findByPk(userId).then((user)=>{
        if(user.full_name){
          console.log(user.full_name);
          res.json({userName: user.full_name})
        }else{
          console.log("User not found")
        }
      })
      console.log(userId + '!!!!!!')
    }else{
        console.log("no session found")
    }
      // Use the session data

      
      // Customers.findByPk(session.passport.user).then((user)=>{
      //   if(user.full_name){
      //     res.json({userName: user.full_name})
      //   }else{
      //     res.json({userName: "customer"})
      //   }
      // })
  });
});

  app.get('/login', (req, res)=>{
    res.render('login.ejs');
  });

  app.get('/register', (req, res)=>{
    res.render('register.ejs');
  });

  app.get('/login', (req, res)=>{
    res.render('login.ejs');
  })

  app.get('/products', async (req, res)=>{
    const products = await Products.findAll().then(products => products)
    res.json({products: products});
  })

  app.get('/categories', async (req, res)=>{
    let categories = await Categories.findAll();
    res.render('categories.ejs', {categories: categories});
  })
  app.get('/categories/:categorie', async (req, res)=>{
    let categoryId = req.body.category_id;
    // let category = await Categories.findByPk(categoryId);
    res.json(categoryId);
    // res.render('category.ejs', {category: category});
  })
  app.get('/cart', (req, res)=>{
    res.render('cart.ejs', {cart: cart})
  })

  app.get('/myaccount', async (req, res)=>{
    if(req.isAuthenticated()){
      let userId = req.session.userId;
      let user = await Customers.findByPk(userId);
      res.render('my-account.ejs', {name: user.full_name});
    }else{
      res.redirect('/login');
    }
    
  })

app.listen(port, ()=>{
    console.log('Listening on port ' + port);
});

