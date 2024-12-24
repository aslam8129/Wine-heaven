const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');

const connectDB = require('./config/db');
const passport = require('passport');

require('./config/passport')(passport);

const authRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const googleRoutes = require('./routes/googleAuthRoutes');
const isuser = require('./middlware/user')
const isadmin = require('./middlware/admin')

const path = require('path');
const nocache = require('nocache');

const app = express();
connectDB();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(flash());
app.use(nocache());
app.use(express.json());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success');
    res.locals.error_msg = req.flash('error');
    next();
});

app.use(passport.initialize());
// app.use(passport.session());
app.use('/auth', googleRoutes);
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/category', categoryRoutes);
app.use(isuser)
app.use(isadmin)

app.use('*',(req,res)=>{
    res.render('user/404')
})

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`Server started on port http://localhost:${PORT}`));
   