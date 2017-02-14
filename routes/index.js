var express = require('express');
var router = express.Router();
var header=require('../controllers/setHeader');

var upload =require('../controllers/upload');
var sources=require('../controllers/sources');
var tile=require('../controllers/tile');
var tileset=require('../controllers/tilesets');

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { name: 'Express' });
  res.json('connect');
});
// router.post('/users',function (req,res,next) {
//   res.render('register');
// });


//数据模块

//1 上传数据
router.post('/sources/:username',upload.any(),header,sources.uploads);
//2 获取数据列表
//source list(id,name,belongto,parameters)
router.get('/sources/:username',sources.list);
//获取数据信息
router.get('/sources/:username/:sourcename',sources.info);

router.options('/sources/:username',function (req,res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, PUT, DELETE, GET, OPTIONS');
  res.setHeader('Access-Control-Request-Method','*');
  res.setHeader('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.end();
})



//瓦片集模块
//1获取瓦片集列表
router.get('/tilesets/:username',tileset.list);
//2新建瓦片数据集
router.post('/tilesets/:username',tileset.create);
//3 更新
router.patch('/tilesets/:username/:tileset_id',tileset.update);

//4向瓦片数据集中添加数据并生成瓦片
router.post('/tilesets/:username/:tileset_id',tile.generateTile);
//5获取瓦片
router.get('/tilesets/:username/:tileset_id/:z(\\d+)/:x(\\d+)/:y(\\d+).:format([\\w\\.]+)',tileset.getTile);


module.exports = router;
