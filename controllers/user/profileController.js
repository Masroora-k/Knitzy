const User = require('../../models/userSchema');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const env = require('dotenv').config();
const session = require('express-session');



function generateOtp(){
    const digits = '1234567890';
    let otp = '';
    for(let i=0; i<6; i++){
        otp += digits[Math.floor(Math.random()*10)];
    }
    return otp;
}


const sendVerificationEmail = async (req,res)=>{
    try {

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth:{
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD,
            }
        })


        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: 'Your OTP for password reset',
            text: `Your OTP is ${otp}`,
            html: `<b><h4>Your OTP: ${otp}</h4><b>`
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ', info.messageId);
        return true;

        
    } catch (error) {

        console.error('Error sending email',error);
        return false;
        
    }
}


const getForgotPassPage = async (req,res)=>{

    try {

        res.render('forgot');
        
    } catch (error) {

        res.redirect('/pageNotFound');
        
    }

}


const forgotEmailValid = async (req,res)=>{
    try {

        const {email} = req.body;
        const findUser = await User.findOne({email:email});

        if(findUser){
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email,otp);

            if(emailSent){
                req.sessio.userOtp = otp;  
                req.session.email = email;
                res.render('forgot-pass-otp');
                console.log('OTP: ',otp);
            }else{
                res.json({success:false, message: 'Failed to send OTP. Please try again'});
            }
        } else {
            res.render('forgot',{
                message: 'User with this email does not exist'
            });

        }
        
    } catch (error) {

        res.redirect('/pageNotFound');
        
    }
}


module.exports = {
    getForgotPassPage,
    forgotEmailValid,
}