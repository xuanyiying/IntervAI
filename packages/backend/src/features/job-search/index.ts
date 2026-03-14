/**
 * Job Search Automation Module
 *
 * Core implementation of the automated job search system
 * including job aggregation, parsing, and matching capabilities.
 *
 * Refactored to use the new AI Skills system instead of agents.
 */

// Services
export * from './services/job-aggregation.service';
export * from './services/job-matching.service';
export * from './services/application-tracking.service';
export * from './services/interview-prep.service';

// Interfaces and DTOs
export * from './interfaces/job-search.interface';
export * from './dto/job-search.dto';

// Module
export * from './job-search.module';
