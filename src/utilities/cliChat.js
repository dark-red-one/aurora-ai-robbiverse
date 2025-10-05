// cliChat.js - Simple CLI to chat with Robbie and show metrics suffix
import Robbie from './robbieResponseSystem.js';

const prompt = process.argv.slice(2).join(' ') || 'Say OK.';

(async () => {
  const robbie = new Robbie();
  const { response } = await robbie.respond(prompt);
  // Print only the final line; RobbieResponseSystem already logs details
  console.log(response);
})();
