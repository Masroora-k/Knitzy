const pageNotFound = async (req,res)=>{
    try {
        res.render('page-404');
        console.log('render 404 page');
        
    } catch (error) {
        res.redirect('/pageNotFound'); 
        console.log('Error in page-404');
               
    }
};

const loadHomepage = async (req,res)=>{
    try {
        return res.render('home');
    } catch (error) {
        console.log('Home page not found');
        res.status(500).send('Server error');
        
    }
};



module.exports = {
    loadHomepage,
    pageNotFound,
};