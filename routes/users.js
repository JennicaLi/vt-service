var express = require('express');
var router = express.Router();
var user=require('../controllers/users');
var auth=require('../controllers/auth');

/* GET users listing. */

router.options('/', function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, PUT, DELETE, GET, OPTIONS');
  res.setHeader('Access-Control-Request-Method','*');
  res.setHeader('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept, Authorization');
  return res.statusCode(200);

});
router.post('/', user.create);//注册
router.post('/:username',user.login);//longin
router.get('/:username/confirm',auth.authAccessToken,user.confirm);//激活


module.exports = router;
