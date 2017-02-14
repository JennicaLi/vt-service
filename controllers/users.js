/**
 * Created by lj on 16-11-8.
 */
var User=require('../models/userModel');
var nodemailer=require('nodemailer');
var mailConfig=require('../config').mail;

module.exports.create=function (req,res) {
    var username=req.body.username,
        password=req.body.password,
        email=req.body.email;
    res.setHeader('Access-Control-Allow-Origin','*');
    if (!username || !password||!email) {
        return res.status(400).json({ error: '注册信息不完整' });
    }
    if (password.length<6) {
        return res.status(400).json({ error: '密码长度小于6' });
    }

    // return res.json({message:'邮件已发送，请验证'});
    User.findOne({username:username},function (err,user) {
        // res.header("Access-Control-Allow-Origin", "http://localhost:9000");

        if(err){
            return res.status(500).json({error:err});
        }
        if(user){
            return res.status(400).json({error:'该用户名已被占用'});
        }
        var newUser=new User({
            username:username,
            email:email,
            password:password
        });
        //save to db
        newUser.save(function (err,user) {
            if(err){
                return res.status(500).json({error:err});
            }
            //res.json(user.toJSON({virtuals:true}));//执行但是并不返回，返回要加return
            var options={
                host:req.hostname,
                port:req.port,
                username:user.username,
                access_token:user.access_token,
                email:user.email
            }
            verify(options,function (err,info) {
                if(err){
                    return res.status(500).json({error:err});
                }

                res.json({message:'邮件已发送，请验证'});
            });

        });
    });
}

//登陆
module.exports.login=function (req,res) {
    var username=req.body.username||req.params.username,
        password=req.body.password;
    res.setHeader('Access-Control-Allow-Origin','*');
    if(!username||!password){
        return res.status(400).json({error:'登陆信息不完整'});
    }
    User.findOne({username:username},function (err,user) {
        if(err){
            return res.status(500).json({error:err});

        }
        if(!user||!user.validPassword(password)){
            return res.status(401).json({error:'用户名或密码错误'});
        }
        res.json(user.toJSON({virtuals:true}));
    });
}

//激活
module.exports.confirm=function (req,res) {
    var username=req.params.username||req.query.username
    if(!username||!req.query.access_token){
        return res.status(400).json({error:'缺少参数'});
    }
    User.find({username:req.query.username},function (err,user) {
        if(err){
            return res.status(400).json({error:err});
        }
        else if(!user){
            return res.status(400).json({error:'找不到该用户'});
        }
        else{
            User.update({username:req.query.username},{$set:{is_verified:true}},function (err) {
                if(err){return res.status(500).json({error:'认证失败'});}
                res.status(500).json({message:'激活成功'});
            });
        }
    });
}

//发送验证邮件
function verify(options,cb) {
    options.protocal=options.protocal||'http';
    options.host=options.host||"localhost";
    options.port=options.port||3000;
    if(!options.username||!options.email){
        cb({error:'send email fail for missing username or email'});
    }
    else{
        var verifyHref=options.protocal+'://'+options.host+':'+options.port+'/users/'+options.username+'/confirm/?&access_token='+options.access_token;

        var contents={
            to:options.email,
            html:verifyHref,
            text:'Thanks for registering'
        };
        sendMail(mailConfig,contents,cb);
    }
}


//todo：登出
module.exports.logout=function (req,res) {

}

//发送邮件
function  sendMail(fromOptions,contents,cb) {
    var transporter=nodemailer.createTransport(fromOptions);

    var mailOptions={
        type:"email",
        to:contents.to,
        from:fromOptions.auth.user,
        subject:"Thanks for registering",
        html:'<a href='+contents.html+'>'+contents.text+'</a>'
    };
    transporter.sendMail(mailOptions,cb);
}


