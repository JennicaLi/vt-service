/**
 * Created by lj on 16-12-22.
 */
var xmlbuilder=require('xmlbuilder');
var fs=require('fs');
var source=require('./sources');
var helper=require('./helper');
var xmlbuilder=require('xmlbuilder');
var tilelive=require("tilelive");
var Bridge=require('tilelive-bridge');
// var filesniffer=require('mapbox-file-sniff');
require("tilelive-modules/loader")(tilelive);

var mongoose=require('mongoose');
var tileSchema=require('../models/tileSchema');
var exec=require('child_process').exec();
var config=require('../config');


var srsString='+init=epsg:3857';
var extentString='-20037508.34,-20037508.34,20037508.34,20037508.34';



module.exports.generateTile=function (req,res) {
    var opts = {
        type: 'scanline',
        retry: 2,
        timeout: 3600000,
        close: true
    }
    var obj=helper.objCopy(req.body);
    obj.tileset_id=req.params.tileset_id;
    obj.username=req.params.username;
    getConfig(obj,function (err,xml) {
        if(err){console.log(err);}
        else{
            // var tileset=mongoose.model(req.params.tileset_id,tileSchema);
            new Bridge({xml:xml},function (err,source) {
                if(err){res.status(400).json(err);}
                else{
                var dst='foxgis+'+config.DB+'?tileset_id=' + obj.tileset_id;
                tilelive.copy(source,dst,opts,function (err,data) {
                    if(err){res.status(400).json(err);}
                    else{
                        res.status(200).json({message:'ok'});
                    }
                });
                }
            })
        }
    })
}


function getConfig(obj,cb) {
    var minzoom=obj.minzoom||0;
    var maxzoom=obj.maxzoom||10;
    var bounds=obj.extent||[-180,-90,180,90];
    var username=obj.username;
    var tileset_id=obj['tileset_id'];
    var layers=obj.layers||[];
    var center=obj.center||[0,0,0];
    var format=obj.format||'pbf';

    var xml_obj={Map:{Parameters:{},Layer:[]}};

   // initialize Map
    xml_obj.Map['@srs']=srsString;
    xml_obj.Map['@maximum-extent']=extentString;
    xml_obj.Map['@buffer-size']=8;

    var Parameter=[
        { '@name': 'bounds', '#text': bounds.join() },
        { '@name': 'center', '#text': center.join() },
        { '@name': 'format', '#text': format },
        { '@name': 'minzoom', '#text': minzoom },
        { '@name': 'maxzoom', '#text': maxzoom },
        { '@name': 'json', '#text': {vector_layers:[]}}
    ];
    var vector={vector_layers:[]};
    // xml_obj.Map.Parameters.Parameter=Parameter;
    var count=0,counts=layers.length;
    layers.forEach(function (layarr) {
        var name=layarr.name;
        var filter=layarr.filter||'';
        var layer={};
        layer['@name']=name;
        layer['@srs']=srsString;
        layer['Datasource']={};
        source.getDatasource(name,username,{filter:filter},function (err,result,keys) {
            if(err){cb(err);}
            else{
                layer['Datasource']['Parameter']=result;
                xml_obj.Map.Layer.push(helper.objCopy(layer));
                var layer_key={};
                layer_key.id=name;
                layer_key['fields']=keys;
                vector['vector_layers'].push(helper.objCopy(layer_key));
                count++;
            }
            if(count>=counts){
                Parameter[5]['#text']=JSON.stringify(vector);
                xml_obj.Map.Parameters.Parameter=Parameter;
                var xml=xmlbuilder.create(xml_obj).end();
                cb(null,xml);
            }
        });
    });
    // return xml_obj;
    // cb(null,xml_obj)
}
//


// require('../db');
// var obj={
//     username:'test',
//     tile_set:'admin',
//     minzoom:0,
//     maxzoom:6,
//     layers:[
//         {name:'boua',
//             filter:''
//         },
//         {name:'boua_dist',
//             filter:'gb=420100'
//         }
//     ]
// }
//
//
// getConfig(obj,function (err,data) {
//     if(err) {
//         console.log(err);
//     }
//     else{
//         var xml=xmlbuilder.create(data).end();
//         console.log(xml);
//     }
// });