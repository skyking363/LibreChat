const { Langfuse } = require('langfuse');
const { logger } = require('~/config');

/**
 * LangfuseService - Singleton service for Langfuse observability
 * Provides LLM tracing and logging capabilities across the application
 */
class LangfuseService {
  constructor() {
    this.client = null;
    this.enabled = false;
    this.sampleRate = 1.0;
    this.initialized = false;
  }

  /**
   * Initialize Langfuse client with environment variables
   */
  initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Check if Langfuse is enabled
      this.enabled = process.env.LANGFUSE_ENABLED === 'true';

      if (!this.enabled) {
        logger.info('[LangfuseService] Langfuse is disabled');
        this.initialized = true;
        return;
      }

      // Validate required environment variables
      const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
      const secretKey = process.env.LANGFUSE_SECRET_KEY;
      const host = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com';

      if (!publicKey || !secretKey) {
        logger.warn('[LangfuseService] Missing LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY. Langfuse will be disabled.');
        this.enabled = false;
        this.initialized = true;
        return;
      }

      // Parse sample rate
      const sampleRate = parseFloat(process.env.LANGFUSE_SAMPLE_RATE || '1.0');
      this.sampleRate = Math.max(0, Math.min(1, sampleRate)); // Clamp between 0 and 1

      // Parse other configuration
      const flushAt = parseInt(process.env.LANGFUSE_FLUSH_AT || '1', 10);
      const flushInterval = parseInt(process.env.LANGFUSE_FLUSH_INTERVAL || '1000', 10);
      const debug = process.env.LANGFUSE_DEBUG === 'true';

      // Initialize Langfuse client
      this.client = new Langfuse({
        publicKey,
        secretKey,
        baseUrl: host,
        flushAt,
        flushInterval,
        release: process.env.npm_package_version || 'unknown',
        enabled: this.enabled,
        sdkIntegration: 'librechat',
      });

      if (debug) {
        this.client.debug();
      }

      logger.info('[LangfuseService] Langfuse initialized successfully', {
        host,
        sampleRate: this.sampleRate,
        flushInterval,
      });

      this.initialized = true;

      // Setup graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('[LangfuseService] Failed to initialize Langfuse', error);
      this.enabled = false;
      this.initialized = true;
    }
  }

  /**
   * Setup graceful shutdown to flush pending traces
   */
  setupGracefulShutdown() {
    const flushAtShutdown = process.env.LANGFUSE_FLUSH_AT_SHUTDOWN !== 'false';

    if (!flushAtShutdown || !this.client) {
      return;
    }

    const shutdown = async (signal) => {
      logger.info(`[LangfuseService] Received ${signal}, flushing Langfuse traces...`);
      try {
        await this.flush();
        logger.info('[LangfuseService] Langfuse traces flushed successfully');
      } catch (error) {
        logger.error('[LangfuseService] Error flushing Langfuse traces', error);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  /**
   * Check if tracing should be performed based on sample rate
   */
  shouldTrace() {
    if (!this.enabled || !this.client) {
      return false;
    }

    if (this.sampleRate >= 1.0) {
      return true;
    }

    return Math.random() < this.sampleRate;
  }

  /**
   * Create a new trace
   * @param {Object} options - Trace options
   * @returns {Object|null} Trace object or null if disabled
   */
  trace(options = {}) {
    if (!this.shouldTrace()) {
      return null;
    }

    try {
      return this.client.trace(options);
    } catch (error) {
      logger.error('[LangfuseService] Error creating trace', error);
      return null;
    }
  }

  /**
   * Create a span within a trace
   * @param {Object} trace - Parent trace object
   * @param {Object} options - Span options
   * @returns {Object|null} Span object or null if disabled
   */
  span(trace, options = {}) {
    if (!this.enabled || !this.client || !trace) {
      return null;
    }

    try {
      return trace.span(options);
    } catch (error) {
      logger.error('[LangfuseService] Error creating span', error);
      return null;
    }
  }

  /**
   * Create a generation event (LLM call)
   * @param {Object} trace - Parent trace object
   * @param {Object} options - Generation options
   * @returns {Object|null} Generation object or null if disabled
   */
  generation(trace, options = {}) {
    if (!this.enabled || !this.client || !trace) {
      return null;
    }

    try {
      return trace.generation(options);
    } catch (error) {
      logger.error('[LangfuseService] Error creating generation', error);
      return null;
    }
  }

  /**
   * Log an event
   * @param {Object} trace - Parent trace object
   * @param {Object} options - Event options
   */
  event(trace, options = {}) {
    if (!this.enabled || !this.client || !trace) {
      return;
    }

    try {
      trace.event(options);
    } catch (error) {
      logger.error('[LangfuseService] Error logging event', error);
    }
  }

  /**
   * Update trace with metadata
   * @param {Object} trace - Trace object to update
   * @param {Object} updates - Updates to apply
   */
  updateTrace(trace, updates = {}) {
    if (!this.enabled || !trace) {
      return;
    }

    try {
      trace.update(updates);
    } catch (error) {
      logger.error('[LangfuseService] Error updating trace', error);
    }
  }

  /**
   * Score a trace (for user feedback, ratings, etc.)
   * @param {Object} options - Score options
   */
  score(options = {}) {
    if (!this.enabled || !this.client) {
      return;
    }

    try {
      this.client.score(options);
    } catch (error) {
      logger.error('[LangfuseService] Error creating score', error);
    }
  }

  /**
   * Manually flush pending traces
   * @returns {Promise<void>}
   */
  async flush() {
    if (!this.enabled || !this.client) {
      return;
    }

    try {
      await this.client.flushAsync();
    } catch (error) {
      logger.error('[LangfuseService] Error flushing traces', error);
      throw error;
    }
  }

  /**
   * Shutdown Langfuse client
   * @returns {Promise<void>}
   */
  async shutdown() {
    if (!this.enabled || !this.client) {
      return;
    }

    try {
      await this.client.shutdownAsync();
      logger.info('[LangfuseService] Langfuse client shutdown successfully');
    } catch (error) {
      logger.error('[LangfuseService] Error shutting down Langfuse client', error);
      throw error;
    }
  }

  /**
   * Get the raw Langfuse client (for advanced usage)
   * @returns {Object|null} Langfuse client or null if disabled
   */
  getClient() {
    return this.enabled ? this.client : null;
  }

  /**
   * Check if Langfuse is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }
}

// Export singleton instance
const langfuseService = new LangfuseService();

module.exports = langfuseService;
