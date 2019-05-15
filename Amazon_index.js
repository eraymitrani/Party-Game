exports.handler = (event, context) => {

  try {
    var session = event.session;
    event.attributes = [];
    
    if (event.session.new) {
      // New Session
      console.log("NEW SESSION")
    }

    switch (event.request.type) {

      case "LaunchRequest":
        // Launch Request
        console.log(`LAUNCH REQUEST`);

        context.succeed(
          generateResponse(
            buildSpeechletResponse("Party Game! Are you ready?", false)
          )
        );
        break;

      case "IntentRequest":
        // Intent Request
        console.log("YES INTENT REQUEST");

        switch(event.request.intent.name) {
          case "AMAZON.YesIntent":
            getProductsAndEntitlements(event, context, handleYesIntent);
            break;
          case "AMAZON.NoIntent":
            getProductsAndEntitlements(event, context, handleNoIntent);
            break;
          case "BuySkillItemIntent":
            getProductsAndEntitlements(event, context, handleBuySkillItemIntent);
            break;
          case "WhatDidIBuyIntent":
            getProductsAndEntitlements(event, context, handleWhatDidIBuyIntent);
            break;
          case "AMAZON.HelpIntent":
            getProductsAndEntitlements(event, context, handleHelpIntent);
            
            break;
          case "AMAZON.CancelIntent":
            buildResponse(context,"",true);
            break;
          case "AMAZON.StopIntent":
            buildResponse(context,"",true);
            break;          
          default:
            buildResponse(context,"Invalid intent",true);
            throw "Invalid intent"
        }
        break;
      case "SessionEndedRequest":
        // Session Ended Request
        console.log(`SESSION ENDED REQUEST`)
        break;
      case "Connections.Response":
        if (event.request.payload.purchaseResult === "ACCEPTED") {
          buildResponse(context,"Expansion unlocked! Here is the first rule: " + premiumActions[0] + " Enjoy!", false);
        }
        else {
          buildResponse(context,"Alright, maybe next time...", true);
        }
        break;
      default:
        context.fail(`INVALID REQUEST TYPE: ${event.request.type}`)

    }

  } catch(error) { context.fail(`Exception: ${error}`) }

}

// Helpers
buildSpeechletResponse = (outputText, shouldEndSession) => {

  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    shouldEndSession: shouldEndSession
  }
}

buildSpeechletReprompt = (outputText, shouldEndSession) => {
  return {
    reprompt: {
      outputSpeech: {
        type: "PlainText",
        text: outputText
      },
      shouldEndSession: shouldEndSession
    }
  }
}

generateResponse = (speechletResponse, sessionAttributes) => {
  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  }
}

buildResponse = (context, output, shouldEndSession) => {
  context.succeed(
    generateResponse(
      buildSpeechletResponse(output, shouldEndSession)
    )
  );
}

buildReprompt = (context, output) => {
  context.succeed(
    generateResponse(
      buildSpeechletReprompt(output, false)
    )
  );
}

function getProductsAndEntitlements(event, context, callback) {
  console.log(event);
    if (event.attributes.areProductsLoaded === undefined) {
      event.attributes.areProductsLoaded = false;
    }
    // Invoke the entitlement API to load products only if not already cached
    if (!event.attributes.areProductsLoaded)    {
        event.attributes.inSkillProducts = [];
        var returnData = [];

        // Information required to invoke the API is available in the session
        const https = require('https');
        const apiEndpoint = "api.amazonalexa.com";
        const token  = "bearer " + event.context.System.apiAccessToken;
        const language    = event.request.locale;

        // The API path
        const apiPath     = "/v1/users/~current/skills/~current/inSkillProducts";

        const options = {
            host: apiEndpoint,
            path: apiPath,
            method: 'GET',
            headers: {
                "Content-Type"      : 'application/json',
                "Accept-Language"   : language,
                "Authorization"     : token
            }
        };

        // Call the API
            const req = https.get(options, (res) => {
            res.setEncoding("utf8");

            if(res.statusCode != 200)   {
                console.log("InSkillProducts returned status code " + res.statusCode);
                // self.emit(":tell", "Something went wrong in loading the purchase history. Error code " + res.code );
            }

            res.on('data', (chunk) => {
                console.log("Chunk:" + chunk);
                    returnData += chunk;
            });

            res.on('end', () => {
                var inSkillProductInfo = JSON.parse(returnData);
                if(Array.isArray(inSkillProductInfo.inSkillProducts))  
                    event.attributes.InSkillProducts = inSkillProductInfo.inSkillProducts;
                else
                    event.attributes.InSkillProducts=[];

                console.log("Product list loaded:" + JSON.stringify(event.attributes.InSkillProducts));
                callback(event, context, event.attributes.InSkillProducts);
            });   
        });

        req.on('error', (e) => {
            console.log('Error calling InSkillProducts API: ' + e.message);
            // self.emit(":tell", "Something went wrong in loading the product list. Error code " + e.code + ", message is " + e.message);
        });

    } // End if (!self.attributes.areProductsLoaded) {}
    else    {
        console.log("Product info already loaded.");
        callback(event, context, event.attributes.InSkillProducts);
        return;
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

function handleYesIntent(self, context, inSkillProductList) {
    if (!inSkillProductList)    {
        console.log("Something went wrong in loading product list.");
    }
    // Do something with the retrieved product list
    var hasPremiumRules = inSkillProductList[0]['entitled'] === "ENTITLED";
    console.log("Premium?: " + hasPremiumRules);
    var totalOptions = soloActions.length + doubleActions.length + groupActions.length + miniGameActions.length;
    if (hasPremiumRules) {
      totalOptions += premiumActions.length*2;
    }

    var randomNum = getRandomInt(0, totalOptions);
    var remainingOptions = totalOptions - soloActions.length;
    if (randomNum >= remainingOptions) { // Single
      var actionIndex = getRandomInt(0, soloActions.length);
      buildResponse(context, "If you have, " + 
        getRandomCard(suits, ranks) + ", " + soloActions[actionIndex] + 
        ". Next?", false);
    }
    remainingOptions = remainingOptions - doubleActions.length;
    if (randomNum >= remainingOptions) { // Double
      var actionIndex = getRandomInt(0, doubleActions.length); 
      buildResponse(context, "If you have, " + 
        getRandomCard(suits, ranks) + ", " + doubleActions[actionIndex] + 
        " the person who has " + getRandomCard(suits, ranks) + ". Next?", false);
    }
    remainingOptions = remainingOptions - groupActions.length;
    if (randomNum >= remainingOptions) { // Group
      var actionIndex = getRandomInt(0, groupActions.length); 
      buildResponse(context, groupActions[actionIndex] + " Next?", false);
    }
    remainingOptions = remainingOptions - miniGameActions.length;
    if (randomNum >= remainingOptions) { // Versus
      var actionIndex = getRandomInt(0, miniGameActions.length);
      buildResponse(context, "Loser drinks! The person who has " + getRandomCard(suits, ranks) + 
        ", " + miniGameActions[actionIndex] + " the person who has " + 
        getRandomCard(suits, ranks) + ". Next?", false);
    }
    remainingOptions = remainingOptions - premiumActions.length*2;
    if (randomNum >= remainingOptions) { // Versus
      var actionIndex = getRandomInt(0, premiumActions.length);
      buildResponse(context, "New rule set: " + premiumActions[actionIndex] + " Next?", false);
    }
}

function handleNoIntent(self, context, inSkillProductList) {
  if (!inSkillProductList)    {
    console.log("Something went wrong in loading product list.");
  }
  var hasPremiumRules = inSkillProductList[0]['entitled'] === "ENTITLED";
  var exitResponses = [
    "Launch me again when you are ready!",
    "Thanks for playing!",
    "Thanks! If you enjoyed playing please rate me in the Alexa app.",
    "See you next time!",
    "Hope to see you again soon!",
    "Alright, I wish you had fun!"
  ];
  if (!hasPremiumRules) {
    exitResponses.push("You might want to give our premium expansion pack a try next time!");
  }
  var randomNum = getRandomInt(0, exitResponses.length);
  buildResponse(context, exitResponses[randomNum], true);
}

function handleBuySkillItemIntent(self, context, inSkillProductList) {
  if (!inSkillProductList)    {
    console.log("Something went wrong in loading product list.");
  }
  var hasPremiumRules = inSkillProductList[0]['entitled'] === "ENTITLED";
  if (hasPremiumRules) {
    buildResponse(context, "You already have all the expansions I have available.", false);
  }
  else {
    if (!event.request.intent.slots.ProductName.value) {
      buildResponse(context, "I have an expansion pack available called Party Game Plus. If you would like to buy it, say: Buy Party Game Plus.", false);
    }
    else {
      context.succeed({
        version: '1.0',
        response: {
          directives: [
            {
              type: 'Connections.SendRequest',
              name: 'Buy',
              payload: {
                InSkillProduct: {
                  productId: 'amzn1.adg.product.4a967b61-6d2c-4f83-97f9-c97a6aa7bd7a'
                }
              },
              token: 'someRandomCorrelationToken'
            }
          ],
          shouldEndSession: true
        }
      });
    }
  }
}

function handleWhatDidIBuyIntent(self, context, inSkillProductList) {
  if (!inSkillProductList)    {
    console.log("Something went wrong in loading product list.");
  }

  var hasPremiumRules = inSkillProductList[0]['entitled'] === "ENTITLED";
  if (hasPremiumRules) {
    buildResponse(context, "You have purchased the Rules Pack expansion.", false);
  }
  else {
    buildResponse(context, "You have no purchased expansions at the moment.", false);
  }

}

function handleHelpIntent(self, context, inSkillProductList) {
  if (!inSkillProductList)    {
    console.log("Something went wrong in loading product list.");
  }

  var hasPremiumRules = inSkillProductList[0]['entitled'] === "ENTITLED";
  var helpMessage = "Deal an entire deck of cards to all players. " +
                    "Wait for everyone to sort their hands and sit down. " + 
                    "When you are ready, say launch Party Game and follow the instructions. ";
  if (hasPremiumRules) {
      helpMessage += "The premium pack adds a single master rule until a new one is set." + 
                     "Call on anyone that forgets the rule and make them drink.";
  }
  buildResponse(context, helpMessage + " Have fun!", false);
}

const suits = ["spades", "hearts", "clubs", "diamonds"];
const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, "Jack", "Queen", "King", "Ace"];
const soloActions = [
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
const doubleActions = [
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
const groupActions = [
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
const miniGameActions = [
  "Play rock, paper, scissors versus",
  "Play red hands versus",
  "Play thumb wars versus",
  "Enter a staring contest versus."
];
const premiumActions = [
  "The word 'drink' is forbidden. If someone says the word 'drink', they have to take a sip.",
  "First names are forbidden. If you call someone by their first name you have to take a sip.",
  "The last person who took a drink is now muted. If they speak to anyone they have to take a sip.",
  "The last person who took a drink is now the question master. Anyone who answers a question posed by the target has to take a sip.",
  "Everyone has to touch their nose before drinking. If you forget, you have to take two sips."
];
