import { rollWeaponDodge } from '../dice/rolltypes.mjs';

/**
 * Global chat listeners for Unbound Fate system.
 */
export function registerUnboundFateChatListeners() {
  // Listen for dodge button clicks in chat
  Hooks.on('renderChatMessage', (message, html, data) => {
    html.find('.dodge-roll').off('click').on('click', async function (ev) {
      ev.preventDefault();
      const button = ev.currentTarget;
      const tokenId = button.dataset.tokenId;
      const actorId = button.dataset.actorId;
      // Get the chat message ID from the DOM
      const chatMessageElem = html.closest('.chat-message');
      const chatMessageId = chatMessageElem?.attr('data-message-id');
      let chatMessage = message;
      // If we have the ID, get the full chat message document
      if (chatMessageId && (!chatMessage || chatMessage.id !== chatMessageId)) {
        chatMessage = game.messages.get(chatMessageId);
      }
      // Try to get the actor from the token or actorId
      let actor = null;
      if (tokenId && canvas.tokens) {
        const token = canvas.tokens.get(tokenId) || canvas.tokens.placeables.find(t => t.id === tokenId);
        actor = token?.actor;
      }
      if (!actor && actorId) {
        actor = game.actors.get(actorId);
      }
      if (!actor) {
        ui.notifications.warn('Could not find actor for dodge roll.');
        return;
      }
      // Extract attack info from chat message flavor
      const flavor = chatMessage?.flavor || '';
      // Try to extract the number of successes from the flavor text
      const match = flavor.match(/Successes:\s*(\d+)/i);
      const successes = match ? parseInt(match[1], 10) : 0;
      // Optionally, extract attack label
      const attackLabelMatch = flavor.match(/<strong>(.*?)<\/strong>/i);
      const attackLabel = attackLabelMatch ? attackLabelMatch[1] : '';
      // You can also access all chat message data here if needed:
      // chatMessage.data, chatMessage.flags, chatMessage.rolls, etc.
      // Call the dodge dialog/roll
      await rollWeaponDodge({
        actor,
        attackingActor: null, // Could be improved if you want to pass attacker
        options: {
          attackLabel,
          successes,
          chatMessageData: chatMessage?.toObject?.() || {}
        }
      });
    });
  });
}
