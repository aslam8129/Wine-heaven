const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const passport = require('passport')
require('./config/passport')(passport);

const authRoutes = require('./routes/userRoutes');
const admin   = require('./routes/adminRoutes')
const Category = require('./routes/categoryRoutes');
const google = require('./routes/googleAuthRoutes')
const path = require('path')
const nocache = require('nocache');

const app = express();
connectDB();
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } 
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));
app.set('views', path.join(__dirname, 'views'));








app.use(flash());
app.use(nocache())

  

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success');
    res.locals.error_msg = req.flash('error');
    next();
});   
      
app.use(passport.initialize())
// app.use(passport.session())
app.use('/auth',google)

app.use('/', authRoutes);
app.use('/admin',admin);
app.use('/category',Category); 


const PORT =process.env.PORT||3003;
app.listen(PORT, () => console.log(`Server started on port http://localhost:${PORT}`));
