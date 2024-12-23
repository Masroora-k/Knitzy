const User = require('../models/userSchema');


const userAuth = (req,res,next)=>{
    const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

    console.log(userId)
    if(userId){
        User.findById(userId)
      
        .then(data =>{
            console.log('User found:',data.name);
            if(data && !data.isBlocked){
                next();
            }else{
                console.log('No user found with this ID:', userId);
                res.redirect('/login');
            }
        })
        .catch(error =>{
            console.log('Error in user auth middleware',error);
            res.status(500).send('Internal Server Error');
            
        })
    }else {
        res.redirect('/login');
        console.log('Error in auth.js');
        
    }
}


const adminAuth = (req,res,next)=>{
  const admin = req.session.admin;
  console.log('admin: ',admin);

    if(admin){
        User.findOne({isAdmin:true})
    .then(data =>{
        console.log('Admin: ',data)
        if(data){
            next();
        }else{
            res.redirect('/admin/login');
        }
    })
    .catch(error =>{
        console.log('Error in adminAuth middleware',error);
        res.status(500).send('Internal Server Error');
        
    })
    }else{
        res.redirect('/admin/login');
        console.log('/Error in auth')
    }
}



module.exports = {
    userAuth,
    adminAuth,
    
}