const User = require('../../models/userSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const pageerror = async (req,res)=>{
    
    res.render('admin-error');
}


const loadLogin =  (req,res)=>{

    if(req.session.admin){
        return res.redirect('/');
    }
    res.render('admin-login',{message: null});

}


const login = async (req,res)=>{
    try {

        const {email,password} = req.body;
        const admin = await User.findOne({email,isAdmin:true});
        

        if(admin){
            const passwordMatch = await bcrypt.compare(password,admin.password);
             

            if(!passwordMatch){return res.render('admin-login',{message: 'Incorrect Password'});
               
            }else {
                 req.session.admin = true;
                return res.redirect('/admin');
            }
        }else {
            return res.render('admin-login',{message: 'Admin not found'});
        }
        
    } catch (error) {

        console.error('login error',error);
        return res.redirect('/pageerror')
        
        
    }
}


const loadDashboard = async (req,res)=>{
   
        try {
             
                res.render('dashboard');
             
        } catch (error) {
            console.error('Error in load dashboard: ',error);
            res.redirect('/admin/pageerror');
            
        }
    
}
    

const logout = async (req,res)=>{
    try {  

        req.session.destroy(err =>{
            if(err){
                console.log('Error destroying session',err);
                return res.redirect('/pageerror');
            }
            res.redirect('/admin/login');
        })
        
    } catch (error) {

        console.log('Unexpected error during logout',error);
        res.redirect('/pageerror')
        
    }
}



module.exports = {
    loadLogin,
    login,
    loadDashboard,
    pageerror,
    logout,

}     