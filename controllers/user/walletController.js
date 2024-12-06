const Wallet = require('../../models/walletSchema');



const getWallet = async (req,res)=>{
    try {

        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        if (!userId) {
            return res.redirect('/login'); 
        }

        const wallet = await Wallet.findOne({userId: userId}).populate('transactions');
        console.log('wallet: ',wallet);

        res.render('wallet',{
            user: userId,
            wallet: wallet,
            transactions: wallet.transactions,
            cartQuantity: req.session.cartQuantity || 0,
        })

        
    } catch (error) {

        console.error('Error in load wallet page: ',error);
        res.redirect('/pageNotFound');
        
    }
}





module.exports = {
    getWallet,
}