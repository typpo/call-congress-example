const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const twilio = require('twilio');

// Set up and configure the server.
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Twilio will load this route when you receive a new call.
app.post('/new_phone_call', (req, res) => {
  // Construct our phone response.
  const call = new twilio.TwimlResponse();
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

app.post('/redirect_to_congress', (req, res) => {
  // Get the zip code digits inputted by the user.
  const zip = req.body.Digits;
  request('https://congress.api.sunlightfoundation.com/legislators/locate?apikey=YOUR_API_KEY_HERE&zip=' + zip, (err, resp, body) => {
    // A list of objects that represent members of Congress.
    const people = JSON.parse(body).results;

    const call = new twilio.TwimlResponse();
    people.forEach((person) => {
      const name = person.first_name + ' ' + person.last_name;
      call.say('Now connecting you with ' + name);
      call.dial(person.phone);
    });

    // Send it all back to the caller.
    res.status(200).type('text/xml').send(call.toString());
  });
});

app.listen(3000);
