function objCopy(obj) {
    var result={};
    for(var p in obj){
        if(obj[p] instanceof Object&&!(obj[p] instanceof Array)){
            result[p]=objCopy(obj[p]);
        }
        else{
            result[p]=obj[p];
        }
    }
    return result;
}

module.exports.objCopy=objCopy

