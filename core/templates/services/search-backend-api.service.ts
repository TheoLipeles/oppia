// Copyright 2018 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Service for searching for collections
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ExplorationSummaryBackendDict } from 'domain/summary/exploration-summary-backend-api.service';
import { ServicesConstants } from './services.constants';

export interface SelectionList {[key: string]: boolean}

export interface FilterDetails {
  description: string;
  itemsName: string;
  masterList: {
    id: string;
    text: string;
  }[];
  selections: SelectionList;
  numSelections: number;
  summary: string;
}

export interface SelectionDetails {
  categories: FilterDetails;
  languageCodes: FilterDetails;
}

export interface SearchResponse {
  'search_cursor': string;
  'activity_list': ExplorationSummaryBackendDict;
}


@Injectable({
  providedIn: 'root'
})
export class SearchBackendApiService {
  constructor(private http: HttpClient) {}

  async getSearchResults(searchQuery:string): Promise<SearchResponse> {
    return this.http.get<SearchResponse>(
      ServicesConstants.SEARCH_DATA_URL + searchQuery).toPromise();
  }
}

angular.module('oppia').factory(
  'UserBackendApiService',
  downgradeInjectable(SearchBackendApiService));
