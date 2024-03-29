'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
const isValidUrl = require('valid-url');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use(bodyParser.urlencoded({ extended: false} ));

let urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});

let Url = mongoose.model('Url', urlSchema);

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api/shorturl/:shortener", async (req, res) => {
  const shortUrl = await Url.find({short_url: req.params.shortener});
  console.log(shortUrl[0].original_url);
  res.redirect(301, shortUrl[0].original_url);
});

app.post('/api/shorturl/new', async (req, res) => {
  
  let {url} = req.body;
  
  const address = await isValidUrl.isUri(url);
  console.log(address)
  
  if (!address) {
    res.json({error: 'invalid URL'})
  } else {
    
    const duplicateData = await Url.find({original_url: `${url}`});
    console.log(duplicateData.length)
  
    if(duplicateData.length > 0) {
    console.log(duplicateData.length)
    const {original_url, short_url} = duplicateData[0];
    return res.json({original_url, short_url})
    }
  
    if (duplicateData.length < 1) {
      
      let shortUrl = await Url.find({starter: 'shortUrlStart'});
      
      let update = await Url.findOneAndUpdate({starter: 'shortUrlStart'}, {short_counter: shortUrl[0].short_url += 1})
      
      shortUrl = await Url.find({starter: 'shortUrlStart'});
      console.log(shortUrl);
      
      const saveUrl = await Url.create({
      original_url: `${req.body.url}`,
      short_url: `${shortUrl[0].short_url + 1}`
    });
      console.log(`save ${saveUrl}`)
      
      const duplicateData = await Url.find({original_url: `${url}`});
      const {original_url, short_url} = duplicateData[0];
      return res.json({original_url, short_url})

    }
  
  }
  
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});