﻿import { Component, OnInit, ViewChild } from '@angular/core';
import { MdPaginator } from '@angular/material';
import { DataSource } from '@angular/cdk';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';

import { AppService, HttpService } from '../../shared';

@Component({
    selector: 'history-page',
    templateUrl: 'history-page.component.html',
    styleUrls: ['./history-page.component.scss']
})
export class HistoryPageComponent implements OnInit {
    public loading = true;
    public showOnlyStartedLobbies = true;
    public matchHistoryDataSource: MatchHistoryDataSource;
    public displayedColumns = ["lobbyName", "joined", "started", "players", "negativeReputations", "positiveReputations"];
    private matches: MatchHistory[];
    @ViewChild(MdPaginator) paginator: MdPaginator;

    constructor(private appService: AppService, private httpService: HttpService) {
    }

    public ngOnInit() {
        this.getMatches();
    }

    private getMatches() {
        this.loading = true;
        this.httpService.get<MatchHistory[]>("/api/matchHistory").subscribe(matches => {
            this.matches = matches;
            this.matchHistoryDataSource = new MatchHistoryDataSource(matches, this.paginator, this.showOnlyStartedLobbies);
            this.loading = false;
        }, error => {
            console.error("Failed to fetch history", error);
            this.appService.toastError("Failed to retrieve history.");
        });
    }

    private showOnlyStartedLobbiesChanged() {
        this.matchHistoryDataSource = new MatchHistoryDataSource(this.matches, this.paginator, this.showOnlyStartedLobbies)
    }
}

export class MatchHistoryDataSource extends DataSource<MatchHistory> {
    public matches: BehaviorSubject<MatchHistory[]>;

    constructor(matches: MatchHistory[], private paginator: MdPaginator, private showStartedMatches: boolean) {
        super();
        this.matches = new BehaviorSubject<MatchHistory[]>(matches);
    }

    public connect() {
        let displayDataChanges = [
            this.matches,
            this.paginator.page,
        ];

        return Observable.merge(...displayDataChanges).map(() => {
            let data = this.matches.value.slice();
            if (this.showStartedMatches) {
                data = data.filter(m => m.started == true);
            }
            let startIndex = this.paginator.pageIndex * this.paginator.pageSize;
            return data.splice(startIndex, this.paginator.pageSize);
        });
    }

    public disconnect() {
    }
}

interface MatchHistory {
    id: number;
    name: string;
    players: number;
    negativeReputations: number;
    positiveReputations: number;
    joined: string;
    started: boolean;
}