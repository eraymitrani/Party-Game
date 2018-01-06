exports.handler = (event, context) => {

  try {
    var session = event.session;
    var suits = ["spades", "hearts", "clubs", "diamonds"];
    var ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, "Jack", "Queen", "King", "Ace"];
    var soloActions = ["stand up",
                       "sit down",
                       "do 5 push ups",
                       "do 10 push ups",
                       "drink with anyone you choose",
                       "drink",
                       "remain silent for three rounds",
                       "pick a person to mute for three rounds",
                       "do 5 jumping jacks or drink",
                       "drink if you are wearing socks"];
    var doubleActions = ["hug",
                        "hold hands for 2 rounds with",
                        "slap",
                        "drink with",
                        "swap tshirts with",
                        "high five with",
                        "switch seats with",
                        "swap hands with"];
    var groupActions = ["Everyone drink!",
                        "Everyone standing, drink!",
                        "Last one who does this drinks. 3, 2, 1, Jump!",
                        "Last one who does this drinks. 3, 2, 1, Clap!",
                        "Last one who does this drinks. 3, 2, 1, Squat!",
                        "Drink for every Ace in your hand and give your Aces to someone else."]
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
            buildSpeechletResponse("Party Game! Are you ready to play?", false)
          )
        );
        break;

      case "IntentRequest":
        // Intent Request
        console.log("YES INTENT REQUEST");

        switch(event.request.intent.name) {
          case "AMAZON.YesIntent":
            var randomNum = getRandomInt(0,100);
            if(randomNum >= 66){
              var actionIndex = getRandomInt(0, soloActions.length);
              buildResponse(context, "If you have, " + getRandomCard(suits, ranks) + ", " + soloActions[actionIndex] + ". Next?", false);
            }
            else if (randomNum >= 33) {
              var actionIndex = getRandomInt(0, doubleActions.length); 
              buildResponse(context, "If you have, " + getRandomCard(suits, ranks) + ", " + doubleActions[actionIndex] + " the person who has " + getRandomCard(suits, ranks) + ". Next?", false);
            }
            else {
              var actionIndex = getRandomInt(0, groupActions.length); 
              buildResponse(context, groupActions[actionIndex] + " Next?", false);
            }
            break;
          case "AMAZON.NoIntent":
            buildResponse(context, "Launch me again when you are ready!", true);
            break;
          case "AMAZON.HelpIntent":
            buildResponse(context, "Deal an entire deck of cards to all players. Wait for everyone to sort their hands and sit down. When you are ready, say launch Party Game and follow the instructions. Have fun!", false);
            break;
          case "AMAZON.CancelIntent":
            buildResponse(context,"",true);
            break;
          case "AMAZON.StopIntent":
            buildResponse(context,"",true);
            break;          
          default:
            throw "Invalid intent"
        }
        break;
      case "SessionEndedRequest":
        // Session Ended Request
        console.log(`SESSION ENDED REQUEST`)
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

function getRandomCard(suits, ranks) {
  var randomRankIndex = getRandomInt(0, ranks.length);
  var randomSuitIndex = getRandomInt(0, suits.length);
  return ranks[randomRankIndex] + " of " + suits[randomSuitIndex];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}