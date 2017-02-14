/**
 * Created by lj on 16-12-21.
 * datasource
 */
var mongoose=require('mongoose');
var select = require('mongoose-json-select');
var shortid = require('shortid');

var SourceSchema=new mongoose.Schema({
    // _id:false,
    source_id:{type:String,default:shortid.generate,index:true},
    name:String,
    belongto:String,
    keys:{},
    linking:{} //datasource parameters to link datasource
},
    {timestamps:true});

SourceSchema.plugin(select, '-_id -__v');
module.exports=mongoose.model('Source',SourceSchema);