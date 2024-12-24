const express=require("express");
const app=express();

app.use(express.static('public'));

app.set('view engine','ejs');
app.get('/', (req, res) => {
    res.render('home', { title: 'Home Page', message: 'Welcome to EJS!' });
});

app.get('/home', (req, res) => {
    res.render('home', { title: 'Home Page', message: 'Welcome to EJS!' });
});

app.get('/resume', (req, res) => {
    res.render('resume');
});
app.get('/admin', (req, res) => {
    res.render('adminpanel', { title: 'Home Page', message: 'Welcome to EJS!' });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});