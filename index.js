const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const { pool ,tokenConfig} = require('./config')
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())

var date_ob = new Date();
var day = ("0" + date_ob.getDate()).slice(-2);
var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
var dateTime = date_ob.getFullYear() + "-" + month + "-" + day + " " + date_ob.getHours() + ":" + date_ob.getMinutes() + ":" + date_ob.getSeconds();



//app.post('/api/user/register', 
const postUser = (req, res) =>{

    let email = req.body.email;
    let fullnames = req.body.fullnames;
    let phone = req.body.phone;
    let password = bcrypt.hashSync(req.body.password,8);
    let role = "PET_OWNER";
     let created_at = dateTime;
    let updated_at = dateTime;

    // validation
    if (!email)
        return res.status(400).send({ error:true, message: 'Please provide a valid Email'});
    if(!fullnames)
        return res.status(400).send({ error:true, message: 'Please provide a first and last names'});
    if (!phone)
        return res.status(400).send({ error:true, message: 'Please provide a phone number'});

    // insert to db

    pool.query("INSERT INTO Users(fullnames,phone,email,role,created_at,updated_at,password) VALUES ($1,$2,$3,$4,$5,$6,$7)", 
    [fullnames,phone,email,role,created_at,updated_at,password], 
    function (error, results, fields) {
        if (error) throw error;
        let users_id = results.insertId;
        return res.status(201).send({ error: false, data: results.rows[0], message: "User successfully added" });
    });
}



//app.post('/api/user/login',

 const loginUser  = (req, res) => {
     
    pool.query("SELECT * FROM Users where email=$1",[req.body.email], function (error, results, fields) {
        if (error) throw error;
        // check has data or not
        let message = "";
        if (results === undefined || results.rows.length == 0){
            message = "User not found";
        }

        var passwordIsValid = bcrypt.compareSync(req.body.password, results.rows[0].password);
        if (!passwordIsValid) {
            return res.status(401).send({ auth: false, accessToken: null, reason: "Invalid Password!" });
        }
        
        var token = jwt.sign({userId:results.rows[0].id, email:results.rows[0].email, fullnames:results.rows[0].fullnames,role:results.rows[0].role,}, tokenConfig.secret, {
            expiresIn: 86400 // expires in 24 hours
        });
       return res.status(200).send({ auth: true, accessToken: token, user:results.rows[0]});
    });
};


//app.get('/api/user', [authJwt.verifyToken, authJwt.isSUPER],
 const getAllusers= (req, res) => {
    pool.query("SELECT Users.id,fullnames,phone,email,role,Pet.name as pet_name, Pet.wieght as pet_weight,Pet.date_of_birth as petdatOfBirth,pet_type.type_name as pettype FROM Users, pet_owner, Pet,cage_in_pet, pet_type WHERE Users.id = pet_owner.Users_id AND pet_owner.Pet_id = Pet.id AND Pet.pet_type_id = pet_type.id",function (error, results, fields) {
        if (error) throw error;

        // check has data or not
        let message = "";
        if (results.rows === undefined || results.rows.length == 0)
            message = "users table is empty";
        else
            message = "Successfully retrived all users";
        return res.send(results.rows);
    });
};

//app.get('/api/user', [authJwt.verifyToken, authJwt.isSUPER], 
const getUsersWithPet = (req, res) => {
    pool.query('SELECT DISTINCT * from Users,pet_owner where  Users.id = pet_owner.Users_id', [req.params.Pet_id], function (error, results, fields) {
        if (error) throw error;

        // check has data or not
        let message = "";
        if (results.rows === undefined || results.rows.length == 0){
            message = "users table is empty";
        }

        const ids = arr.map(o => o.fullnames)
        const filtered = arr.filter(({fullnames}, index) => !ids.includes(fullnames, index + 1))
        message = "Successfully retrived all users";
        return res.send(filtered);
    });
};

app.get('/api/pet-owners',getUsersWithPet);
app.get('/api/user',getAllusers);
app.post('/api/user/login',loginUser);
app.post('/api/user/register',postUser);


// Start server
app.listen(process.env.PORT || 4000, () => {
  console.log(`Server listening`)
})