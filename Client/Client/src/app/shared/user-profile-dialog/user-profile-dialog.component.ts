﻿import { Component, Inject, OnInit, ViewChild, ContentChild } from '@angular/core';
import { MD_DIALOG_DATA, MdDialogRef, MdDialog, MdPaginator } from '@angular/material';
import { DataSource, CollectionViewer } from '@angular/cdk';
import { shell } from 'electron';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { HttpService, AppService, TrackingService, ConfirmationDialogComponent, ConfirmationDialogData, ReputationService, ConfigurationService, MatchDetailsDialogComponent, MatchDetailsDialogData } from '../';
import { BasePlayer, Reputation, ReputationType, User, UserReputation, Lobby, MatchHistory } from '../../app.models';

@Component({
    selector: 'user-profile-dialog',
    templateUrl: './user-profile-dialog.component.html',
    styleUrls: ['./user-profile-dialog.component.scss']
})
export class UserProfileDialogComponent implements OnInit {
    public profile: User;
    public knownNames: string;
    public apiKeyMissing: boolean;
    public userReputationsDataSource: UserReputationsDataSource;
    public matchesDataSource: MatchesDataSource;
    public userReputationsDisplayedColumns = ["lobbyName", "reputationType", "added", "comment", "actions"];
    public matchesDisplayedColumns = ["lobbyName", "joined"];

    constructor( @Inject(MD_DIALOG_DATA) private data: UserProfileDialogData, private appService: AppService, private reputationService: ReputationService, private httpService: HttpService, private trackingService: TrackingService, private configurationService: ConfigurationService, private dialog: MdDialogRef<UserProfileDialogComponent>, private dialogController: MdDialog) {
    }

    public ngOnInit() {
        this.fetchProfile();
        this.apiKeyMissing = !this.configurationService.configuration.steamApiKey;
    }

    public deleteReputation(reputation: UserReputation) {
        let dialog = this.dialogController.open(ConfirmationDialogComponent, {
            data: <ConfirmationDialogData>{
                title: "Deleting Reputation",
                question: "Are you sure you want to delete assigned reputation?"
            }
        });
        dialog.afterClosed().subscribe((confirmation: boolean) => {
            if (confirmation) {
                this.profile = null;
                this.reputationService.deleteReputation(reputation.id).subscribe(() => {
                    this.fetchProfile();
                    if (this.data.reputationDeleted) {
                        this.data.reputationDeleted();
                    }
                    this.appService.toastSuccess("Reputation deleted.");
                    this.trackingService.sendEvent("UserProfileDialog", "DeleteReputation");
                }, error => {
                    this.dialog.close();
                    console.log("Error occurred while deleting reputation", error);
                    this.appService.toastError("Failed to delete reputation. Check the logs.");
                });
            }
        });
    }

    public openMatchDetails(lobby: Lobby) {
        let dialog = this.dialogController.open(MatchDetailsDialogComponent, {
            data: <MatchDetailsDialogData>{
                id: lobby.id
            },
            width: window.innerWidth * 0.75 + "px",
        });
        this.trackingService.sendEvent("UserProfileDialog", "OpenMatchDetails");
    }

    public openSteamProfile() {
        shell.openExternal("http://steamcommunity.com/profiles/" + this.profile.sSteamId);
        this.trackingService.sendEvent("UserProfileDialog", "SteamProfileOpened");
    }

    public openReputationDetailsDialog(reputation: UserReputation) {
        this.appService.openReputationDetailsDialog("UserProfileDialog", reputation.reputation, () => this.fetchProfile());
    }

    private fetchProfile() {
        this.httpService.get<User>("/api/userProfile/" + this.data.steamId).subscribe(response => {
            this.profile = response;
            this.userReputationsDataSource = new UserReputationsDataSource(response.reputations);
            this.matchesDataSource = new MatchesDataSource(response.matches);
            if (this.profile.knownNames.length > 1) {
                this.knownNames = this.profile.knownNames.join(", ");
            }
        }, error => {
            console.error("Failed to fetch user profile for: " + this.data.steamId, error);
            this.dialog.close();
            this.appService.toastError("Failed to open user profile.");
        });
    }
}

export class UserReputationsDataSource extends DataSource<UserReputation> {
    public reputations: BehaviorSubject<UserReputation[]>;

    constructor(reputations: UserReputation[]) {
        super();
        this.reputations = new BehaviorSubject<UserReputation[]>(reputations);
    }

    public connect(collectionViewer: CollectionViewer) {
        return this.reputations.asObservable();
    }

    public disconnect(collectionViewer: CollectionViewer) {
    }
}

export class MatchesDataSource extends DataSource<MatchHistory> {
    public matches: BehaviorSubject<MatchHistory[]>;

    constructor(reputations: MatchHistory[]) {
        super();
        this.matches = new BehaviorSubject<MatchHistory[]>(reputations);
    }

    public connect(collectionViewer: CollectionViewer) {
        return this.matches.asObservable();
    }

    public disconnect(collectionViewer: CollectionViewer) {
    }
}

export interface UserProfileDialogData {
    steamId: string;
    reputationDeleted?(): void; 
}