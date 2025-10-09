// RobbieVerse Alexa Skill Engine
// Bridges "Alexa, ask Robbie..." to Aurora AI Empire

const Alexa = require('ask-sdk-core');
const axios = require('axios');

// Aurora backend configuration
const AURORA_API_BASE = process.env.AURORA_API_BASE || 'https://aurora-town.robbieverse.com/api/v1';
const AURORA_API_KEY = process.env.AURORA_API_KEY;

class RobbieSkillHandler {
  constructor() {
    this.auroraClient = axios.create({
      baseURL: AURORA_API_BASE,
      headers: {
        'Authorization': `Bearer ${AURORA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
  }

  // Main intent handler for Robbie commands
  async handleRobbieCommand(handlerInput) {
    const { requestEnvelope, responseBuilder } = handlerInput;
    const command = requestEnvelope.request.intent.slots?.command?.value || '';
    const userId = requestEnvelope.session.user.userId;
    const deviceId = requestEnvelope.context.System.device.deviceId;

    try {
      // Send command to Aurora backend
      const response = await this.auroraClient.post('/voice/command', {
        command,
        user_id: userId,
        device_id: deviceId,
        device_type: 'alexa',
        timestamp: new Date().toISOString(),
        context: {
          session_id: requestEnvelope.session.sessionId,
          application_id: requestEnvelope.session.application.applicationId
        }
      });

      const { message, display_data, should_end_session } = response.data;

      // Build response
      let builder = responseBuilder.speak(message);

      // Add display card for Echo Show devices
      if (display_data && this.hasDisplay(requestEnvelope)) {
        builder = builder.withStandardCard(
          display_data.title || 'Robbie Response',
          display_data.text || message,
          display_data.image_url
        );
      }

      // Keep session open for follow-up questions unless explicitly ended
      if (!should_end_session) {
        builder = builder.reprompt('Anything else I can help with?');
      }

      return builder.getResponse();

    } catch (error) {
      console.error('Aurora API error:', error);
      
      return responseBuilder
        .speak('Sorry, I had trouble connecting to my brain. Please try again in a moment.')
        .reprompt('You can ask me about your business, calendar, or deals.')
        .getResponse();
    }
  }

  // Business intelligence commands
  async handleBusinessQuery(handlerInput) {
    const { requestEnvelope, responseBuilder } = handlerInput;
    const queryType = requestEnvelope.request.intent.name;
    
    const businessCommands = {
      'DealPipelineIntent': 'show deal pipeline',
      'CalendarIntent': 'show today\'s calendar', 
      'EmailIntent': 'check priority emails',
      'MeetingPrepIntent': 'prepare for next meeting',
      'RevenueIntent': 'show revenue dashboard',
      'ContactLookupIntent': 'lookup contact ' + (requestEnvelope.request.intent.slots?.name?.value || '')
    };

    const command = businessCommands[queryType] || 'general business query';
    
    // Reuse main command handler
    return this.handleRobbieCommand({
      ...handlerInput,
      requestEnvelope: {
        ...requestEnvelope,
        request: {
          ...requestEnvelope.request,
          intent: {
            ...requestEnvelope.request.intent,
            slots: { command: { value: command } }
          }
        }
      }
    });
  }

  // Smart home control
  async handleSmartHomeCommand(handlerInput) {
    const { requestEnvelope, responseBuilder } = handlerInput;
    const action = requestEnvelope.request.intent.slots?.action?.value;
    const device = requestEnvelope.request.intent.slots?.device?.value;

    try {
      const response = await this.auroraClient.post('/smart-home/control', {
        action,
        device,
        user_id: requestEnvelope.session.user.userId,
        device_id: requestEnvelope.context.System.device.deviceId
      });

      return responseBuilder
        .speak(response.data.message)
        .getResponse();

    } catch (error) {
      return responseBuilder
        .speak(`Sorry, I couldn't ${action} the ${device}. Please check if it's connected.`)
        .getResponse();
    }
  }

  // Camera/security commands
  async handleSecurityCommand(handlerInput) {
    const { requestEnvelope, responseBuilder } = handlerInput;
    const command = requestEnvelope.request.intent.slots?.command?.value;

    try {
      const response = await this.auroraClient.post('/security/command', {
        command,
        user_id: requestEnvelope.session.user.userId,
        timestamp: new Date().toISOString()
      });

      let builder = responseBuilder.speak(response.data.message);

      // For Echo Show devices, display camera feed or security status
      if (this.hasDisplay(requestEnvelope) && response.data.display_url) {
        builder = builder.withStandardCard(
          'Security Status',
          response.data.message,
          response.data.display_url
        );
      }

      return builder.getResponse();

    } catch (error) {
      return responseBuilder
        .speak('Security system is unavailable right now. Please try again.')
        .getResponse();
    }
  }

  // Helper methods
  hasDisplay(requestEnvelope) {
    const deviceType = requestEnvelope.context?.System?.device?.supportedInterfaces;
    return deviceType && deviceType['Alexa.Presentation.APL'];
  }

  // Launch handler
  handleLaunch(handlerInput) {
    const speakOutput = `Hello! I'm Robbie, your AI business copilot. You can ask me about your deals, calendar, emails, or say "show dashboard" to see your business metrics. What would you like to know?`;
    
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('Try asking: "What\'s my deal pipeline?" or "Show today\'s calendar"')
      .getResponse();
  }

  // Help handler
  handleHelp(handlerInput) {
    const speakOutput = `I can help you with:
    Business: "What's my deal pipeline?", "Show revenue dashboard"
    Calendar: "What's my schedule?", "Prepare for next meeting" 
    Email: "Check priority emails", "Any urgent messages?"
    Security: "Who's at the door?", "Show office camera"
    Smart Home: "Turn on office lights", "Set temperature to 72"
    
    What would you like to try?`;
    
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('What would you like me to help with?')
      .getResponse();
  }
}

// Initialize skill handler
const robbieHandler = new RobbieSkillHandler();

// Skill builder
const skillBuilder = Alexa.SkillBuilders.custom();

// Intent handlers
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle: robbieHandler.handleLaunch.bind(robbieHandler)
};

const RobbieCommandHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RobbieCommandIntent';
  },
  handle: robbieHandler.handleRobbieCommand.bind(robbieHandler)
};

const BusinessQueryHandler = {
  canHandle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && ['DealPipelineIntent', 'CalendarIntent', 'EmailIntent', 'MeetingPrepIntent', 'RevenueIntent', 'ContactLookupIntent'].includes(intentName);
  },
  handle: robbieHandler.handleBusinessQuery.bind(robbieHandler)
};

const SmartHomeHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SmartHomeIntent';
  },
  handle: robbieHandler.handleSmartHomeCommand.bind(robbieHandler)
};

const SecurityHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SecurityIntent';
  },
  handle: robbieHandler.handleSecurityCommand.bind(robbieHandler)
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle: robbieHandler.handleHelp.bind(robbieHandler)
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speakOutput = 'Talk to you later!';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${JSON.stringify(error)}`);
    const speakOutput = 'Sorry, I had trouble understanding. Please try again.';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

// Build and export skill
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    RobbieCommandHandler,
    BusinessQueryHandler,
    SmartHomeHandler,
    SecurityHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .withCustomUserAgent('RobbieVerse/1.0')
  .lambda();

// Export for testing
module.exports = {
  RobbieSkillHandler,
  skillBuilder
};
