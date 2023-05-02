const express = require('express');
const passport = require('passport')
const { Op } = require('sequelize');
const bodyParser = require('body-parser');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid')
const cookieParser = require('cookie-parser');;
const cors= require('cors');
const sequelize = require('./database/database');
const sgMail = require('@sendgrid/mail');

require('dotenv').config();

const Orders = require('./models/orders');
const Customers = require('./models/customers');
const Products = require('./models/products');
const Categories = require('./models/categories');
const Order_details = require('./models/order_details');
const EmailConfirm = require('./models/emailconfirm');

const port  = 3000;
const app = express();
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));




app.use(cookieParser());

app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  secret: 'session',
  resave: false,
  saveUninitialized: false,
  cookie:{
    secure: true,
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
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

  
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

app.use(express.json());

    //POST METHODS

  app.post('/register', async (req, res) => {
    try {
      const { email, full_name, address, password } = req.body.userData;
      const {confirmationCode} = req.body;
      let codeForGivenEmail = await EmailConfirm.findByPk(email)
      if(Number(confirmationCode) === codeForGivenEmail.dataValues.code){
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

        res.send(true);
      }else{
        res.send(false);
      }
    }catch (err) {
        res.send(false);
      }

  });
 
  app.post('/login',passport.authenticate('local'),
  function(req, res) {
    res.clearCookie('sessionId');
    res.cookie('sessionId', req.sessionID);
    res.json({message:'You are authorized'});

});
  

  app.post('/categories', async (req, res)=>{
    try{
      const categoryId = req.body.category_id;
      const category = await Categories.findByPk(categoryId);
      const products = await Products.findAll({where:{category_id: categoryId}});
      res.render('category.ejs', {category: category.name, products: products})
    }catch{
      res.send('an error occured')
    }
  });
  app.post('/verifyemail', async (req, res)=>{
    try{
      let email = req.body.email;
      let confirmationCode = Math.floor(Math.random() * 90000) + 10000;
      await EmailConfirm.destroy({
        where:{
          email: email.toString(),
        }
      });
      await EmailConfirm.create({
        email: email.toString(),
        code: confirmationCode,
      });
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = {
        to: email, // Change to your recipient
        from: 'verifyemailforecommerce@gmail.com', // Change to your verified sender
        subject: 'Sending with SendGrid is Fun',
        text: confirmationCode.toString(),
        html: '<strong>Your confirmation code:' + confirmationCode + '</strong>',
    }
      sgMail
      .send(msg)
      .then(() => {
        console.log('Email sent')
      })
      .catch((error) => {
        console.error(error)
      })
    }catch{
      res.send('failed to check email');
    }

    res.send('success');
  })

  app.post('/logout', (req, res) => {
    // Destroy the session
    res.clearCookie("sessionId")
    res.json({message: "Logout"})
  });
  
  app.post('/placeorder', async (req, res)=>{
    try{
      const sessionId = req.cookies.sessionId;
      req.sessionStore.get(sessionId, async (error, session) => {
        if (error) {
              // Handle error
              res.send(error);
        }
        if(session){
          let id = uuidv4();
          let userId = session.passport.user;
          let cart = req.body.cart;
          let amount = cart.length;
              if(amount>0){
                await Orders.create({
                  id: id,
                  amount: amount,
                  customer_id: userId,
                  date: new Date().toISOString().slice(0, 10)
                });
                await cart.forEach((item)=>{
                  Order_details.create({
                    id: uuidv4(),
                    product_id: item.id,
                    order_id: id
                  })
                })
                res.send('Thank you for purchase')
              }
        }else{
            res.send(
              "Something went wrong"
            );
        }
    });
    }catch{
      res.send('an error occured')
    } 
});



    //GET METHODS


app.get('/isLoggedIn', function ( req, res){

  try{
    const sessionId = req.cookies.sessionId;
    req.sessionStore.get(sessionId, (error, session) => {
      if (error) {
            // Handle error
            res.send(error);
      }
      if(session){
        res.send({logged: true})
      }else{
          res.send({
            logged: false})
      }
    });
  }catch{
    res.send('an error occured');
  }
 
});


app.get('/account/accountinfo', function(req, res){
  try{
    const sessionId = req.cookies.sessionId;
    req.sessionStore.get(sessionId, (error, session) => {
      if (error) {
            // Handle error
            res.send(error);
      }
      if(session){
        let userId = session.passport.user;
        Customers.findByPk(userId).then((user)=>{
          if(user.full_name){
            res.json({
              userName: user.full_name,
              email: user.email,
              address: user.address
            });
          }else{
            res.send('no info found');
          }
        })
          
      }else{
          res.send('no user found')
      }
    });

  }catch{
    res.send('an error occured');
  }
})

app.get('/account/orders', (req,res)=>{
  try{
    const sessionId = req.cookies.sessionId;
    req.sessionStore.get(sessionId, async (error, session) => {
      if (error) {
          // Handle error
           res.send(error);
      }
      if(session){
        let userId = session.passport.user;
        let orders = await Orders.findAll({where:{
         customer_id: userId
        }})
        res.send(orders);
      }else{
        res.send('no orders found')
      }
  });

  }catch{
    res.send('an error occured');
  }
  
})

app.get('/account/orders/:id', async function ( req, res){
  try{
    let id = req.params.id;
    const order_details = await sequelize.query(`SELECT order_details.id, order_details.order_id, order_details.product_id, products.name
    FROM order_details
    JOIN products ON order_details.product_id = products.id
    WHERE order_id = 	'${id}';`);
    res.send(order_details);
  }catch{
    res.send('an error occured');
  }
    
});




app.get('/username', (req, res) => {
  const sessionId = req.cookies.sessionId;
  req.sessionStore.get(sessionId, (error, session) => {
    if (error) {
          // Handle error
          res.send(error);
          
    }
    if(session){
      let userId = session.passport.user;
      Customers.findByPk(userId).then((user)=>{
        if(user.full_name){
          res.json({
            userName: user.full_name
          })
        }else{
          res.json({userName: "Customer"});
        }
      })
    }else{
        res.json({
          userName: "Customer"});
    }
  });
});


  app.get('/products', async (req, res)=>{
    try{
      const products = await Products.findAll().then(products => products)
      res.json({products: products});
    }catch{
      res.send('an error occured');
    }
  })

    app.get('/categories', async (req, res)=>{
    try{
      const products = await Categories.findAll();
      res.json({products: products});
    }catch{
      res.send('an error occured')
    }
   
  })


  app.get('/:category/getproducts', async (req, res)=>{
    try{
      let {category} = req.params;
      const products = await Products.findAll({where:{
        category_id: category
      }});
      res.json({products: products});
    }catch{
      res.send('an error occured');
    }
  })


  app.get('/products/getproduct/:id', async (req, res)=>{
    try{
      let id = req.params.id;
      Products.findByPk(id).then((product)=>{
        res.json({product: product});
      })
      .catch((err)=>{
        console.log(err);
        res.json([{product: "item not found"}]);
      })
      }catch{
        res.send('an error occured');
      }
  })

  app.get("/products/:name", async (req, res)=>{
    try {
      const searchTerm = req.params.name;
      const results = await Products.findAll({
        where: {
         name: {
            [Op.like]: `%${searchTerm}%`,
          },
        },
      });
    console.log(results);
    res.json({products: results});
  } catch (error) {
    res.json({name: 'name', id: 1});
  }
  })


app.listen(port, ()=>{
    console.log('Listening on port ' + port);
});

