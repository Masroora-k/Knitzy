const User = require('../../models/userSchema');



const customerInfo = async (req, res) => {
    try {
        let search = req.query.search || '';
        let page = parseInt(req.query.page) || 1;
        const limit = 4;

        if(page < 1) page = 1;
        const userData = await User.find({
            isAdmin: false
        })
        .sort({ createdOn: -1 }) 
        .skip((page - 1) * limit)
        .limit(limit)

        console.log('userdata: ',userData)
       
        const count = await User.countDocuments({
            isAdmin: false
        });

        console.log('count: ',count)

        res.render('customers', {
            data: userData,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });

    } catch (error) {
        console.error(error);
        res.redirect('/pageerror');
    }
};



const customerBlocked = async (req, res) => {
    try {
        let id = req.query.id;
                await User.updateOne({_id: id},{$set: {isBlocked: true}});
                res.redirect('/admin/users');
    } catch (error) {

        res.redirect('/pageerror');
        
    }
};


const customerunBlocked = async (req,res)=>{
    try {

        let id = req.query.id;
        await User.updateOne({_id: id},{$set: {isBlocked: false}});
        res.redirect('/admin/users');
        
    } catch (error) {

        res.redirect('/pageerror');
        
    }
}



const deleteCustomer = async (req,res)=>{
    try {

        const id = req.query.id;
       
        await User.findOneAndDelete({_id:id});

        res.status(200).json({ message: 'User deleted successfully' });
        
        
    } catch (error) {
        res.render('pageerror');
        
    }
}




module.exports = {
    customerInfo,
    customerBlocked,
    customerunBlocked,
    deleteCustomer,
}