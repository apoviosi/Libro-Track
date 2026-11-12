/**
 * Name: Deelan Glear R. David
 * Date: 2026-11-12
 * Title: Application entry point
 */

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
