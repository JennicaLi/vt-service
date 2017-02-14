/**
 * Created by lj on 16-12-22.
 *
 */
var mongoose=require('mongoose');

var tileSchema=new mongoose.Schema({
    z:Number,
    x:Number,
    y:Number,
    tile_data:Buffer
});

tileSchema.index({z:1,x:1,y:1});

module.exports=tileSchema;