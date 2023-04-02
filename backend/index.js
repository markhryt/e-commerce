const express = require('express');
const passport = require('passport')
const Sequalize = require('sequelize');
const bodyParser = require('body-parser');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const Orders = require('./models/orders');
const Customers = require('./models/customers');
const Products = require('./models/products');
const Categories = require('./models/categories');
const Order_details = require('./models/order_details');
let cart = [];

const port  = 3000;
const app = express();





app.set('view-engine', 'ejs')



app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


passport.use(new LocalStrategy({
    usernameField: 'email', // Specify the field used as username
    passwordField: 'password', // Specify the field used as password
  }, async (email, password, done) => {
    try {
      const user = await Customers.findOne({ where: { email } });
  
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
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
  
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
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


  app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    req.login(req.user, function(err) {
      if (err) { return next(err); }
      req.session.userId = req.user.id;
      return res.redirect('/'); 
    });
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


app.get('/api/orders', function ( req, res){
    Orders.findAll().then((orders)=>{
        res.json(orders);
    })
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

app.get('/dashboard', passport.authenticate('local', { session: false }), (req, res) => {
    res.json({ message: 'You are authenticated.' });
  });


  app.get('/username', async (req, res) => {
    if (req.isAuthenticated()) {
      let userId = req.session.userId;
      let customer = await Customers.findByPk(userId)
      res.json({userName: customer} )
    }
      else {
      res.json( {userName: 'Customer'});
    }
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

