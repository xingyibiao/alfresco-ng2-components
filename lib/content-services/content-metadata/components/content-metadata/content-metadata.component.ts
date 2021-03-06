/*!
 * @license
 * Copyright 2016 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component, Input, OnChanges, OnInit, SimpleChanges, SimpleChange, ViewEncapsulation } from '@angular/core';
import { MinimalNodeEntryEntity } from 'alfresco-js-api';
import { Observable } from 'rxjs/Observable';
import { CardViewItem, NodesApiService, LogService, CardViewUpdateService, AlfrescoApiService } from '@alfresco/adf-core';
import { ContentMetadataService } from '../../services/content-metadata.service';
import { CardViewGroup } from '../../interfaces/content-metadata.interfaces';

@Component({
    selector: 'adf-content-metadata',
    templateUrl: './content-metadata.component.html',
    styleUrls: ['./content-metadata.component.scss'],
    host: { 'class': 'adf-content-metadata' },
    encapsulation: ViewEncapsulation.None
})
export class ContentMetadataComponent implements OnChanges, OnInit {

    @Input()
    node: MinimalNodeEntryEntity;

    @Input()
    editable: boolean = false;

    @Input()
    displayEmpty: boolean = false;

    @Input()
    expanded: boolean = false;

    @Input()
    multi = false;

    @Input()
    preset: string;

    nodeHasBeenUpdated: boolean = false;
    basicProperties$: Observable<CardViewItem[]>;
    groupedProperties$: Observable<CardViewGroup[]>;

    constructor(private contentMetadataService: ContentMetadataService,
                private cardViewUpdateService: CardViewUpdateService,
                private nodesApi: NodesApiService,
                private logService: LogService,
                private apiService: AlfrescoApiService) {}

    ngOnInit() {
        this.cardViewUpdateService.itemUpdated$
            .switchMap(this.saveNode.bind(this))
            .subscribe(
                (node) => {
                    this.nodeHasBeenUpdated = true;
                    this.node = node;
                    this.apiService.nodeUpdated.next(node);
                },
                error => this.logService.error(error)
            );
    }

    ngOnChanges(changes: SimpleChanges) {
        const nodeChange: SimpleChange = changes['node'];
        if (nodeChange || this.nodeHasBeenUpdated) {
            const node = nodeChange && nodeChange.currentValue || this.node;
            this.nodeHasBeenUpdated = false;

            this.basicProperties$ = this.contentMetadataService.getBasicProperties(node);
            this.groupedProperties$ = this.contentMetadataService.getGroupedProperties(node, this.preset);
        }
    }

    private saveNode({ changed: nodeBody }): Observable<MinimalNodeEntryEntity> {
        return this.nodesApi.updateNode(this.node.id, nodeBody);
    }
}
