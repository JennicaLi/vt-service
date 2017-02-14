/**
 * Created by lj on 17-1-16.
 */
module.exports=function (req,res,next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    next();
}