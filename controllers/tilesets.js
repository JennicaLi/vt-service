/**
 * Created by lj on 16-12-26.
 */
var Tileset=require('../models/tilesetModel');
var shortid = require('shortid');
var _=require('lodash');
var tiletype=require('tiletype');
var mongoose=require('mongoose');
var tileSchema=require('../models/tileSchema');

module.exports.create=function (req,res) {
    var tileset_id=req.body.tileset_id||req.query.tileset_id||shortid.generate();
    var username=req.params.username||req.query.username;
    res.header("Access-Control-Allow-Origin", "*");
    var keys=['name','minzoom','maxzoom','description','bounds','center'];
    Tileset.findOne({tileset_id:tileset_id},function (err,tileset) {
        if(err){
            return res.status(400).json(err);}
        else if(tileset){
            return res.status(400).json({error:'the tileset_id has been used'});
        }
        else{
            var newTileset=new Tileset({
                tileset_id:tileset_id,
                belongto:username,
                tilejson:{}
            });
            keys.forEach(function (key) {
                if(req.body[key]){
                    if(key=='name'||key=='description'){
                        newTileset[key]=req.body[key];
                    }
                    else{
                        newTileset['tilejson'][key]=req.body[key];
                    }
                }
            });

            newTileset.save(function (err,result) {
                if(err){
                    return res.status(400).json(err);
                }
                else{
                    res.status(200).json({message:'create success'});
                }
            });
        }
    });
}

module.exports.update=function (req,res) {
    var tileset_id=req.params.tileset_id||req.body.tileset_id;
    var username=req.params.username||req.body.username;
    var keys=['name','minzoom','maxzoom','description','bounds','center'];
    mongoose.findOneAndUpdate({tileset_id:tileset_id},_pick(req.body,keys),null,function (err,tileset) {
        if(err){
            res.status(400).json(err);
        }
        else if(!tileset){
            res.status(404).json({error:'can not find the tileset'});
        }
        else{
            res.json({message:'update successful'});
        }
    });
}
module.exports.getTile=function (req,res) {
    var tileset_id=req.params.tileset_id;
    if(!tileset_id){
        res.status(404).json({error:'There is missing the tileset_id'});
    }
    var z=req.params.z,
        x=req.params.x,
        y=req.params.y;

    var Tile=mongoose.models(tileset_id,tileSchema);
    Tile.findOne({
        zoom_level: z,
        tile_column: x,
        tile_row: y
    }, function(err, tile) {
        if (err) {
            return res.status(500).json({ error: err })
        }

        if (!tile || !tile.tile_data) {
            return res.sendStatus(404)
        }

        res.set('Expires', new Date(Date.now() + 604800000).toUTCString())
        res.set(tiletype.headers(tile.tile_data))
        res.send(tile.tile_data)
    });

}

module.exports.list=function(req,res){
    var username=req.params.username||'public';
    res.header("Access-Control-Allow-Origin", "*");
    Tileset.find({belongto:username},function (err,tilesets) {
        if(err){
            return res.status(500).json({error:err});
        }
        else if(!tilesets){
            return res.status(404).json({'message':'没有瓦片集'});
        }
        else{
            var keys=['tileset_id','belongto','name','description','tilejson','createdAt','updatedAt'];
            var result=tilesets.map(function (tileset) {
                return _.pick(tileset,keys);
            })
            return res.status(200).json(result);
        }
    });
}