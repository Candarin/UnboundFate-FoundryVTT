import { launchWeaponDodgeDialog } from '../dialogs/weapondodge-dialog.mjs';
import { ufLog } from './system-utils.mjs';

/**
 * Global chat listeners for Unbound Fate system.
 */
export function registerUnboundFateChatListeners() {
  // Listen for dodge button clicks in chat
  Hooks.on('renderChatMessage', (message, html, data) => {
    html.find('.dodge-roll').off('click').on('click', async function (ev) {
      ufLog('Dodge roll button clicked:', ev.currentTarget);
      ev.preventDefault();

      // Use the user's selected tokens for dodge
      const selectedTokens = canvas.tokens.controlled;
      if (!selectedTokens || selectedTokens.length === 0) {
        ui.notifications.warn('Please select a single token to Dodge.');
        return;
      }
      if (selectedTokens.length > 1) {
        ui.notifications.warn('Please select only one token to Dodge.');
        return;
      }
      const selectedToken = selectedTokens[0];
      const selectedActor = selectedToken.actor;
      if (!selectedActor) {
        ui.notifications.warn('Selected token does not have an associated actor.');
        return;
      }
      const dodgeTokenId = selectedToken.id;

      // Get the chat message ID from the DOM
      const chatMessageElem = html.closest('.chat-message');
      const chatMessageId = chatMessageElem?.attr('data-message-id');
      let chatMessage = message;
      // If we have the ID, get the full chat message document
      if (chatMessageId && (!chatMessage || chatMessage.id !== chatMessageId)) {
        chatMessage = game.messages.get(chatMessageId);
      }
      // Extract attack info from chat message flavor
      const flavor = chatMessage?.flavor || '';

      // SUCCESSES EXTRACTION
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
      if (attackerElem) {
        const attackerId = attackerElem.dataset.actorId;
        if (attackerId) {
          attackingActor = game.actors.get(attackerId);
        }
      } else {
        // Fallback to flavor regex if not found
        const attackerMatch = flavor.match(/Attacker:\s*([^\s]+)/i);
        if (attackerMatch) {
          attackingActor = game.actors.find(a => a.name === attackerMatch[1]);
        }
      }


      // Log for debugging
      ufLog ('Launching dodge dialog with:', {
        actor: selectedActor,
        successes: successes,
        attackType: attackType,
        chatMessageData: chatMessage?.toObject?.() || {},
        dodgeTokenId
      });

      // Call the dodge dialog (which will call rollWeaponDodge internally)
      await launchWeaponDodgeDialog({
        actor: selectedActor,
        attackingActor: attackingActor,
        options: {          
          successes,
          attackType,
          chatMessageData: chatMessage?.toObject?.() || {},
          dodgeTokenId
        }
      });
    });
  });

  // Add global listener for chat-select-link
  $(document).on('click', '.chat-select-link', function (event) {
    ufLog('Chat select link clicked:', this);
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
