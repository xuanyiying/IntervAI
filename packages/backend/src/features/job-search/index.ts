/**
 * Job Search Automation Module
 *
 * Core implementation of the automated job search system
 * including job aggregation, parsing, and matching capabilities
 */

export * from './agents/scraper.agent';
export * from './agents/parser.agent';
export * from './agents/matcher.agent';
export * from './agents/apply.agent';
export * from './agents/tracker.agent';
export * from './agents/coach.agent';
export * from './services/job-aggregation.service';
export * from './services/job-matching.service';
export * from './services/application-tracking.service';
export * from './services/interview-prep.service';
export * from './interfaces/job-search.interface';
export * from './dto/job-search.dto';
export * from './job-search.module';
