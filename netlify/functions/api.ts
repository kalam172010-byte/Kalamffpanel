import serverless from 'serverless-http';
import { app } from '../../src/server/app';

// Netlify Serverless Function Handler
export const handler = serverless(app);
