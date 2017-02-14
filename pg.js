/**
 * Created by lj on 16-11-29.
 */
var pg=require('pg');
var config=require('./config');


module.exports.queryWithParame=function (sql,parames,cb) {
    pg.connect(config.pg,function (err,client) {
        if(err){
            console.error('connnection to pg error:'+err);
            cb(err);
        }
        client.query(sql,parames,function (err2,result) {
            if(err2){
                cb(err2);
            }
            else{
                cb(null,result);
            }
        });
    });
}

module.exports.queryWithoutParame=function (sql,cb) {
    pg.connect(config.pg,function (err,client) {
        if(err){
            console.error('connnection to pg error:'+err);
            cb(err);
        }
        client.query(sql,[],function (err2,result) {
            if(err2){
                cb(err2);
            }
            else{
                cb(null,result);
            }
        });
    });
}

var url = require('url')
var pg_config=require('./config').pg;
var params = url.parse(pg_config);
var auth = params.auth.split(':');

module.exports.config = {
    user: auth[0],
    password: auth[1],
    host: params.hostname,
    port: params.port,
    database: params.pathname.split('/')[1],
    ssl: true
};

