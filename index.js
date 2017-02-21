var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var twilio = require('twilio');

// Set up and configure the server.
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Twilio will load this route when you receive a new call.
app.post('/new_phone_call', function(req, res) {
  // Construct our phone response.
  var call = new twilio.TwimlResponse();
  call.say('Thanks for calling.  Enter your zip code to be connected with your senators and representatives.');
  call.gather({
    numDigits: 5,
    timeout: 30,
    action: 'redirect_to_congress',
    method: 'POST',
  });

  // Send phone response back to Twilio.
  res.status(200).type('text/xml').send(call.toString());
});

app.post('/redirect_to_congress', function(req, res) {
  // Get the zip code digits inputted by the user.
  var zip = req.body.Digits;
  request('https://congress.api.sunlightfoundation.com/legislators/locate?apikey=YOUR_API_KEY_HERE&zip=' + zip, function(err, resp, body) {
    // A list of objects that represent members of Congress.
    var people = JSON.parse(body).results;

    var call = new twilio.TwimlResponse();
    people.forEach(function(person) {
      var name = person.first_name + ' ' + person.last_name;
      call.say('Now connecting you with ' + name);
      call.dial(person.phone);
    });

    // Send it all back to the caller.
    res.status(200).type('text/xml').send(call.toString());
  });
});

app.listen(3000);
