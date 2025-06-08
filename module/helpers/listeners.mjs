import { launchWeaponDodgeDialog } from '../dialogs/weapondodge-dialog.mjs';

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

      // Get actor from selected token or actorId
      const selectedActor = canvas.tokens.controlled[0]?.actor;

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

      // SUCCESSES EXTRACTION
      // Try to extract the number of successes from the chat message content by id
      let successes = 0;
      const contentElem = html[0]?.querySelector('#successes');
      if (contentElem) {
        successes = parseInt(contentElem.textContent, 10) || 0;
      } else {
        // Fallback to flavor regex if not found
        const match = flavor.match(/Successes:\s*(\d+)/i);
        successes = match ? parseInt(match[1], 10) : 0;
      }
      

      // ATTACK TYPE EXTRACTION
      let attackType = 'melee'; // Default to melee 
      const attackTypeElem = html[0]?.querySelector('.attack-type');
      if (attackTypeElem) {
        attackType = attackTypeElem.textContent.trim().toLowerCase();
      } else {
        // Fallback to flavor regex if not found
        const typeMatch = flavor.match(/Attack Type:\s*(\w+)/i);
        attackType = typeMatch ? typeMatch[1].toLowerCase() : 'melee';
      }

      // Extract attacker
      let attackingActor = null;
      const attackerElem = html[0]?.querySelector('.attacker-actor');

      // Log for debugging
      console.log ('Undound Fate | Launching dodge dialog with:', {
        actor: actor,
        attackingActor: attackingActor,
        successes: successes,
        attackType: attackType,
        chatMessageData: chatMessage?.toObject?.() || {}
      });

      // Call the dodge dialog (which will call rollWeaponDodge internally)
      await launchWeaponDodgeDialog({
        actor: selectedActor || actor,
        attackingActor: null, // Could be improved if you want to pass attacker
        options: {          
          successes,
          attackType,
          chatMessageData: chatMessage?.toObject?.() || {}
          
        }
      });
    });
  });
  // Add global listener for chat-select-link
  $(document).on('click', '.chat-select-link', function (event) {
    event.preventDefault();
    const tokenId = $(this).data('token-id');
    if (!tokenId) return;
    const token = canvas.tokens?.get(tokenId);
    if (token) {
      canvas.tokens?.releaseAll();
      token.control({ releaseOthers: true, pan: true });
    } else {
      ui.notifications.error('Token not found on the current scene.');
    }
  });
}
