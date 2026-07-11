/**
 * AppInitializer.js - Orchestrates app startup sequence
 * WebLLM disabled — using Ollama backend instead
 */

import { initializeKnowledgeBase, getLoadingStatus } from './BooksDataLoader.js';
import { initializeSession } from './AISessionContext.js';

let initializationStarted = false;
let initializationPromise = null;

export async function getInitializationStatus() {
  const kbStatus = await getLoadingStatus();
  return {
    knowledgeBase: { ...kbStatus },
    initialized: initializationStarted,
    inProgress: initializationPromise ? true : false,
  };
}

export async function initializeApp() {
  if (initializationStarted) {
    console.log('[AppInitializer] Already initialized or initializing');
    return initializationPromise;
  }

  initializationStarted = true;

  initializationPromise = (async () => {
    try {
      console.log('[AppInitializer] Starting app initialization...');

      // Phase 1: Knowledge base
      console.log('[AppInitializer] Phase 1: Loading knowledge base...');
      try {
        const bookCount = await initializeKnowledgeBase();
        console.log(`[AppInitializer] ✅ Knowledge base ready (${bookCount} books)`);
      } catch (error) {
        console.error('[AppInitializer] Knowledge base init failed:', error.message);
      }

      // Phase 2: Session
      console.log('[AppInitializer] Phase 2: Initializing session...');
      try {
        initializeSession();
        console.log('[AppInitializer] ✅ Session initialized');
      } catch (error) {
        console.error('[AppInitializer] Session init failed:', error.message);
      }

      // Phase 3: WebLLM DISABLED — Ollama handles AI recommendations
      console.log('[AppInitializer] Phase 3: Skipping WebLLM (using Ollama backend)');

      console.log('[AppInitializer] ✅ App initialization complete!');
      return { success: true };
    } catch (error) {
      console.error('[AppInitializer] Initialization error:', error);
      return { success: false, error };
    }
  })();

  return initializationPromise;
}

export async function waitForInitialization(timeoutMs = 30000) {
  if (!initializationStarted) {
    await initializeApp();
  }
  return Promise.race([
    initializationPromise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Initialization timeout')), timeoutMs)
    ),
  ]);
}

export function resetInitialization() {
  initializationStarted = false;
  initializationPromise = null;
}

export default {
  initializeApp,
  getInitializationStatus,
  waitForInitialization,
  resetInitialization,
};