var mongo = require("mongodb").MongoClient;
var express = require("express");
var http = require("http");

var app = express();

app.get('/imagesearch/*', function(req, res) {
    var q = encodeURIComponent(req.originalUrl.split('/imagesearch/').join(''));
    var currentdate = new Date(); 
    var datetime = "Last Sync: " + currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
    
    http.get('http://duckduckgo.com/i.js?q=' + q + '&s=10', function(resp) {
        var data = '';
        
        resp.on('data', function(chunk) {
            data += chunk;
        });
        
        resp.on('end', function() {
            mongo.connect('mongodb://localhost:27017/img', function(err, db) {
                if(err) throw err;
                
                db.collection('searches').insertOne({
                    term: q,
                    when: datetime
                }, function(err, ins) {
                    if(err) throw err;
                    db.close();
                });
            });
            
            data = JSON.parse(data);
            res.json(data.results.slice(0,10).map(function(val) {
                return {
                    url: val.image,
                    snippet: val.title,
                    thumbnail: val.thumbnail,
                    context: val.url
                };
            }));
        });
    }).on('error', function() {
        res.end('Something went wrong!');
    });
});

app.get('/latest/imagesearch/', function(req, res) {
    mongo.connect('mongodb://localhost:27017/img', function(err, db) {
        if(err) throw err;
        
        db.collection('searches').find({}, {_id: 0}).sort({$natural:-1}).limit(10).toArray(function(err, arr) {
            if(err) throw err;
            res.json(arr);
        });
    });
});

app.listen(8080);