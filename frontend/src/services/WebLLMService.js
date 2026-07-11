/**
 * WebLLMService.js - Web LLM with RAG integration
 * Uses knowledge base retrieval + reasoning for smart recommendations
 * HARDENED: Never recommends fake/synthetic books
 */

import * as webllm from '@mlc-ai/web-llm';
import { BOOK_LIBRARY } from '../data/BookLibrary.js';
import RAGRetrievalService from './RAGRetrievalService.js';
import BookHallucinationValidator from './BookHallucinationValidator.js';
import { getSession } from './AISessionContext.js';

let engine = null;
let isInitialized = false;
let selectedModelName = null;

const initProgressCallback = (progress) => {
  console.log(`[WebLLM] Loading: ${progress.text}`);
};

/**
 * Get list of available models from Web LLM config
 */
function getAvailableModels() {
  try {
    if (webllm.prebuiltAppConfig && webllm.prebuiltAppConfig.model_list) {
      const models = webllm.prebuiltAppConfig.model_list.map(m => m.model_id);
      console.log('[WebLLM] Available models:', models);
      return models;
    }
  } catch (e) {
    console.log('[WebLLM] Could not read model list:', e.message);
  }
  return [];
}

/**
 * Find first supported model from preferred list
 */
function findSupportedModel() {
  const preferredModels = [
    'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    'Phi-3.5-mini-instruct-q4f16_1-MLC',
    'TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC',
  ];

  const availableModels = getAvailableModels();
  
  for (const preferred of preferredModels) {
    if (availableModels.includes(preferred)) {
      console.log(`[WebLLM] ✅ Found supported model: ${preferred}`);
      return preferred;
    }
  }

  if (availableModels.length > 0) {
    const fallback = availableModels[0];
    console.log(`[WebLLM] ⚠️ Using first available model: ${fallback}`);
    return fallback;
  }

  console.error('[WebLLM] ❌ No models available!');
  return null;
}

/**
 * Initialize the Web LLM engine with smart model detection
 */
export async function initializeWebLLM() {
  if (isInitialized && engine) {
    console.log(`[WebLLM] Already initialized with: ${selectedModelName}`);
    return true;
  }

  try {
    console.log('[WebLLM] Starting initialization with auto-detection...');
    
    const cachedModel = localStorage.getItem('webllm_working_model');
    let modelToUse = cachedModel;
    
    if (!modelToUse) {
      modelToUse = findSupportedModel();
      if (!modelToUse) {
        console.error('[WebLLM] ❌ No supported models found');
        return false;
      }
    } else {
      console.log(`[WebLLM] Using cached model: ${modelToUse}`);
    }

    selectedModelName = modelToUse;
    console.log(`[WebLLM] Initializing with model: ${selectedModelName}`);
    
    engine = new webllm.MLCEngine({
      initProgressCallback,
    });

    await engine.reload(selectedModelName);
    isInitialized = true;
    
    localStorage.setItem('webllm_working_model', selectedModelName);
    
    console.log(`[WebLLM] ✅ Engine ready! Using ${selectedModelName}`);
    return true;
  } catch (error) {
    console.error(`[WebLLM] Failed to initialize: ${error.message}`);
    isInitialized = false;
    engine = null;
    selectedModelName = null;
    localStorage.removeItem('webllm_working_model');
    
    return false;
  }
}

/**
 * Generate RAG-enhanced AI recommendations using WebLLM
 * HARDENED: Prevents hallucinations by grounding with real books
 * Pipeline: Fetch real candidates → Ground prompt → LLM reasoning → Validate response → Fallback if needed
 */
export async function generateAIRecommendations(userQuery, shownBooks = []) {
  if (!engine || !isInitialized) {
    throw new Error('WebLLM not initialized');
  }

  try {
    console.log('[WebLLM] Starting grounded recommendation pipeline for:', userQuery);

    const session = getSession();

    // STEP 1: Fetch REAL candidates and build grounded prompt (anti-hallucination)
    const validationResult = await BookHallucinationValidator.validateAndGroundRecommendations(
      userQuery,
      session.getContextPrompt(),
      session.shownBooks
    );

    if (!validationResult.grounded || validationResult.candidates.length === 0) {
      console.error('[WebLLM] ❌ Validation failed, cannot recommend safely');
      throw new Error('No real book candidates available');
    }

    const realCandidates = validationResult.candidates;
    const groundedPrompt = validationResult.groundedPrompt;

    console.log(`[WebLLM] ✅ Grounded with ${realCandidates.length} real books`);

    // STEP 2: Call WebLLM with GROUNDED prompt (no RAG context, just real books)
    const messages = [
      {
        role: 'system',
        content: groundedPrompt.system,
      },
      {
        role: 'user',
        content: groundedPrompt.user,
      },
    ];

    console.log('[WebLLM] Calling model with grounded prompt...');
    
    const reply = await engine.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = reply.choices[0].message.content;
    console.log('[WebLLM] Model response received');

    // STEP 3: Validate response - ONLY extract REAL books
    const extractionResult = await BookHallucinationValidator.extractAndValidateBooks(
      response,
      realCandidates
    );

    let recommendations = extractionResult.validatedBooks;

    // STEP 4: Fallback if validation found hallucinations
    if (extractionResult.hallucinationDetected || recommendations.length < 5) {
      console.warn('[WebLLM] ⚠️ Hallucinations detected or incomplete response, using fallback');
      
      const fallback = BookHallucinationValidator.getFallbackRealBooks(
        realCandidates,
        5
      );
      
      // Merge validated + fallback, keep only unique
      const merged = [...recommendations];
      fallback.forEach(book => {
        if (!merged.some(b => b.id === book.id)) {
          merged.push(book);
        }
      });
      
      recommendations = merged.slice(0, 5);
      console.log(`[WebLLM] ✅ Fallback applied: using ${recommendations.length} real books`);
    }

    // STEP 5: Track in session
    session.addConversation(userQuery, response, recommendations);

    return {
      response,
      recommendations,
      isAI: true,
      ragBookCount: realCandidates.length,
      isGrounded: true,
    };
  } catch (error) {
    console.error('[WebLLM] Error generating recommendations:', error);
    throw error;
  }
}

/**
 * Check if Web LLM is ready to use (single source of truth)
 */
export function isWebLLMReady() {
  const ready = isInitialized && engine !== null;
  return ready;
}

/**
 * Get initialization status
 */
export function getWebLLMStatus() {
  return {
    initialized: isInitialized,
    hasEngine: engine !== null,
    modelName: selectedModelName,
    isReady: isWebLLMReady(),
  };
}

/**
 * Shutdown (cleanup)
 */
export async function shutdownWebLLM() {
  if (engine) {
    try {
      await engine.interruptGenerate();
    } catch (e) {
      // Ignore
    }
    engine = null;
    isInitialized = false;
    console.log('[WebLLM] Engine shutdown');
  }
}

export default {
  initializeWebLLM,
  generateAIRecommendations,
  isWebLLMReady,
  getWebLLMStatus,
  shutdownWebLLM,
};
