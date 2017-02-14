/**
 * Created by lj on 16-12-8.
 */
var fs=require('fs');
var exec=require('child_process').exec;
var formats=['.geojson','.zip','.csv','.txt'];
var step=require('step');
var admZip=require('adm-zip');
var path=require('path');
var tmp=require('tmp');
var sourceSchema=require('../models/sourceModel');
var pg=require('../pg');
var helper=require('./helper');
var _=require('lodash');

module.exports.uploads=function (req,res) {
    var username=req.params.username||"public";
    var filePath=req.files[0].path;//路径+文件名
    var size=req.files[0].size;//文件大小
    var oriname=req.files[0].originalname;
    var filename=oriname.slice(0,oriname.lastIndexOf('.'));//文件名    eg:data
    var format=path.extname(oriname);//后缀  eg:.zip

    if(formats.indexOf(format)==-1){
        fs.unlink(filePath);
        return res.status(400).json({error:'文件格式不支持'});
    }
    else{
        if(format=='.zip'){
            step(
                function Unzip() {
                    var zip=new admZip(filePath);
                    var zipEntity=zip.getEntries();
                    var fileDir=path.join('./temp/'+filename);
                    zip.extractAllTo(fileDir,true);
                    this(null,fileDir,zipEntity);
                },
                function write2DB(err,fileDir,zipEntity) {
                    if(err){
                        res.status(500).json({error:err});
                    }
                    var count=0;
                    var group = this.group();
                    zipEntity.forEach(function (obj) {
                        if(path.extname(obj.entryName)=='.shp'){  //eg:obj.entryName="data/boua.shp"
                            count++;
                            shp2db(obj.entryName,{fileDir:fileDir,username:username},group());
                        }
                        else if(path.extname(obj.entryName)=='.csv'||path.extname(obj.entryName)=='.geojspn'){
                            count++;
                            copyto(obj.entryName,{fileDir:fileDir,username:username},'./uploads/sources/',group());
                            // copyto(fileDir,obj.entryName,'./uploads/sources/');
                        }
                    });
                    if(count==0){
                        this('invalid file type',[fileDir]);
                    }
                },
                function delFile(err,fileDir) {
                    if(err){
                        res.status(500).json({error:err});
                    }
                    else{
                        res.status(200).json('ok');
                    }
                    if(fileDir&&fileDir.length>0){
                        exec('rm -r '+fileDir[0],function (err) {
                            if(err){
                                console.log(fileDir+' delete error');
                            }
                        });
                    }
                });
        }
        else if(format=='.csv'){
            copyto(obj.entryName,{fileDir:fileDir,username:username},'./uploads/sources/');
        }
        else if(format=='.geojson'){
            copyto(obj.entryName,{fileDir:fileDir,username:username},'./uploads/sources/');
        }
    }
}

module.exports.list=function (req,res) {
    var username=req.params.username;
    res.header("Access-Control-Allow-Origin", "*");
    sourceSchema.find({belongto:username},function (err,sources) {
        if(err){
            return res.status(500).json({error:err});
        }
        else if(!sources){
            return res.status(404).json({error:'there is no source,please upload'});
        }
        else{
            var keys=['belongto','name','keys'];
            var result=sources.map(function (source) {
                return _.pick(source,keys);
            })

            return res.status(200).json(result);
        }
    });
}

module.exports.info=function (req,res) {
    var username=req.params.username;
    var sourcename=req.params.sourcename;
    sourceSchema.find({belongto:username,name:sourcename},function (err,source) {
        if(err){
            return res.status(500).json({error:err});
        }
        else if(!source){
            return res.status(404).json({error:'can not find source'});
        }
        else{
            var keys=['belongto','name','keys'];
            return res.status(200).json(_pick(source,keys));
        }
    });
}

function shp2db(filename,options,cb) {
    var fileDir=options.fileDir?options.fileDir:'';
    var username=options.username?options.username:'public';
    var psql=' | psql '+'"'+' host='+pg.config.host+
                          ' dbname='+pg.config.database+
                          ' port='+pg.config.port+
                          ' user='+pg.config.user+
                          ' password='+pg.config.password+
        '"';
    var filepath=path.join(fileDir,filename);
    var dbname=path.basename(filepath).split('.')[0];
    var cmd='/usr/bin/shp2pgsql -s 3857 -d -g geom -I -D '+filepath+' '+dbname+psql;
    exec(cmd,null,function (err) {
        if(err){
            cb(err,fileDir);
        }
        else{
            save2list(dbname,'postgis',{username:username},function (err) {
                if(err){
                    cb(err,fileDir);
                }
                else{
                    cb(null,fileDir);
                }
            });

        }
    });
}

function copyto(filename,toDir,options,cb) {
    var fileDir=''||options.fileDir;
    var username=options.username?options.username:'public';
    fs.exists(toDir,function (exists) {
        if(!exists){
            fs.mkdir(toDir);
        }
        var filepath=path.join(fileDir,filename);
        var name=path.basename(filename);
        var readStream=fs.createReadStream(filepath);
        var writeStream=fs.createWriteStream(path.join(toDir,name));
        readStream.pipe(writeStream);
        var type=path.extname(filename).slice(1);
        save2list(filename,type,{base:toDir,username:username},function (err) {
            if(err){
                cb(err,fileDir);
            }
            else{
                cb(null,fileDir);
            }
        })
    });
}
//csv

//postgis
function get2postgis(dbname){
    var obj={};
    obj['type']='postgis';
    obj['host']=pg.config.host;
    obj['port']=pg.config.port;
    obj['user']=pg.config.user;
    obj['password']=pg.config.password;
    obj['dbname']=pg.config.database;

    obj['table']=dbname;
    obj['geometry_field']='geom';
    obj['srid']='3857';
    return obj;
}

function get2file(type,filepath,options) {
    var obj={};
    obj['type']=type;
    obj['file']=filepath;
    if(options&&options.base){
        obj['base']=options.base;
    }
    return obj;
}

function getKeys(tbname,cb) {
    var sql="select column_name,data_type from information_schema.columns where table_name ="+"'"+tbname+"'";
    pg.queryWithoutParame(sql,function (err,result) {
        if(err){
            cb(err);
        }
        else{
            cb(null,result.rows);
        }
    });
}

function save2list(name,type,options,cb) {
    var keys={};
    var linking={};
    var username=options.username?options.username:'public';
    if(type=='postgis'){
        var dbname=name;
        if(name.indexOf('.')!==-1){
            dbname=path.basename(filepath).split('.')[0];
        }
        getKeys(dbname,function (err,rows) {
            if(err){
                cb(err);
            }
            else{
                rows.forEach(function (e) {
                    var key=e['column_name'];
                    var type=e['data_type'];
                    keys[key]=type;
                });
                linking=get2postgis(dbname);
                insert2list(dbname,keys,linking,username,function (err) {
                    if(err){
                        cb(err);
                    }
                    else{
                        cb(null);
                    }
                });
            }
        });
    }
    else if(type=='csv'||type=='geojson'){
        linking=get2file(type,name,options);
        insert2list(dbname,keys,linking,username,function (err) {
            if(err){
                cb(err);
            }
            else{
                cb(null);
            }
        });
    }
}

function insert2list(name,keys,linking,belongto,cb) {
    var newSource=new sourceSchema({
        name:name,
        belongto:belongto,
        keys:keys,
        linking:linking
    });
    newSource.save(function (err,source) {
        if(err){
            cb(err);
        }
        else{
            cb(null);
        }
    });
}
//todo:import csv,geojson to pg
function csv2db() {

}

function geojson2db() {

}
//**function***generate datasource parameter
//**@sourceid***
//**@username***
function getDatasource(sourcename,username,options,cb) {
    sourceSchema.find({belongto:username,name:sourcename},function (err,sources) {
        if(err){
            cb(err);
        }
        else if(sources.length>0){
            var linking=sources[0].linking;
            var keys=sources[0].keys;
            var parray=[];
            var count=0,counts=Object.keys(linking).length;
            for(var p in linking){
                var para={};
                if(linking.type=='postgis'&&p=='table'&&options.filter&&options.filter.length>0){
                    para['@name'] = 'table';
                    var sql='(select * from '+linking[p]+' where '+options.filter+') as data';
                    para['#text']=sql;
                }
                else {
                    para['@name'] = p;
                    para['#text'] = linking[p];
                }
                parray.push(helper.objCopy(para));
                count++;
            }
            if(count>=counts){
                cb(null,parray,keys);
            }
        }
        else{
            cb('source '+sourcename+' do not exist');
        }

    });
}

module.exports.getDatasource=getDatasource;
