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
        };
        inviteLink?: {
          getRoomInviteUrl: (opts: { roomCode: string }) => Promise<string>;
        };
      };
    };
  }
}

let initialised = false;

export async function initCrazyGames() {
  if (typeof window.CrazyGames === 'undefined') return;
  if (initialised) return;
  try {
    await window.CrazyGames.SDK.init();
    initialised = true;
    console.log('[CrazyGames] SDK ready');
  } catch (e) {
    console.warn('[CrazyGames] SDK init failed', e);
  }
}

function sdkReady(): boolean {
  return initialised && typeof window.CrazyGames !== 'undefined';
}

export function gameplayStart() {
  if (!sdkReady()) return;
  try { window.CrazyGames!.SDK.game.gameplayStart(); } catch { /* ignore */ }
}

export function gameplayStop() {
  if (!sdkReady()) return;
  try { window.CrazyGames!.SDK.game.gameplayStop(); } catch { /* ignore */ }
}

export function showMidgameAd(): Promise<void> {
  return new Promise(resolve => {
    if (!sdkReady()) { resolve(); return; }
    gameplayStop();
    try {
      window.CrazyGames!.SDK.ad.requestAd('midgame', {
        adStarted:  () => {},
        adFinished: () => { gameplayStart(); resolve(); },
        adError:    () => { gameplayStart(); resolve(); },
      });
    } catch { gameplayStart(); resolve(); }
  });
}

export async function getRoomInviteUrl(roomCode: string): Promise<string> {
  try {
    if (sdkReady() && window.CrazyGames!.SDK.inviteLink) {
      const url = await window.CrazyGames!.SDK.inviteLink.getRoomInviteUrl({ roomCode });
      if (url) return url;
    }
  } catch { /* fallback */ }
  return `${window.location.origin}/games?code=${roomCode}`;
}
