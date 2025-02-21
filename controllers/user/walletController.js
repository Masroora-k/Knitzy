const Wallet = require('../../models/walletSchema');



const getWallet = async (req,res)=>{
    try {

        const userId = req.session.user || (req.session.passport ? req.session.passport.user : null);

        if (!userId) {
            return res.redirect('/login'); 
        }

        let wallet = await Wallet.findOne({userId: userId}).populate('transactions');
       
        if(!wallet){
            wallet = new Wallet({
                userId: userId,
                balance: 0,
                transactions: []
            });
            await wallet.save();
        }

        const transactionsToShow = wallet.transactions;

        res.render('wallet',{
            user: userId,
            wallet: wallet,
            transactions: transactionsToShow,
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