import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// @ts-ignore
import * as PlotlyJS from 'plotly.js-dist-min';
import { PlotlyModule } from 'angular-plotly.js';

// @ts-ignore
PlotlyModule.plotlyjs = PlotlyJS;

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
