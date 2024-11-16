const User = require('../../models/userSchema');
const Address = require('../../models/addressSchema');
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


const sendVerificationEmail = async (email,otp)=>{
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

const securedPassword = async (password) =>{
    try {

        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;
        
    } catch (error) {

        console.error('Error in securedPassword: ',error);
        
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
             console.log('findUser: ',findUser);
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email,otp);
            console.log('EmailSent: ',emailSent)
            if(emailSent){
                console.log('Email sent: ',emailSent);
                req.session.userOtp = otp;  
                req.session.email = email;
                
                res.render('forgot-pass-otp');
               console.log('sent email: ',email)
                console.log('Otp: ',otp)
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


const verifyForgotPassOtp = async (req,res)=>{
    try {

        const enteredOtp = req.body.otp;
        if(enteredOtp === req.session.userOtp){
            res.json({success: true, redirectUrl: '/reset-password'});
        }else{
            res.json({success: false, message: 'Otp not matching'});
        }
        
    } catch (error) {
        res.status(500).json({success: false, message: 'An error occured. Please try again'});
        
    }
}


const getResetPassPage = async (req,res)=>{
    try {

        res.render('reset-password');
        
    } catch (error) {

        res.redirect('/pageNotFound');
        
    }
}

const resendOtpToForgotPass = async (req,res)=>{
    try {

        const otp = generateOtp();
        req.session.userOtp = otp;

        const email = req.session.email;
        console.log('Resending OTP to email: ',email);

        const emailSent = await sendVerificationEmail(email,otp);

        if(emailSent){
            console.log('Resend OTP: ',otp);

            res.status(200).json({success: true, message: 'Rsend OTP Successful'});
        }
        
    } catch (error) {

        console.error('Error in resend otp: ',error);
        res.status(500).json({success: false, message: 'Internal Server Error'});
        
    }
}


const postNewPassword = async (req,res)=>{
    try {

        const {newPass1,newPass2} = req.body;
        const email = req.session.email;

        if(newPass1 === newPass2){
            const passwordHash = await securedPassword(newPass1);

            await User.updateOne({email:email},{$set: {password:passwordHash}});

            res.redirect('/login');
        }else{
            res.render('reset-password',{message: 'Passwords do not match'});
        }
        
    } catch (error) {

        res.redirect('/pageNotFound');
        
    }
}




const userProfile = async (req,res)=>{
    try {
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        const addressData = await Address.findOne({userId});
        

        if(userId){
            const userData = await User.findById(userId);
            console.log('UserData: ',userData)
          return res.render('profile',{
            user: userData,
            userAddress: addressData
            })
        }
        
        return res.render('profile');
        
    } catch (error) {

        console.error('Error for profile data: ',error);
        res.redirect('/pageNotFound')
        
    }
}

const getNewProfile = async (req,res)=>{
    try {
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        if(userId){
            const userData = await User.findById(userId);
            console.log('UserData: ',userData)
          return res.render('new-profile',{
            user: userData,
            })
        }

        
    } catch (error) {
        console.error('Error: ',error);
        res.redirect('/pageNotFound');
        
    }
}

const getChangeProfile = async (req,res)=>{
    try {

        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        if(userId){
            const userData = await User.findById(userId);
            console.log('UserData: ',userData)
          return res.render('change-profile',{
            user: userData,
            })
        }
        
        return res.render('profile');
        
        
    } catch (error) {

        res.redirect('/pageNotFound');
        
    }
}

const changeProfile = async (req,res)=>{ 
    try {
        
        const {email} = req.body;
        const userExist = await User.findOne({email});

        if(userExist){
            console.log('user Exist: ', userExist);
            const otp = generateOtp(); 
            const emailSent = await sendVerificationEmail(email,otp);
            if(emailSent){
                req.session.userOtp = otp;
                req.session.userData = req.body;
                req.session.emali = email;
                res.render('changeProfileOtp',{user: userExist});
                console.log('Email sent: ',email);
                console.log('Otp: ',otp);
            }else{
                res.json('Email-error');
            }
        }else {
            res.render('changeProfileOtp',{message:'user with this email not exist'});
        }
        
    } catch (error) {
        console.erro(error);
        res.redirect('/pageNotFound');
    } 
}

const verifyProfileOtp = async (req,res)=>{
    try {
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);
        const userData = await User.findById(userId);
        console.log(req.body);
        const {otp} = req.body;
 
        console.log('Entered OTP:', otp);  
        console.log('Session OTP:', req.session.userOtp);

        
        if(otp === req.session.userOtp){
            console.log('User data in verifyOtp2: ',userData);
             return res.status(200).json({success:true,  redirectUrl: '/new-profile'});
         }else{
            console.log('User data in verifyOtp3: ',userData);
           return  res.status(400).json({success: false, message: 'Invalid OTp, Please try again'});
         } 
    } catch (error) {

        console.error('Error:',error);
        res.redirect('/pageNotFound')
        
    }
} 


const resendOtpToChangeProfile = async (req,res)=>{
    try {

        const {email} = req.session.userData;

        if(!email){
            return res.status(400).json({success:false, message: 'Email not found in session'})
        }

        const otp = generateOtp();
        req.session.userOtp = otp;


        const emailSent = await sendVerificationEmail(email,otp);
        if(emailSent){
            console.log('Resend otp: ',otp);
            res.status(200).json({success:true, message: 'OTP Resend Successfully'});
        }else{
            res.status(500).json({success: false, message: 'Failed to resend otp. Please try again'});
        }
        
    } catch (error) {
        console.error('Error resending OTP',error);
        res.status(500).json({success: false, message: 'Internal Server Error. Please try again'})
    }
}



const updateProfile = async (req, res) => {
    try {
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const user = await User.findById(userId);

        if (!user) {
              return res.status(404).json({ success: false, message: 'User not found' });
        }


        const updates = req.body;

        const updatedFields = {};
        Object.keys(updates).forEach(key => {
            if (key !== 'confirmPassword' && user[key] !== updates[key]) {
                updatedFields[key] = updates[key];
            }
        });
        


        console.log('updates.email: ',updates.email);
        console.log('current email: ',user.email);
        // Check if the new email already exists
        if (updates.email && updates.email !== user.email) {
            const email = updates.email;
            console.log('updates.email: ',email)
            const existingUser = await User.findOne({email:email});
            console.log(' existing email: ',existingUser);
            if (existingUser) {
                return res.json({ success: false, message: 'Email already exists' });
            }
        }

        if (updates.password) {
            const isSamePassword = await bcrypt.compare(updates.password, user.password);
            if (!isSamePassword) {
                const hashedPassword = await bcrypt.hash(updates.password, 10);
                updatedFields.password = hashedPassword;
            } else {
                delete updatedFields.password;
            }
        }

        console.log('Updated fields: ',updatedFields)

        // Update only the changed fields
        if (Object.keys(updatedFields).length > 0) {
            await User.findByIdAndUpdate(userId, updatedFields);
            return res.status(200).json({ success: true });
        }else{
             return res.json({ success: false, message: 'No changes were made to your profile.' });
        }
      

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating your profile' });
    }
};



const addAddress = async (req,res)=>{
    try {
        const user = req.session.user || (req.session.passport ? req.session.passport.user : null);

        res.render('addAddress',{
            user: user
        })
        
    } catch (error) {

        res.redirect('/pageNotFound');
        
    }
}


const postAddAddress = async (req,res)=>{
    try {
        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);
        const userData = await User.findOne({_id: userId});
        const {address,name,city,landMark,state,pincode,phone,altPhone} = req.body;

        const userAddress = await Address.findOne({userId: userData._id});

        if(!userAddress){
            const newAddress = new Address({
                userId: userData._id,
                address: [{address,name,city,landMark,state,pincode,phone,altPhone}],
            })
            await newAddress.save();
        }else{
            userAddress.address.push({address,name,city,landMark,state,pincode,phone,altPhone});
            await userAddress.save();
        }


        res.redirect('/userProfile');
    } catch (error) {

        console.error('Error in adding address: ',error);
        res.redirect('/pageNotFound');
        
    }
}


const editAddress = async (req,res)=>{
    try {

        const addressId = req.query.id;
        const user = req.session.user || (req.session.passport ? req.session.passport.user : null);

        const currentAddress = await Address.findOne({
            'address._id': addressId
        });

        if(!currentAddress){
            return res.redirect('/pageNotFound')
        }

        const addressData = currentAddress.address.find((item)=>{
            return item._id.toString()===addressId.toString();
        })

        if(!addressData){
            return res.redirect('/pageNotFound')
        }

        res.render('edit-address',{address: addressData,user: user});
        
    } catch (error) {

        console.error('Error in edit address: ',error);
        res.redirect('/pageNotFound');
        
    }
}

const postEditAddress = async (req,res)=>{
    try {

        const data = req.body;
        console.log('Data: ',data);
        const addressId = req.params.id;
        console.log('AddressId: ',addressId);
        
        const findAddress = await Address.findOne({'address._id': addressId});
        console.log('FindAddress: ',findAddress);

        if(!findAddress){
           return res.redirect('/pageNotFound');
        }
        await Address.updateOne(
            {'address._id':addressId},
            {$set: {
                'address.$': {
                    _id: addressId,
                    address: data.address,
                    name: data.name,
                    city: data.city,
                    landMark: data.landMark,
                    state: data.state,
                    pincode: data.pincode,
                    phone: data.phone,
                    altPhone: data.altPhone
                }
            }}
        )

        res.redirect('/userProfile');
        
    } catch (error) {

        console.error('Error in edit address: ',error);
        res.redirect('/pageNotFound'); 
        
    }
}


const deleteAddress = async (req,res)=>{
    try {

        const addressId = req.query.id;
        const findAddress = await Address.findOne({'address._id':addressId});

        if(!findAddress){
            return res.status(400).send('Address not found');
        }

        await Address.updateOne(
            {'address._id':addressId},
            {$pull: {
                address: {
                    _id: addressId
                }
            }}
        )

        res.redirect('/userProfile');
        
    } catch (error) {

        console.erro('Error in delete address: ',error);
        res.redirect('/pageNotFound');
        
    }
}





module.exports = {
    getForgotPassPage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getResetPassPage,
    resendOtpToForgotPass,
    postNewPassword,
    userProfile,
    getChangeProfile,
    getNewProfile,
    changeProfile,
    verifyProfileOtp,
    resendOtpToChangeProfile,
    updateProfile,
    addAddress,
    postAddAddress,
    editAddress,
    postEditAddress,
    deleteAddress,
}