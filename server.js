import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt-nodejs';
import cors from 'cors';
import knex from 'knex';
//const register = require('./controllers/register.js');

 const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      port : process.env.PORT,
      user : 'postgres',
      password : 'ayush1811',
      database : 'smartbrain'
    }
  });

//  db.select('*').from('users').then(data => {
//      console.log(data);
//  }) 
//  .catch(err => console.log(err))

const app = express();

//app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors())


app.get('/', (req, res) => {
    res.send('it is working');
})

app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    if(!email || !password)
    {
         return res.status(400).json('incorrect form submission');
    }
    db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
       const isValid =  bcrypt.compareSync(password, data[0].hash);
      
       if(isValid) {
         return db.select('*').from('users')
           .where('email', '=', email)
           .then(user => {
               res.json(user[0])
           })
           .catch(err => res.status(400).json('unable to get user'))
       }
       else {
           res.status(400).json('wrong credentials')
       }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register',(req, res) =>{
    const { email, name, password } = req.body;
    if(!email || !name || !password)
    {
         return res.status(400).json('incorrect form submission');
    }
     const hash = bcrypt.hashSync(password);
     db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        }) 
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
        .returning('*')
        .insert({
            email: loginEmail[0],
            name: name,
            joined: new Date()
    })
    .then(user => {
        res.json(user[0]);//we wanna make sure its not an array and we are returning an object
    })
        })
        .then(trx.commit)
        .catch(trx.rollback)
     })
    
    .catch(err => res.status(400).json('unable to register'))

   // res.json(database.users[database.users.length - 1]);
})

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    db.select('*').from('users').where({
        id: id
    }).then(user => {
        if(user.length)
        {
            res.json(user[0]);
        } else {
            res.status(400).json('Not Found')
        }
    })
    .catch(err => res.status(400).json('error getting user'))
})

app.put('/image',(req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0]);
    })
    .catch(err => res.status(400).json('unable to get entries'))
    
})


app.listen(process.env.port || 3000, ()=> {
    console.log(`app is running on port ${process.env.PORT}`);
})