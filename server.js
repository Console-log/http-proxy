var http=require('http');
var url=require('url');
var path=require('path');
var fs=require('fs');

var conf=require('./config/config');
var mime=require('./mime/mime');

var port=process.argv[2]||8080;

var server=http.createServer(function(req,res){
    var request;
    var body='';
    var local_path='';
    var content_type='';
    var file_ext='';
    var addr=url.parse(req.url);
    var ext_reg=/^.(js|html|css)/;
    var options = {
        hostname:addr.hostname,
        port:addr.port||80,
        method: req.method,
        path:addr.path,
        headers:req.headers
    };

    if(addr.href.match(conf.host+conf.host_path) && ext_reg.test(path.parse(req.url).ext) && path.parse(addr.pathname).name!='config'){
        local_path=path.join(conf.local,addr.pathname.replace(conf.host_path,''));
        console.log(local_path);

        fs.exists(local_path,function(re){
            if(re){
                fs.readFile(local_path, function(err,file) {
                    if (err) {
                        res.writeHead(500, {'Content-Type': 'text/plain'});
                        res.end(err);
                    } else {
                        file_ext=path.parse(req.url).ext.slice(1);
                        content_type=mime[file_ext]||'text/plain';
                        res.writeHead(200, {'Content-Type': content_type});
                        res.end(file);
                    };
                });
            }else{
                res.writeHead(404, {'Content-Type': 'text/plain'});
                res.end();
            };
        });
        return;
    }
    request=http.request(options,function (_res) {
        var data=[];
        var size=0;
        _res.on('data', function(chunk) {
            data.push(chunk);
            size+=chunk.length;
        }).on('end',function(){
            var req_data=Buffer.concat(data,size);
            res.writeHead(_res.statusCode,_res.headers);
            res.end(req_data);
        });
    }).on('error',function(err){
        console.log(addr.path,err);
        res.end('<h1 style="text-align:center;margin-top:50px">Request Error<h1>');
    });
    if(req.method=='POST'){
        req.on('data',function (data) {
            body+=data;
        }).on('end',function () {
            request.write(body);
            request.end();
        });
    }else{
        request.end();
    };
});

server.listen(port,function () {
    console.log('Node listen '+port+'...');
});

server.on('error',function(err){
    console.log(err)
})
