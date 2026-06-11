// CrazyGames SDK v3 integration
// Docs: https://docs.crazygames.com/sdk/html5/

declare global {
  interface Window {
    CrazyGames?: {
      SDK: {
        init: () => Promise<void>;
        game: {
          gameplayStart: () => void;
          gameplayStop:  () => void;
          sdkGameLoadingStart: () => void;
          sdkGameLoadingStop:  () => void;
        };
        ad: {
          requestAd: (type: 'midgame' | 'rewarded', callbacks: {
            adStarted?:  () => void;
            adFinished?: () => void;
            adError?:    (err: unknown) => void;
          }) => void;
          hasAdblock: () => Promise<boolean>;
        };
        user: {
          isUserAccountAvailable: boolean;
          getUser: () => Promise<{ username: string; profilePicture: string } | null>;
        };
      };
    };
  }
}

let initialised = false;

/** Get a shareable invite URL for a room (CrazyGames multiplayer requirement) */
export async function getRoomInviteUrl(roomCode: string): Promise<string> {
  try {
    if (window.CrazyGames) {
      // @ts-expect-error – inviteLink may not be in all SDK versions
      const url = await window.CrazyGames.SDK.inviteLink?.getRoomInviteUrl?.({ roomCode });
      if (url) return url as string;
    }
  } catch { /* fallback below */ }
  // Fallback: plain URL with room code
  return `${window.location.origin}/games?code=${roomCode}`;
}

export async function initCrazyGames() {
  if (typeof window.CrazyGames === 'undefined') return; // not on CrazyGames
  if (initialised) return;
  try {
    await window.CrazyGames.SDK.init();
    initialised = true;
    console.log('[CrazyGames] SDK ready');
  } catch (e) {
    console.warn('[CrazyGames] SDK init failed', e);
  }
}

/** Call when the player starts actively playing */
export function gameplayStart() {
  window.CrazyGames?.SDK.game.gameplayStart();
}

/** Call when gameplay pauses/ends (between rounds, menus, etc.) */
export function gameplayStop() {
  window.CrazyGames?.SDK.game.gameplayStop();
}

/** Show a mid-game ad (between rounds). Returns a Promise that resolves when ad is done. */
export function showMidgameAd(): Promise<void> {
  return new Promise(resolve => {
    if (!window.CrazyGames) { resolve(); return; }
    gameplayStop();
    window.CrazyGames.SDK.ad.requestAd('midgame', {
      adStarted:  () => {},
      adFinished: () => { gameplayStart(); resolve(); },
      adError:    () => { gameplayStart(); resolve(); },
    });
  });
}
