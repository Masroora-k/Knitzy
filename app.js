const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();
const session = require('express-session');
const passport = require('./config/passport');
const db= require('./config/db');
const userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');
const morgan = require('morgan');
const csrf = require('csrf');
const csrfTokens = new csrf();
db();


app.use(morgan('dev'));


app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 72*60*60*1000
    }
}))

app.use(passport.initialize());
app.use(passport.session());

// CSRF Middleware
app.use((req, res, next)=>{
    if (req.path.startsWith('/admin')) {
        return next(); // Skip CSRF for admin routes
    }

    if(!req.session.csrfSecret){
        req.session.csrfSecret = csrfTokens.secretSync();
    }
    res.locals.csrfToken = csrfTokens.create(req.session.csrfSecret);
    next();
})
// CSRF validation for POST requests 
app.use((req, res, next) => {
    if (req.method === 'POST' && !req.path.startsWith('/admin')) {
        const csrfTokenFromBody = req.body._csrf;
        if (!csrfTokens.verify(req.session.csrfSecret, csrfTokenFromBody)) {
            return res.status(403).send('CSRF token mismatch');
        }
    }
    next();
});

app.use((req,res,next)=>{
    res.set('cache-control','no-store');
    next();
})
     
app.set("view engine","ejs");
app.set("views",[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin')]);
app.use(express.static(path.join(__dirname,'public')));


app.use('/',userRouter);
app.use('/admin',adminRouter);


const PORT = 3000 || process.env.PORT;
app.listen(PORT, ()=> console.log('Server running'));


module.exports = app;