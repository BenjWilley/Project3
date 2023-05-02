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
const fetch = require('isomorphic-fetch');
var bodyParser = require('body-parser');
const moment = require('moment');
const { auth, requiresAuth } = require('express-openid-connect');



//using the API documentation for help
// Create Express App
const app = express();
const router = express.Router();
const port = 3000;

router.get('/', (req, res) => {
    const host = 'api.frankfurter.app';
    fetch(`https://${host}/latest?amount=10&from=GBP&to=USD`)
        .then(resp => resp.json())
        .then((data) => {
            const price = `10 GBP = ${data.rates.USD} USD`;
            res.render('index', { price: price }); // pass price to the view
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });

});


const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.ISSUER_BASE_URL
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
router.use(auth(config));

//Create Postgres Pool
const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: process.env.PSQL_PORT,
    ssl: { rejectUnauthorized: false }
});

process.on('SIGINT', function () {
    pool.end();
    console.log('Application successfully terminated');
    process.exit(0);
});

app.set('view engine', "ejs");
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static('img'));

router.get('/login', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

router.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});

router.get('/user', (req, res) => {
    arr = [];
    pool
        .query('SELECT * FROM inventory')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
                arr.push(query_res.rows[i]);
            }
            const data = { arr: arr };
            console.log(arr);
            res.render('user', data);
        });
});


router.get('/Server/:id', (req, res) => {

    const id = req.params.id;
    let serverMenu = [];
    let currentOrder = [];
    let revenue = 0.0;

    var menuType = "Coffee";
    if (id == "TeaMenu") {
        menuType = "Tea";
    } else if (id == "BreakfastMenu") {
        menuType = "Breakfast";
    } else if (id == "BakeryMenu") {
        menuType = "Bakery";
    } else if (id == "CoffeeMenu") {
        menuType = "Coffee";
    } else if (id == "SeasonalMenu") {
        menuType = "seasonal";
    }

    pool.query("select * from menu where subcategory = $1", [menuType])
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
                serverMenu.push(query_res.rows[i]);
            }

            pool.query("select * from current_order")
                .then(query_res => {
                    for (let i = 0; i < query_res.rowCount; i++) {
                        currentOrder.push(query_res.rows[i]);

                    }
                    pool.query("select SUM(price) from current_order")
                        .then(query_res => {
                            for (let i = 0; i < query_res.rowCount; i++) {
                                revenue = query_res.rows[i];
                            }
                            console.log(revenue);
                            if (revenue.sum == null) {
                                revenue.sum = 0.00;
                            }
                            const tax = revenue.sum * .0825;
                            const grandTotal = revenue.sum + tax;

                            const data = {
                                serverMenu: serverMenu,
                                currentOrder: currentOrder,
                                id: id,
                                revenue: revenue.sum,
                                tax: tax,
                                grandTotal: grandTotal
                            };
                            console.log(data);
                            res.render('Server', data);
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


        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
});

router.get('/Customer/:id/:color', (req, res) => {
    var filter = req.params.color;
    if(filter==null){
        filter ="none";
    }
    const id = req.params.id;
    let serverMenu = [];
    let currentOrder = [];

    var menuType = "Coffee";
    if (id == "TeaMenu") {
        menuType = "Tea";
    } else if (id == "BreakfastMenu") {
        menuType = "Breakfast";
    } else if (id == "BakeryMenu") {
        menuType = "Bakery";
    } else if (id == "CoffeeMenu") {
        menuType = "Coffee";
    } else if (id == "SeasonalMenu") {
        menuType = "seasonal";
    }

    pool.query("select * from menu where subcategory = $1", [menuType])
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
                serverMenu.push(query_res.rows[i]);
            }

            pool.query("select * from current_order")
                .then(query_res => {
                    for (let i = 0; i < query_res.rowCount; i++) {
                        currentOrder.push(query_res.rows[i]);

                    }

                    pool.query("select SUM(price) from current_order")
                        .then(query_res => {
                            for (let i = 0; i < query_res.rowCount; i++) {
                                revenue = query_res.rows[i];
                            }
                            console.log(revenue);
                            if (revenue.sum == null) {
                                revenue.sum = 0.00;
                            }
                            const tax = revenue.sum * .0825;
                            const grandTotal = revenue.sum + tax;

                            const data = {
                                serverMenu: serverMenu,
                                currentOrder: currentOrder,
                                id: id,
                                revenue: revenue.sum,
                                tax: tax,
                                grandTotal: grandTotal,
                                color: filter
                            };
                            console.log(data);
                            res.render('Customer', data);
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
    pool.query("select * from inventory order by id")
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
                inventory_arr.push(query_res.rows[i]);
            }
            const data = { inventory_arr: inventory_arr };

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
            res.redirect("../Manager");
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');

        });

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
    const page = itemArray[6];
    const color = itemArray[7];

    var price = Number(0.00);
    const size = req.body.drinkSize;

    // let subtotal = 0.00;
    // let tax = 0.00;
    // let total = 0.00;


    price = Number(tall);
    if (category == 'Drink') {
        if (size == 'grande') {
            price = Number(grande);
            pool.query("update inventory set quantity = quantity - 1 where id = 2")
                .then(() => {
                    console.log("Grande cup removed from inventory");
                });
        } else if (size == 'venti') {
            price = Number(venti);
            pool.query("update inventory set quantity = quantity - 1 where id = 3")
                .then(() => {
                    console.log("Venti cup removed from inventory");
                });
        }
    }

    if (category == 'Drink') {
        pool.query("update inventory set quantity = quantity - 1 where id = 1")
            .then(() => {
                console.log("Tall cup removed from inventory");
            });
    }



    var menuType = "CoffeeMenu";
    if (subcategory == "Tea") {
        pool.query("update inventory set quantity = quantity - 1 where id = 7")
            .then(() => {
                console.log("Tea bag removed from inventory");
            });
        menuType = "TeaMenu";
    } else if (subcategory == 'Breakfast') {
        pool.query("update inventory set quantity = quantity - 1 where item = $1", [name])
            .then(() => {
                console.log("Breakfast item removed from inventory");
            });
        menuType = "BreakfastMenu";
    } else if (subcategory == "Bakery") {
        pool.query("update inventory set quantity = quantity - 1 where item = $1", [name])
            .then(() => {
                console.log("Bakery item removed from inventory");
            });
        menuType = "BakeryMenu";
    } else if (subcategory == "Coffee") {
        if (req.body.nondairy == 'off') {
            if (size == 'tall') {
                pool.query("update inventory set quantity = quantity - 6 where id = 6")
                    .then(() => {
                        console.log("Coffee beans removed from inventory for tall");
                    });
                pool.query("update inventory set quantity = quantity - 6 where id = 8")
                    .then(() => {
                        console.log("Milk removed from inventory for tall");
                    });
                pool.query("update inventory set quantity = quantity - 1 where id = 21")
                    .then(() => {
                        console.log("Creamer removed from inventory for tall");
                    });
            } else if (size == 'grande') {
                pool.query("update inventory set quantity = quantity - 9 where id = 6")
                    .then(() => {
                        console.log("Coffee beans removed from inventory for grande");
                    });
                pool.query("update inventory set quantity = quantity - 9 where id = 8")
                    .then(() => {
                        console.log("Milk removed from inventory for grande");
                    });
                pool.query("update inventory set quantity = quantity - 2 where id = 21")
                    .then(() => {
                        console.log("Creamer removed from inventory for grande");
                    });
            } else if (size == 'venti') {
                pool.query("update inventory set quantity = quantity - 12 where id = 6")
                    .then(() => {
                        console.log("Coffee beans removed from inventory for venti");
                    });
                pool.query("update inventory set quantity = quantity - 12 where id = 8")
                    .then(() => {
                        console.log("Milk removed from inventory for venti");
                    });
                pool.query("update inventory set quantity = quantity - 3 where id = 21")
                    .then(() => {
                        console.log("Creamer removed from inventory for venti");
                    });
            }
        }
        menuType = "CoffeeMenu";
    } else if (subcategory == "seasonal") {
        menuType = "SeasonalMenu";
    }

    var shot = false;
    if (req.body.shot == 'on') {
        shot = true;
        pool.query("update inventory set quantity = quantity - 1 where id = 42")
            .then(() => {
                console.log("Espresso shot removed from inventory");
            });
        price = Number(price) + 0.50;
    }
    var iced = false;
    if (req.body.iced == 'on') {
        iced = true;
    }
    var syrup = false;
    if (req.body.syrup == 'on') {
        syrup = true;
        pool.query("update inventory set quantity = quantity - 1 where id = 10")
            .then(() => {
                console.log("Caramel Syrup pump removed from inventory");
            });
        price = Number(price) + 0.50;
    }
    var nondairy = false;
    if (req.body.nondairy == 'on') {
        nondairy = true;
        pool.query("update inventory set quantity = quantity - 6 where id = 9")
            .then(() => {
                console.log("Soy milk for drink removed from inventory");
            });
    }

    //get current time and new order id
    const currentTimeStamp = moment().format('YYYY-MM-DD HH:mm:ss');
    var lastOrderId = 0;
    var newOrderId = 0;
    console.log("THIS IS WHAT IT COSTS");
    console.log(price);
    pool.query("select orderid from sales order by orderid desc limit 1")
        .then(query_res => {
            lastOrderId = query_res.rows[0].orderid;
            newOrderId = lastOrderId + 1;
            console.log(newOrderId);
            //add to current order table
            pool.query("insert into current_order (date, subcategory, price, name, shot, iced, syrup, nondairy, orderid) values ( $1, $2, $3, $4, $5, $6, $7, $8, $9)", [currentTimeStamp, subcategory, price, name, shot, iced, syrup, nondairy, newOrderId])
                .then(() => {
                    console.log("added to current order");
                    console.log("($1, $2, $3, $4, $5, $6, $7, $8, $9)", [currentTimeStamp, subcategory, price, name, shot, iced, syrup, nondairy, newOrderId]);

                    console.log(req.body);
                    pool.query("insert into xreport (item, price) values ($1,$2)", [name, price])
                        .then(() => {
                            console.log("order added to x report");
                            console.log(itemArray);
                            var serverPath = "../" + page + "/" + menuType+"/"+ color;
                            if(page=='Server'){
                                serverPath = "../" + page + "/" + menuType;
                            }
                            res.redirect(serverPath);

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
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });
    /*
        pool.query("select * from current_order")
            .then(query_res => {
                for (var i = 0; i < query_res.rows.length; i++) {
                    subtotal += query_res.rows[i].price;
                }
                console.log(subtotal);
                tax = subtotal * 0.065;
                total = subtotal + tax;
                console.log(total);
                res.render('payment', { subtotal: subtotal, tax: tax, total: total });
            })
            .catch(err => {
                console.error(err);
                res.status(500).send('Internal Server Error');
            });
            */

});

//add to sales and clear current order
router.post('/clear-current', (req, res) => {
    //add current order to sales    COLORBLIND SUFFICIENT

    const bodyData = req.body.payment;
    const itemArray = bodyData.split(':');

    const id = itemArray[0];
    const page = itemArray[1];
    const color =  itemArray[2];


    var menuType = "CoffeeMenu";
    if (id == "Tea") {
        menuType = "TeaMenu";
    } else if (id == "Breakfast") {
        menuType = "BreakfastMenu";
    } else if (id == "Bakery") {
        menuType = "BakeryMenu";
    } else if (id == "Coffee") {
        menuType = "CoffeeMenu";
    } else if (id == "seasonal") {
        menuType = "SeasonalMenu";
    }
    var serverPath = '../' + page + '/' + menuType;
    if(page=='Customer'){
    serverPath = '../' + page + '/' + menuType+'/'+color;
    }

    console.log(serverPath);

    pool.query("insert into sales select * from current_order")
        .then(() => {
            console.log("current order added to sales");
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });

    //clear current order
    pool.query("truncate current_order")
        .then(() => {
            console.log("current order cleared");
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });

    res.redirect(serverPath);
});

router.post('/deleteCartItem', (req, res) => {
    //add current order to sales  COLOR BLIND SUFFICIENT
    const bodyData = req.body.deleteWhat;
    const itemArray = bodyData.split(':');

    console.log(itemArray);
    const id = itemArray[0];
    const page = itemArray[1];
    var item = 0;
    item = itemArray[2];
    const color = itemArray[3];


    var menuType = "CoffeeMenu";
    if (id == "Tea") {
        menuType = "TeaMenu";
    } else if (id == "Breakfast") {
        menuType = "BreakfastMenu";
    } else if (id == "Bakery") {
        menuType = "BakeryMenu";
    } else if (id == "Coffee") {
        menuType = "CoffeeMenu";
    } else if (id == "seasonal") {
        menuType = "SeasonalMenu";
    }

    var serverPath = '../' + page + '/' + menuType ;
    if(page == 'Customer'){
        serverPath = '../' + page + '/' + menuType+ '/' + color ;
    }
    console.log(serverPath);

    pool.query("DELETE FROM current_order WHERE date IN (SELECT date FROM current_order ORDER BY date OFFSET $1 LIMIT 1)", [item])
        .then(() => {
            console.log("item deleted from current order");
            res.redirect(serverPath);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });

});

router.post('/sales-report', (req, res) => {
    let start = req.body.start;
    let end = req.body.end;
    pool.query("select name, count(*) from sales where sales.date >= to_timestamp('$1','YYYY-MM-DD') and sales.date <= to_timestamp('$2', 'YYYY-MM-DD') group by name", [start, end]);
    res.redirect('/sales-report');
});

router.post('/excess-report', (req, res) => {
    let start = req.body.start;
    let current = moment().format('YYYY-MM-DD');

});

router.post('/restock-report', (req, res) => {
    let restock_arr = [];
    pool.query("select * from inventory where quantity < restockquantity")
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
                restock_arr.push(query_res.rows[i]);
            }
            const data = { restock_arr: restock_arr, type: 'Restock' };
            console.log(data);
            res.render('RestockReport', data);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        }
        );
});



router.get('/XReport', (req, res) => {
    let revenue = 0.0;
    let report_arr = [];
    pool.query("select * from xreport")
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
                report_arr.push(query_res.rows[i]);

            }
            pool.query("select SUM(price) from xreport")
                .then(query_res => {
                    for (let i = 0; i < query_res.rowCount; i++) {
                        revenue = query_res.rows[i];
                    }
                    if(revenue.sum == null){
                        revenue.sum = 0.00;
                    }
                    const data = { report_arr: report_arr, revenue: revenue, type: 'XReport' };
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
    let revenue = 0.0;
    let report_arr = [];
    pool.query("select * from xreport")
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
                report_arr.push(query_res.rows[i]);

            }
            pool.query("select SUM(price) from xreport")
                .then(query_res => {
                    for (let i = 0; i < query_res.rowCount; i++) {
                        revenue = query_res.rows[i];
                    }
                    const data = { report_arr: report_arr, revenue: revenue, type: 'ZReport: WARNING REFRESHING WILL REQUEST A NEW Z REPORT DELETING' };
                    console.log(data);

                    pool.query("truncate xreport")
                        .then(() => {
                            console.log("report cleared");
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

router.get('/finder', function (req, res) {
    res.render('finder');
});


app.use('/', router);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});
