var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('Request');
});

app.get('/', function(req, res) {
  res.render('index', { user: req.user });
});

module.exports = router;