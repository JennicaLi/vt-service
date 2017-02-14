/**
 * Created by lj on 16-12-20.
 */
var Pool=require('pg-pool');

var url = require('url')
var pg_config=require('./config').pg;
var params = url.parse(pg_config);
var auth = params.auth.split(':');

var  config = {
    user: auth[0],
    password: auth[1],
    host: params.hostname,
    port: params.port,
    database: params.pathname.split('/')[1],
    ssl: true
};

var pool=new Pool(config);

pool.on('error', function(error, client) {
    // handle this in the same way you would treat process.on('uncaughtException')
    // it is supplied the error as well as the idle client which received the error
    console.log('pg-pool error'+error);
});