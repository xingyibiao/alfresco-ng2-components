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

import { Component, Input, OnInit, OnChanges, OnDestroy,
    EventEmitter, ViewChild, SimpleChanges, Output
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { MinimalNodeEntity, NodePaging, Pagination, MinimalNodeEntryEntity, SiteEntry  } from 'alfresco-js-api';
import {
    AuthenticationService, AppConfigService, ContentService, TranslationService,
    FileUploadEvent, FolderCreatedEvent, LogService, NotificationService,
    UploadService, DataColumn, DataRow, UserPreferencesService,
    PaginationComponent, FormValues, DisplayMode, UserPreferenceValues
} from '@alfresco/adf-core';

import { DocumentListComponent, PermissionStyleModel } from '@alfresco/adf-content-services';

import { SelectAppsDialogComponent } from '@alfresco/adf-process-services';

import { VersionManagerDialogAdapterComponent } from './version-manager-dialog-adapter.component';
import { MetadataDialogAdapterComponent } from './metadata-dialog-adapter.component';
import { Subscription } from 'rxjs/Subscription';

const DEFAULT_FOLDER_TO_SHOW = '-my-';

@Component({
    selector: 'app-files-component',
    templateUrl: './files.component.html',
    styleUrls: ['./files.component.scss']
})
export class FilesComponent implements OnInit, OnChanges, OnDestroy {

    errorMessage: string = null;
    fileNodeId: any;
    showViewer = false;
    showVersions = false;
    displayMode = DisplayMode.List;
    includeFields = ['isLocked', 'aspectNames'];

    baseShareUrl = this.appConfig.get<string>('ecmHost') + '/preview/s/';

    toolbarColor = 'default';

    selectionModes = [
        { value: 'none', viewValue: 'None' },
        { value: 'single', viewValue: 'Single' },
        { value: 'multiple', viewValue: 'Multiple' }
    ];

    // The identifier of a node. You can also use one of these well-known aliases: -my- | -shared- | -root-
    @Input()
    currentFolderId: string = DEFAULT_FOLDER_TO_SHOW;

    formValues: FormValues = {};

    processId;

    @Input()
    selectionMode = 'multiple';

    @Input()
    multiselect = false;

    @Input()
    multipleFileUpload = false;

    @Input()
    folderUpload = false;

    @Input()
    acceptedFilesTypeShow = false;

    @Input()
    maxSizeShow = false;

    @Input()
    showVersionComments = true;

    @Input()
    versioning = false;

    @Input()
    allowVersionDownload = true;

    @Input()
    acceptedFilesType = '.jpg,.pdf,.js';

    @Input()
    maxFilesSize: number = null;

    @Input()
    enableUpload = true;

    @Input()
    nodeResult: NodePaging;

    @Input()
    pagination: Pagination;

    @Input()
    disableDragArea = false;

    @Output()
    documentListReady: EventEmitter<any> = new EventEmitter();

    @Output()
    changedPageSize: EventEmitter<Pagination> = new EventEmitter();

    @Output()
    changedPageNumber: EventEmitter<Pagination> = new EventEmitter();

    @Output()
    turnedNextPage: EventEmitter<Pagination> = new EventEmitter();

    @Output()
    turnedPreviousPage: EventEmitter<Pagination> = new EventEmitter();

    @Output()
    loadNext: EventEmitter<Pagination> = new EventEmitter();

    @Output()
    deleteElementSuccess: EventEmitter<any> = new EventEmitter();

    @ViewChild('documentList')
    documentList: DocumentListComponent;

    @ViewChild('standardPagination')
    standardPagination: PaginationComponent;

    permissionsStyle: PermissionStyleModel[] = [];
    infiniteScrolling: boolean;
    supportedPages: number[];

    private onCreateFolder: Subscription;
    private onEditFolder: Subscription;

    constructor(private notificationService: NotificationService,
                private uploadService: UploadService,
                private contentService: ContentService,
                private dialog: MatDialog,
                private translateService: TranslationService,
                private router: Router,
                private logService: LogService,
                private preference: UserPreferencesService,
                private appConfig: AppConfigService,
                public authenticationService: AuthenticationService) {
        this.supportedPages = this.appConfig.get('pagination.supportedPageSizes');
    }

    showFile(event) {
        const entry = event.value.entry;
        if (entry && entry.isFile) {
            this.router.navigate(['/files', entry.id, 'view']);
        }
    }

    toggleFolder() {
        this.multipleFileUpload = false;
        this.folderUpload = !this.folderUpload;
        return this.folderUpload;
    }

    ngOnInit() {
        if (!this.pagination) {
            this.pagination = <Pagination>{
                maxItems: this.preference.paginationSize,
                skipCount: 0
            };
        }

        // this.disableDragArea = false;
        this.uploadService.fileUploadComplete.asObservable().debounceTime(300).subscribe(value => this.onFileUploadEvent(value));
        this.uploadService.fileUploadDeleted.subscribe((value) => this.onFileUploadEvent(value));
        this.contentService.folderCreated.subscribe(value => this.onFolderCreated(value));
        this.onCreateFolder = this.contentService.folderCreate.subscribe(value => this.onFolderAction(value));
        this.onEditFolder = this.contentService.folderEdit.subscribe(value => this.onFolderAction(value));
        this.supportedPages = this.supportedPages ? this.supportedPages : this.preference.getDefaultPageSizes();

        // this.permissionsStyle.push(new PermissionStyleModel('document-list__create', PermissionsEnum.CREATE));
        // this.permissionsStyle.push(new PermissionStyleModel('document-list__disable', PermissionsEnum.NOT_CREATE, false, true));
    }

    ngOnDestroy() {
        this.onCreateFolder.unsubscribe();
        this.onEditFolder.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.nodeResult && changes.nodeResult.currentValue) {
            this.nodeResult = <NodePaging>changes.nodeResult.currentValue;
            this.pagination = this.nodeResult.list.pagination;
        }
        if (!this.pagination) {
            this.giveDefaultPaginationWhenNotDefined();
        }
    }

    giveDefaultPaginationWhenNotDefined() {
        this.pagination = <Pagination> {
            maxItems: this.preference.paginationSize,
            skipCount: 0,
            totalItems: 0,
            hasMoreItems: false
        };
    }

    getCurrentDocumentListNode(): MinimalNodeEntity[] {
        if (this.documentList.folderNode) {
            return [{ entry: this.documentList.folderNode }];
        } else {
            return [];
        }
    }

    onNavigationError(err: any) {
        if (err) {
            this.errorMessage = err.message || 'Navigation error';
        }
    }

    resetError() {
        this.errorMessage = null;
    }

    onFileUploadEvent(event: FileUploadEvent) {
        if (event && event.file.options.parentId === this.documentList.currentFolderId) {
            this.documentList.reload();
        }
    }

    onFolderCreated(event: FolderCreatedEvent) {
        this.logService.log('FOLDER CREATED');
        this.logService.log(event);
        if (event && event.parentId === this.documentList.currentFolderId) {
            this.documentList.reload();
        }
    }

    onFolderAction(node) {
        this.logService.log(node);
        if (node && node.parentId === this.documentList.currentFolderId) {
            this.documentList.reload();
        }
    }

    handlePermissionError(event: any) {
        this.translateService.get('PERMISSON.LACKOF', {
            permission: event.permission,
            action: event.action,
            type: event.type
        }).subscribe((message) => {
            this.openSnackMessage(message);
        });
    }

    openSnackMessage(event: any) {
        this.notificationService.openSnackMessage(
            event,
            4000
        );
    }

    emitReadyEvent(event: NodePaging) {
        this.documentListReady.emit(event);
        this.router.navigate(['/files', event.list.source.id]);
    }

    pageIsEmpty(node: NodePaging) {
        return node && node.list && node.list.entries.length === 0;
    }

    onContentActionError(errors) {
        const errorStatusCode = JSON.parse(errors.message).error.statusCode;
        let translatedErrorMessage: any;

        switch (errorStatusCode) {
            case 403:
                translatedErrorMessage = this.translateService.get('OPERATION.ERROR.PERMISSION');
                break;
            case 409:
                translatedErrorMessage = this.translateService.get('OPERATION.ERROR.CONFLICT');
                break;
            default:
                translatedErrorMessage = this.translateService.get('OPERATION.ERROR.UNKNOWN');
        }

        this.openSnackMessage(translatedErrorMessage.value);
    }

    onContentActionSuccess(message) {
        const translatedMessage: any = this.translateService.get(message);
        this.openSnackMessage(translatedMessage.value);
        this.reloadForInfiniteScrolling();
    }

    onDeleteActionSuccess(message) {
        this.uploadService.fileDeleted.next(message);
        this.deleteElementSuccess.emit();
        this.reloadForInfiniteScrolling();
        this.openSnackMessage(message);
    }

    onPermissionRequested(node) {
        this.router.navigate(['/permissions', node.value.entry.id]);
    }

    private reloadForInfiniteScrolling() {
        if (this.infiniteScrolling) {
            this.documentList.skipCount = 0;
        }
        this.documentList.reload();
    }

    onManageVersions(event) {
        const contentEntry = event.value.entry;
        const showComments = this.showVersionComments;
        const allowDownload = this.allowVersionDownload;

        if (this.contentService.hasPermission(contentEntry, 'update')) {
            this.dialog.open(VersionManagerDialogAdapterComponent, {
                data: { contentEntry, showComments, allowDownload },
                panelClass: 'adf-version-manager-dialog',
                width: '630px'
            });
        } else {
            const translatedErrorMessage: any = this.translateService.get('OPERATION.ERROR.PERMISSION');
            this.openSnackMessage(translatedErrorMessage.value);
        }
    }

    onManageMetadata(event) {
        const contentEntry = event.value.entry;

        if (this.contentService.hasPermission(contentEntry, 'update')) {
            this.dialog.open(MetadataDialogAdapterComponent, {
                data: { contentEntry },
                panelClass: 'adf-metadata-manager-dialog',
                width: '630px'
            });
        } else {
            const translatedErrorMessage: any = this.translateService.get('OPERATION.ERROR.PERMISSION');
            this.openSnackMessage(translatedErrorMessage.value);
        }
    }

    onSiteChange(site: SiteEntry) {
        this.currentFolderId = site.entry.guid;
    }

    getDocumentListCurrentFolderId() {
        return this.documentList.currentFolderId || DEFAULT_FOLDER_TO_SHOW;
    }

    hasSelection(selection: Array<MinimalNodeEntity>): boolean {
        return selection && selection.length > 0;
    }

    hasOneFileSelected(): boolean {
        const selection: Array<MinimalNodeEntity> = this.documentList.selection;
        const hasOneFileSelected = selection && selection.length === 1 && selection[0].entry.isFile;
        return hasOneFileSelected;
    }

    userHasPermissionToManageVersions(): boolean {
        const selection: Array<MinimalNodeEntity> = this.documentList.selection;
        return this.contentService.hasPermission(selection[0].entry, 'update');
    }

    getNodeNameTooltip(row: DataRow, col: DataColumn): string {
        if (row) {
            return row.getValue('name');
        }
        return null;
    }

    canEditFolder(selection: Array<MinimalNodeEntity>): boolean {
        if (selection && selection.length === 1) {
            const entry = selection[0].entry;

            if (entry && entry.isFolder) {
                return this.contentService.hasPermission(entry, 'update');
            }
        }
        return false;
    }

    canCreateContent(parentNode: MinimalNodeEntryEntity): boolean {
        if (parentNode) {
            return this.contentService.hasPermission(parentNode, 'create');
        }
        return false;
    }

    startProcesAction($event) {
        this.formValues['file'] = $event.value.entry;

        const dialogRef = this.dialog.open(SelectAppsDialogComponent, {
            width: '630px',
            panelClass: 'adf-version-manager-dialog'
        });

        dialogRef.afterClosed().subscribe(selectedProcess => {
            this.processId = selectedProcess.id;
        });

    }

    onChangePageSize(event: Pagination): void {
        this.preference.paginationSize = event.maxItems;
        this.changedPageSize.emit(event);
    }

    onChangePageNumber(event: Pagination): void {
        this.changedPageNumber.emit(event);
    }

    onNextPage(event: Pagination): void {
        this.turnedNextPage.emit(event);
    }

    loadNextBatch(event: Pagination) {
        this.loadNext.emit(event);
    }

    onPrevPage(event: Pagination): void {
        this.turnedPreviousPage.emit(event);
    }

    toogleGalleryView(): void {
        if (this.displayMode === DisplayMode.List) {
            this.displayMode = DisplayMode.Gallery;
        } else {
            this.displayMode = DisplayMode.List;
        }
    }
}
