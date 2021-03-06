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

import { Injectable } from '@angular/core';
import { MinimalNodeEntryEntity } from 'alfresco-js-api';
import { BasicPropertiesService } from './basic-properties.service';
import { Observable } from 'rxjs/Observable';
import { PropertyGroupTranslatorService } from './property-groups-translator.service';
import { CardViewItem } from '@alfresco/adf-core';
import { CardViewGroup } from '../interfaces/content-metadata.interfaces';
import { ContentMetadataConfigFactory } from './config/content-metadata-config.factory';
import { PropertyDescriptorsService } from './property-descriptors.service';

@Injectable()
export class ContentMetadataService {

    constructor(private basicPropertiesService: BasicPropertiesService,
                private contentMetadataConfigFactory: ContentMetadataConfigFactory,
                private propertyGroupTranslatorService: PropertyGroupTranslatorService,
                private propertyDescriptorsService: PropertyDescriptorsService) {
    }

    getBasicProperties(node: MinimalNodeEntryEntity): Observable<CardViewItem[]> {
        return Observable.of(this.basicPropertiesService.getProperties(node));
    }

    getGroupedProperties(node: MinimalNodeEntryEntity, presetName: string = 'default'): Observable<CardViewGroup[]> {
        let groupedProperties = Observable.of([]);

        if (node.aspectNames) {
            const config = this.contentMetadataConfigFactory.get(presetName),
                groupNames = node.aspectNames
                    .concat(node.nodeType)
                    .filter(groupName => config.isGroupAllowed(groupName));

            if (groupNames.length > 0) {
                groupedProperties = this.propertyDescriptorsService.load(groupNames)
                    .map(groups => config.reorganiseByConfig(groups))
                    .map(groups => this.propertyGroupTranslatorService.translateToCardViewGroups(groups, node.properties));
            }
        }

        return groupedProperties;
    }
}
