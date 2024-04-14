require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('node:dns');

// Basic Configuration
const port = process.env.PORT || 3000;

const mongoose = require('mongoose');
const { error } = require('node:console');

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true,
    unique: true
  },
  short_url: {
    type: Number,
    required: true,
    unique: true
  }
});

let Url = mongoose.model('Url', urlSchema);

var urlEncodedParser = bodyParser.urlencoded({ extended: false });

app.use(urlEncodedParser);

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

app.post("/api/shorturl", (req, res) => {
  try {
    var urlObject = new URL(req.body.url);
    dns.lookup(urlObject.hostname, (err, address, family) => {
      console.log(address);
      if(!address) {
        res.json({ error: "Invalid URL"})
      } 
      else{
        let original_url = urlObject.href;
        var url = new Url({
          original_url: original_url,
          short_url: -1
        });

        Url.findOne({original_url: original_url}).then( (urlObj) => {
          // console.log(urlObj);
    
          if(urlObj != null) {
            url.short_url = urlObj.short_url;
            res.json({original_url: url.original_url, short_url: url.short_url});
          } else{
            Url.find({}).sort({ short_url: -1 }).limit(1).then( (urlCount) => {
              // console.log(urlCount[0].short_url);
          
              url.short_url = urlCount[0].short_url + 1;
              // console.log(url.short_url);
          
              url.save(function(err, data){
                if(err) {
                  throw new error("There's been a problem with the saving in the database. Please try again.");
                } else {
                  res.json({original_url: url.original_url, short_url: url.short_url});
                }
              });
            });
          }
        });
      }
    })
  }
  catch {
    res.json({ error: "Invalid URL"});
  }
});

app.get("/api/shorturl/:short", (req, res) => {
  // console.log(req.params.short);
  Url.findOne({short_url: req.params.short}).then( (url) => {
    // console.log(url);
    res.redirect(url.original_url);
  })
});