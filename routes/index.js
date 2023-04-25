/*
var express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();
var router = express.Router();

 using the API documentation for help
const host = 'api.frankfurter.app';
fetch(`https://${host}/latest?amount=10&from=GBP&to=USD`)
  .then(resp => resp.json())
  .then((data) => {
    price = `10 GBP = ${data.rates.USD} USD`;
  });



router.get('/', function(req, res, next) {
  res.render('index', { title: 'Starbucks Point of Sale' });
  
});

module.exports = router;
*/

const express = require('express')
const { Pool } = require('pg');
const dotenv = require('dotenv').config();
var bodyParser = require('body-parser');



//using the API documentation for help
const host = 'api.frankfurter.app';
fetch(`https://${host}/latest?amount=10&from=GBP&to=USD`)
  .then(resp => resp.json())
  .then((data) => {
    price = `10 GBP = ${data.rates.USD} USD`;
  });


// Create Express App
const app = express();
const router = express.Router();
const port = 3000;

//Create Postgres Pool
const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: process.env.PSQL_PORT,
    ssl: {rejectUnauthorized: false}
});

process.on('SIGINT', function() {
    pool.end();
    console.log('Application successfully terminated');
    process.exit(0);
});

app.set('view engine', "ejs");
app.use(bodyParser.json()); 

app.use(bodyParser.urlencoded({ extended: true })); 

// Serve static files from the public directory
app.use(express.static('public/stylesheets'));

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/user', (req, res) => {
    arr = [];
    pool
        .query('SELECT * FROM inventory')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
                arr.push(query_res.rows[i]);
            }
            const data = {arr: arr};
            console.log(arr);
            res.render('user', data);
        });
});


router.get('/Server/:id', (req, res) => {
    const id = req.params.id;
    let serverMenu = [];
    var menuType="Coffee";
    if(id== "TeaMenu"){
        menuType = "Tea";
    } else if(id== "BreakfastMenu" ){
        menuType = "Breakfast";
    }else if(id== "BakeryMenu" ){
        menuType = "Bakery";
    }else if(id== "CoffeeMenu" ){
        menuType = "Coffee";
    }else if(id== "SeasonalMenu" ){
        menuType = "seasonal";
    }

    pool.query("select * from menu where subcategory = $1",[menuType])
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
                serverMenu.push(query_res.rows[i]);
        }
            const data = {
                serverMenu: serverMenu,
                id: id
            };
            console.log(data);
            res.render('Server', data);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});


router.get('/Manager', (req, res) => {
    // x, z, excess, sales reports
    // update/restock inventory
    // update/add menu item
    //
    let inventory_arr = [];
    pool.query("select * from inventory")
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
                inventory_arr.push(query_res.rows[i]);
            }
            const data = {inventory_arr: inventory_arr};
            
            res.render('Manager', data);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});

router.post('/update-inventory/:id', (req, res) => {
    const id = parseInt(req.params.id);
    pool.query("update inventory set quantity = quantity + 10000 where id = $1", [id])
        .then(() => {
            console.log("Item quantity updated");
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');

        });
        res.redirect("../Manager");
});


router.post('/orderItem', (req, res) => {
    const order = req.body.drinkOrder;
    const itemArray = order.split(':');
    //
    const name = itemArray[0];
    const category = itemArray[1];
    const subcategory = itemArray[2];
    //prices
    const tall = itemArray[3];
    const grande = itemArray[4];
    const venti = itemArray[5];

    var price = 0.00;
    const size = req.body.drinkSize;
    if(size=='tall'){
        price = tall;
    } else if(size == 'grande'){
        price = grande;
    } else if(size == 'venti'){
        price = venti;
    }


    console.log(req.body);
    pool.query("insert into xreport (item, price) values ($1,$2)", [name,price])
        .then(() => {
            console.log("order added to x report");
            console.log(itemArray);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });


    res.redirect("../Server/CoffeeMenu");
  
});
router.get('/XReport', (req, res) => {
    let revenue= 0.0;
    let report_arr = [];
    pool.query("select * from xreport")
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
                report_arr.push(query_res.rows[i]);
                
            }
            pool.query("select SUM(price) from xreport")
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
               revenue =  query_res.rows[i];
            }
            const data = {report_arr: report_arr, revenue: revenue, type: 'XReport'};
            console.log(data);
             res.render('XReport', data);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });

        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
            
        });
        
});
router.get('/ZReport', (req, res) => {
    let revenue= 0.0;
    let report_arr = [];
    pool.query("select * from xreport")
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
                report_arr.push(query_res.rows[i]);
                
            }
            pool.query("select SUM(price) from xreport")
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
               revenue =  query_res.rows[i];
            }
            const data = {report_arr: report_arr, revenue: revenue, type: 'ZReport: WARNING REFRESHING WILL REQUEST A NEW Z REPORT DELETING'};
            console.log(data);
            

             res.render('XReport', data);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });

        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
            
        });
        
});

/*
router.post('/add-inventory-item', (req, res) => {
    const item = req.body.item;
    const quantity = req.body.quantity;
    pool.query("insert into inventory (item, quantity) values ($1, $2)", [item, quantity])
*/
router.post('/add-menu-item', (req, res) => {
    
    const item = req.body.SeasonName;
    const tallPrice = req.body.PriceTall;
    const grandePrice = req.body.PriceGrande;
    const ventiPrice = req.body.PriceVenti;
    
    pool.query("insert into menu (category, subcategory, item, tall, grande, venti) values ('Drink', 'seasonal', $1, $2, $3, $4)", [item, tallPrice, grandePrice, ventiPrice])
        .then(() => {
            console.log("Menu item added");
            res.redirect("../Manager");
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});




app.use('/', router);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});
