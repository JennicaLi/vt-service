/**
 * Created by lj on 16-12-22.
 */
var mongoose=require('mongoose');
var shortid = require('shortid');
var select=require('mongoose-json-select');

var tilesetShcema=new mongoose.Schema({
    tileset_id:{type:String,default:shortid.generate,index:true},
    belongto:String,
    name:String,
    description:String,
    version:{type:String,default:'1.0.0'},
    tilejson:{
        schema:{type:String,default:'xyz'},
        minzoom:{type:Number,default:0},
        maxzoom:{type:Number,default:18},
        bounds:{type:[Number], default: [-180, -90, 180, 90] },
        center:{type:[Number],default:[0,0,0]},
        tiles:[String],
        vector_layers:[{
            _id:false,
            id:String,
            description:String,
            fields:{}
        }]
    }
},{timestap:true});

tilesetShcema.plugin(select,'-_id -__v')
tilesetShcema.index({createAt:-1});
tilesetShcema.index({updateAt:-1});

module.exports=mongoose.model("Tileset",tilesetShcema);