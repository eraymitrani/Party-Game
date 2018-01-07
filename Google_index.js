'use strict';

const functions = require('firebase-functions'); // Cloud Functions for Firebase library
const DialogflowApp = require('actions-on-google').DialogflowApp; // Google Assistant helper library

const googleAssistantRequest = 'google'; // Constant to identify Google Assistant requests
var suits = ["spades", "hearts", "clubs", "diamonds"];
var ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, "Jack", "Queen", "King", "Ace"];
    var soloActions = [
      "stand up",
      "squat for 15 seconds or drink",
      "sit down",
      "do 5 push ups or drink",
      "do 5 crunches or drink",
      "drink with anyone you choose",
      "drink",
      "remain silent for three rounds",
      "pick a person to mute for three rounds",
      "do 5 jumping jacks or drink",
      "drink if you have an ace",
      "give your aces to anyone you choose",
      "spin yourself around 5 times"
    ];
    var doubleActions = [
      "slap",
      "drink with",
      "swap drinks with",
      "jump with",
      "dab with",
      "make a toast and drink with",
      "dance with",
      "give a ten second back massage to",
      "high five with",
      "take one random card from",
      "take a selfie with",
      "swap places with",
      "swap hands with",
      "give one of your cards to"
    ];
    var groupActions = [
      "Everyone drink!",
      "Everyone drink!",
      "Everyone standing, drink!",
      "Everyone sitting, drink!",
      "Last one who does this drinks. 3, 2, 1, Jump!",
      "Last one who does this drinks. 3, 2, 1, Clap!",
      "Last one who does this drinks. 3, 2, 1, Squat!",
      "Last one who does this drinks. 3, 2, 1, Touch your nose!",
      "Last one who does this drinks. 3, 2, 1, Touch the ground!",
      "Last one who does this drinks. 3, 2, 1, Touch your feet!",
      "Drink for every Ace in your hand and give your Aces to someone else."
    ];
    var miniGameActions = [
      "Play rock, paper, scissors versus",
      "Play red hands versus",
      "Play thumb wars versus",
      "Enter a staring contest versus"
    ];
//var recent = 'Play a round first.';

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body));

  // An action is a string used to identify what needs to be done in fulfillment
  let action = request.body.result.action; // https://dialogflow.com/docs/actions-and-parameters

  // Parameters are any entites that Dialogflow has extracted from the request.
  const parameters = request.body.result.parameters; // https://dialogflow.com/docs/actions-and-parameters

  // Contexts are objects used to track and store conversation state
  const inputContexts = request.body.result.contexts; // https://dialogflow.com/docs/contexts

  // Get the request source (Google Assistant, Slack, API, etc) and initialize DialogflowApp
  const requestSource = (request.body.originalRequest) ? request.body.originalRequest.source : undefined;
  const app = new DialogflowApp({request: request, response: response});

  // Create handlers for Dialogflow actions as well as a 'default' handler
  const actionHandlers = {
    // The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
    'input.welcome': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        sendGoogleResponse('Party Card Game! Are you ready to play?'); // Send simple response to user
      } else {
        sendResponse('Party Card Game! Are you ready to play?'); // Send simple response to user
      }
    },
     'input.yes': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
       		var totalOptions = soloActions.length + doubleActions.length + groupActions.length + miniGameActions.length;

            var randomNum = getRandomInt(0, totalOptions);
            var remainingOptions = totalOptions - soloActions.length;
            if (randomNum >= remainingOptions) { // Single
              var actionIndex = getRandomInt(0, soloActions.length);
              sendResponse('If you have, ' + getRandomCard(suits, ranks) + ', ' + soloActions[actionIndex] + '. Next?'); // Send simple response to user

            }
            remainingOptions = remainingOptions - doubleActions.length;
            if (randomNum >= remainingOptions) { // Double
              var actionIndex = getRandomInt(0, doubleActions.length); 
              sendResponse("If you have, " + 
                getRandomCard(suits, ranks) + ", " + doubleActions[actionIndex] + 
                " the person who has " + getRandomCard(suits, ranks) + ". Next?");
            }
            remainingOptions = remainingOptions - groupActions.length;
            if (randomNum >= remainingOptions) { // Group
              var actionIndex = getRandomInt(0, groupActions.length); 
              sendResponse(groupActions[actionIndex] + " Next?");
            }
            remainingOptions = remainingOptions - miniGameActions.length;
            if (randomNum >= remainingOptions) { // Versus
              var actionIndex = getRandomInt(0, miniGameActions.length);
              sendResponse("Loser drinks! The person who has " + getRandomCard(suits, ranks) + 
                ", " + miniGameActions[actionIndex] + " the person who has " + 
                getRandomCard(suits, ranks) + ". Next?");
            }
      
    },
    'input.help': () => {
     sendResponse('Deal an entire deck of cards to all players. Wait for everyone to sort their hands and sit down. When you are ready, say yes or launch Party Card Game again and follow the instructions. Have fun!')
    },
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'input.unknown': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        sendGoogleResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
      } else {
        sendResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
      }
    },
    // Default handler for unknown or undefined actions
  };

  // If undefined or unknown action use the default handler

  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();

  // Function to send correctly formatted Google Assistant responses to Dialogflow which are then sent to the user
  function sendGoogleResponse (responseToUser) {
    if (typeof responseToUser === 'string') {
      app.ask(responseToUser); // Google Assistant response
    } else {
      // If speech or displayText is defined use it to respond
      let googleResponse = app.buildRichResponse().addSimpleResponse({
        speech: responseToUser.speech || responseToUser.displayText,
        displayText: responseToUser.displayText || responseToUser.speech
      });

      // Optional: Overwrite previous response with rich response
      if (responseToUser.googleRichResponse) {
        googleResponse = responseToUser.googleRichResponse;
      }

      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      if (responseToUser.googleOutputContexts) {
        app.setContext(...responseToUser.googleOutputContexts);
      }

      app.ask(googleResponse); // Send response to Dialogflow and Google Assistant
    }
  }

  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse (responseToUser) {
    // if the response is a string send it as a response to the user
    if (typeof responseToUser === 'string') {
      let responseJson = {};
      responseJson.speech = responseToUser; // spoken response
      responseJson.displayText = responseToUser; // displayed response
      response.json(responseJson); // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      let responseJson = {};

      // If speech or displayText is defined, use it to respond (if one isn't defined use the other's value)
      responseJson.speech = responseToUser.speech || responseToUser.displayText;
      responseJson.displayText = responseToUser.displayText || responseToUser.speech;

      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      responseJson.data = responseToUser.richResponses;

      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      responseJson.contextOut = responseToUser.outputContexts;

      response.json(responseJson); // Send response to Dialogflow
    }
  }
  function getRandomCard(suits, ranks) {
     var randomRankIndex = getRandomInt(0, ranks.length);
     var randomSuitIndex = getRandomInt(0, suits.length);
      return ranks[randomRankIndex] + " of " + suits[randomSuitIndex];
    }
    
    function getRandomInt(min, max) {
     return Math.floor(Math.random() * (max - min)) + min;
    }
});
