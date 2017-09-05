﻿import { Component, OnInit } from '@angular/core';

import { Configuration } from '../../app.models';
import { ConfigurationService, AppService, TrackingService } from '../../shared';

@Component({
    selector: 'overlay-page',
    templateUrl: 'overlay-page.component.html'
})
export class OverlayPageComponent implements OnInit {
    public loading = false;
    public conf: Configuration;
    public overlayActiveTopPosition: number;
    public overlayActiveLeftPosition: number;
    public overlayInactiveTopPosition: number;
    public overlayInactiveLeftPosition: number;

    constructor(private configurationService: ConfigurationService, private appService: AppService, private trackingService: TrackingService) {
    }

    public ngOnInit() {
        this.readConfiguration();
    }

    private readConfiguration() {
        this.loading = true;
        this.configurationService.getConfiguration(() => {
            this.conf = this.configurationService.configuration;
            this.loading = false;
        });
    }

    public save() {
        this.loading = true;
        this.configurationService.configuration = this.conf;
        this.configurationService.saveConfiguration().subscribe(() => {
            this.appService.toastSuccess("Settings saved.");
            this.readConfiguration();
            this.trackingService.sendEvent("Settings", "OverlaySettingsSaved");
        }, error => {
            this.loading = false;
            console.error("Failed to save settings", error);
            this.appService.toastError("Failed to save settings, check the logs.");
        });
    }
}