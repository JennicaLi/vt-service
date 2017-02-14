/**
 * Created by lj on 16-11-8.
 */
var mongoose=require("mongoose");
var crypto=require('crypto');
var jwt=require('jsonwebtoken');

var UserSchema=new mongoose.Schema({
    username:{type:String,index:{unique:true}},
    email:String,
    salt:String,
    hash:String,
    role:{type:String,default:'user'},
    is_verified: { type: Boolean, default: false }
},{timestamps:true});

//并不直接保存密码
UserSchema.virtual("password").set(function (password) {
    this.salt=crypto.randomBytes(16).toString('hex');
    this.hash=crypto.pbkdf2Sync(password,this.salt,10000,64,'sha512').toString('hex');
});

//获取access_token
// UserSchema.virtual('access_token').get(function () {
//     return jwt.sign({username:this.username},this.salt,{expiresIn:'7d'});
// });
UserSchema.virtual('access_token').get(function () {
    return jwt.sign({username:this.username},this.salt,{expiresIn:'7d'});
});

//根据用户名判断密码是否正确
UserSchema.methods.validPassword=function (password) {
    var hash=crypto.pbkdf2Sync(password,this.salt,10000,64,'sha512').toString('hex');
    return this.hash===hash;
};



module.exports=mongoose.model('User',UserSchema);