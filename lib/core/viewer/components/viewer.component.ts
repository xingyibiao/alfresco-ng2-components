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

import { Location } from '@angular/common';
import {
    Component, ContentChild, EventEmitter, HostListener, ElementRef,
    Input, OnChanges, Output, SimpleChanges, TemplateRef,
    ViewEncapsulation, OnInit, OnDestroy
} from '@angular/core';
import { MinimalNodeEntryEntity, RenditionEntry } from 'alfresco-js-api';
import { BaseEvent } from '../../events';
import { AlfrescoApiService } from '../../services/alfresco-api.service';
import { LogService } from '../../services/log.service';
import { ViewerMoreActionsComponent } from './viewer-more-actions.component';
import { ViewerOpenWithComponent } from './viewer-open-with.component';
import { ViewerSidebarComponent } from './viewer-sidebar.component';
import { ViewerToolbarComponent } from './viewer-toolbar.component';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'adf-viewer',
    templateUrl: './viewer.component.html',
    styleUrls: ['./viewer.component.scss'],
    host: { 'class': 'adf-viewer' },
    encapsulation: ViewEncapsulation.None
})
export class ViewerComponent implements OnChanges, OnInit, OnDestroy {

    @ContentChild(ViewerToolbarComponent)
    toolbar: ViewerToolbarComponent;

    @ContentChild(ViewerSidebarComponent)
    sidebar: ViewerSidebarComponent;

    @ContentChild(ViewerOpenWithComponent)
    mnuOpenWith: ViewerOpenWithComponent;

    @ContentChild(ViewerMoreActionsComponent)
    mnuMoreActions: ViewerMoreActionsComponent;

    /** If you want to load an external file that does not come from ACS you
     * can use this URL to specify where to load the file from.
     */
    @Input()
    urlFile = '';

    /** Viewer to use with the `urlFile` address (`pdf`, `image`, `media`, `text`).
     * Used when `urlFile` has no filename and extension.
     */
    @Input()
    urlFileViewer: string = null;

    /** Loads a Blob File */
    @Input()
    blobFile: Blob;

    /** Node Id of the file to load. */
    @Input()
    fileNodeId: string = null;

    /** Shared link id (to display shared file). */
    @Input()
    sharedLinkId: string = null;

    /** If `true` then show the Viewer as a full page over the current content.
     * Otherwise fit inside the parent div.
     */
    @Input()
    overlayMode = false;

    /** Hide or show the viewer */
    @Input()
    showViewer = true;

    /** Hide or show the toolbar */
    @Input()
    showToolbar = true;

    /** Specifies the name of the file when it is not available from the URL. */
    @Input()
    displayName: string;

    /** Allows `back` navigation */
    @Input()
    allowGoBack = true;

    /** Toggles downloading. */
    @Input()
    allowDownload = true;

    /** Toggles printing. */
    @Input()
    allowPrint = false;

    /** Toggles sharing. */
    @Input()
    allowShare = false;

    /** Toggles the 'Full Screen' feature. */
    @Input()
    allowFullScreen = true;

    /** Toggles before/next navigation. You can use the arrow buttons to navigate
     * between documents in the collection.
     */
    @Input()
    allowNavigate = false;

    /** Toggles the "before" ("<") button. Requires `allowNavigate` to be enabled. */
    @Input()
    canNavigateBefore = true;

    /** Toggles the next (">") button. Requires `allowNavigate` to be enabled. */
    @Input()
    canNavigateNext = true;

    /** Toggles the sidebar. */
    @Input()
    allowSidebar = false;

    /** Toggles PDF thumbnails. */
    @Input()
    allowThumbnails = true;

    /** Toggles sidebar visibility. Requires `allowSidebar` to be set to `true`. */
    @Input()
    showSidebar = false;

    /** The position of the sidebar. Can be `left` or `right`. */
    @Input()
    sidebarPosition = 'right';

    /** The template for the sidebar. The template context contains the loaded node data. */
    @Input()
    sidebarTemplate: TemplateRef<any> = null;

    /** The template for the pdf thumbnails. */
    @Input()
    thumbnailsTemplate: TemplateRef<any> = null;

    /** MIME type of the file content (when not determined by the filename extension). */
    @Input()
    mimeType: string;

    /** Content filename. */
    @Input()
    fileName: string;

    /** URL to download. */
    @Input()
    downloadUrl: string = null;

    /** Number of times the Viewer will retry fetching content Rendition.
     * There is a delay of at least one second between attempts.
     */
    @Input()
    maxRetries = 5;

    /** Emitted when user clicks the 'Back' button. */
    @Output()
    goBack = new EventEmitter<BaseEvent<any>>();

    /** Emitted when user clicks the 'Download' button. */
    @Output()
    download = new EventEmitter<BaseEvent<any>>();

    /** Emitted when user clicks the 'Print' button. */
    @Output()
    print = new EventEmitter<BaseEvent<any>>();

    /** Emitted when user clicks the 'Share' button. */
    @Output()
    share = new EventEmitter<BaseEvent<any>>();

    /** Emitted when the viewer is shown or hidden. */
    @Output()
    showViewerChange = new EventEmitter<boolean>();

    /** Emitted when the filename extension changes. */
    @Output()
    extensionChange = new EventEmitter<string>();

    /** Emitted when user clicks 'Navigate Before' ("<") button. */
    @Output()
    navigateBefore = new EventEmitter();

    /** Emitted when user clicks 'Navigate Next' (">") button. */
    @Output()
    navigateNext = new EventEmitter();

    showPdfThumbnails: boolean = false;
    viewerType = 'unknown';
    isLoading = false;
    node: MinimalNodeEntryEntity;

    extensionTemplates: { template: TemplateRef<any>, isVisible: boolean }[] = [];
    externalExtensions: string[] = [];
    urlFileContent: string;
    otherMenu: any;
    extension: string;
    sidebarTemplateContext: { node: MinimalNodeEntryEntity } = { node: null };

    private subscriptions: Subscription[] = [];

    // Extensions that are supported by the Viewer without conversion
    private extensions = {
        image: ['png', 'jpg', 'jpeg', 'gif', 'bpm', 'svg'],
        media: ['wav', 'mp4', 'mp3', 'webm', 'ogg'],
        text: ['txt', 'xml', 'js', 'html', 'json', 'ts'],
        pdf: ['pdf']
    };

    // Mime types that are supported by the Viewer without conversion
    private mimeTypes = {
        text: ['text/plain', 'text/csv', 'text/xml', 'text/html', 'application/x-javascript'],
        pdf: ['application/pdf'],
        image: ['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/svg+xml'],
        media: ['video/mp4', 'video/webm', 'video/ogg', 'audio/mpeg', 'audio/ogg', 'audio/wav']
    };

    constructor(private apiService: AlfrescoApiService,
                private logService: LogService,
                private location: Location,
                private el: ElementRef) {
    }

    isSourceDefined(): boolean {
        return (this.urlFile || this.blobFile || this.fileNodeId || this.sharedLinkId) ? true : false;
    }

    ngOnInit() {
        this.subscriptions = this.subscriptions.concat([
            this.apiService.nodeUpdated.subscribe(node => this.onNodeUpdated(node))
        ]);
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
        this.subscriptions = [];
    }

    private onNodeUpdated(node: MinimalNodeEntryEntity) {
        if (node && node.id === this.fileNodeId) {
            this.setUpNodeFile(node);
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.showViewer) {
            if (!this.isSourceDefined()) {
                throw new Error('A content source attribute value is missing.');
            }
            if (this.blobFile) {
                this.setUpBlobData();
            } else if (this.urlFile) {
                this.setUpUrlFile();
            } else if (this.fileNodeId) {
                this.isLoading = true;
                this.apiService.nodesApi.getNodeInfo(this.fileNodeId).then(
                    (data: MinimalNodeEntryEntity) => {
                        this.setUpNodeFile(data);
                    },
                    (error) => {
                        this.isLoading = false;
                        this.logService.error('This node does not exist');
                    }
                );
            } else if (this.sharedLinkId) {
                this.isLoading = true;

                this.apiService.sharedLinksApi.getSharedLink(this.sharedLinkId).then(details => {
                    this.setUpSharedLinkFile(details);
                });
            }
        }
    }

    private setUpBlobData() {
        this.displayName = this.getDisplayName('Unknown');
        this.isLoading = true;
        this.mimeType = this.blobFile.type;
        this.viewerType = this.getViewerTypeByMimeType(this.mimeType);

        this.allowDownload = false;
        // TODO: wrap blob into the data url and allow downloading

        this.extensionChange.emit(this.mimeType);
        this.isLoading = false;
        this.scrollTop();
    }

    private setUpUrlFile() {
        this.isLoading = true;
        let filenameFromUrl = this.getFilenameFromUrl(this.urlFile);
        this.displayName = this.getDisplayName(filenameFromUrl);
        this.extension = this.getFileExtension(filenameFromUrl);
        this.urlFileContent = this.urlFile;

        this.downloadUrl = this.urlFile;
        this.fileName = this.displayName;

        this.viewerType = this.urlFileViewer || this.getViewerTypeByExtension(this.extension);
        if (this.viewerType === 'unknown') {
            this.viewerType = this.getViewerTypeByMimeType(this.mimeType);
        }

        this.extensionChange.emit(this.extension);
        this.isLoading = false;
        this.scrollTop();
    }

    private setUpNodeFile(data: MinimalNodeEntryEntity) {
        this.mimeType = data.content.mimeType;
        this.displayName = data.name;
        this.urlFileContent = this.apiService.contentApi.getContentUrl(data.id);
        this.extension = this.getFileExtension(data.name);

        this.fileName = data.name;
        this.downloadUrl = this.apiService.contentApi.getContentUrl(data.id, true);

        this.viewerType = this.getViewerTypeByExtension(this.extension);
        if (this.viewerType === 'unknown') {
            this.viewerType = this.getViewerTypeByMimeType(this.mimeType);
        }

        if (this.viewerType === 'unknown') {
            this.displayNodeRendition(data.id);
        } else {
            this.isLoading = false;
        }

        this.extensionChange.emit(this.extension);
        this.sidebarTemplateContext.node = data;
        this.scrollTop();
    }

    private setUpSharedLinkFile(details: any) {
        this.mimeType = details.entry.content.mimeType;
        this.displayName = this.getDisplayName(details.entry.name);
        this.extension = this.getFileExtension(details.entry.name);
        this.fileName = details.entry.name;

        this.urlFileContent = this.apiService.contentApi.getSharedLinkContentUrl(this.sharedLinkId, false);
        this.downloadUrl = this.apiService.contentApi.getSharedLinkContentUrl(this.sharedLinkId, true);

        this.viewerType = this.getViewerTypeByMimeType(this.mimeType);
        if (this.viewerType === 'unknown') {
            this.viewerType = this.getViewerTypeByExtension(this.extension);
        }

        if (this.viewerType === 'unknown') {
            this.displaySharedLinkRendition(this.sharedLinkId);
        } else {
            this.isLoading = false;
        }
        this.extensionChange.emit(this.extension);
        this.isLoading = false;
    }

    toggleSidebar() {
        this.showSidebar = !this.showSidebar;
        if (this.showSidebar && this.fileNodeId) {
            this.apiService.getInstance().nodes.getNodeInfo(this.fileNodeId)
                .then((data: MinimalNodeEntryEntity) => {
                    this.sidebarTemplateContext.node = data;
                });
        }
    }

    private getDisplayName(name) {
        return this.displayName || name;
    }

    scrollTop() {
        window.scrollTo(0, 1);
    }

    getViewerTypeByMimeType(mimeType: string) {
        if (mimeType) {
            mimeType = mimeType.toLowerCase();

            const editorTypes = Object.keys(this.mimeTypes);
            for (let type of editorTypes) {
                if (this.mimeTypes[type].indexOf(mimeType) >= 0) {
                    return type;
                }
            }
        }
        return 'unknown';
    }

    getViewerTypeByExtension(extension: string) {
        if (extension) {
            extension = extension.toLowerCase();
        }

        if (this.isCustomViewerExtension(extension)) {
            return 'custom';
        }

        if (this.extensions.image.indexOf(extension) >= 0) {
            return 'image';
        }

        if (this.extensions.media.indexOf(extension) >= 0) {
            return 'media';
        }

        if (this.extensions.text.indexOf(extension) >= 0) {
            return 'text';
        }

        if (this.extensions.pdf.indexOf(extension) >= 0) {
            return 'pdf';
        }

        return 'unknown';
    }

    onBackButtonClick() {
        if (this.overlayMode) {
            this.close();
        } else {
            const event = new BaseEvent<any>();
            this.goBack.next(event);

            if (!event.defaultPrevented) {
                this.location.back();
            }
        }
    }

    onNavigateBeforeClick() {
        this.navigateBefore.next();
    }

    onNavigateNextClick() {
        this.navigateNext.next();
    }

    /**
     * close the viewer
     */
    close() {
        if (this.otherMenu) {
            this.otherMenu.hidden = false;
        }
        this.showViewer = false;
        this.showViewerChange.emit(this.showViewer);
    }

    /**
     * get File name from url
     *
     * @param  url - url file
     */
    getFilenameFromUrl(url: string): string {
        let anchor = url.indexOf('#');
        let query = url.indexOf('?');
        let end = Math.min(
            anchor > 0 ? anchor : url.length,
            query > 0 ? query : url.length);
        return url.substring(url.lastIndexOf('/', end) + 1, end);
    }

    /**
     * Get file extension from the string.
     * Supports the URL formats like:
     * http://localhost/test.jpg?cache=1000
     * http://localhost/test.jpg#cache=1000
     *
     * @param fileName - file name
     */
    getFileExtension(fileName: string): string {
        if (fileName) {
            const match = fileName.match(/\.([^\./\?\#]+)($|\?|\#)/);
            return match ? match[1] : null;
        }
        return null;
    }

    isCustomViewerExtension(extension: string): boolean {
        const extensions = this.externalExtensions || [];

        if (extension && extensions.length > 0) {
            extension = extension.toLowerCase();
            return extensions.indexOf(extension) >= 0;
        }

        return false;
    }

    /**
     * Keyboard event listener
     * @param  event
     */
    @HostListener('document:keyup', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        const key = event.keyCode;

        // Esc
        if (key === 27 && this.overlayMode) { // esc
            this.close();
        }

        // Left arrow
        if (key === 37 && this.canNavigateBefore) {
            event.preventDefault();
            this.onNavigateBeforeClick();
        }

        // Right arrow
        if (key === 39 && this.canNavigateNext) {
            event.preventDefault();
            this.onNavigateNextClick();
        }

        // Ctrl+F
        if (key === 70 && event.ctrlKey) {
            event.preventDefault();
            this.enterFullScreen();
        }
    }

    downloadContent() {
        if (this.allowDownload && this.downloadUrl && this.fileName) {
            const args = new BaseEvent();
            this.download.next(args);

            if (!args.defaultPrevented) {
                const link = document.createElement('a');

                link.style.display = 'none';
                link.download = this.fileName;
                link.href = this.downloadUrl;

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }

    printContent() {
        if (this.allowPrint) {
            const args = new BaseEvent();
            this.print.next(args);
        }
    }

    shareContent() {
        if (this.allowShare) {
            const args = new BaseEvent();
            this.share.next(args);
        }
    }

    /**
     * Triggers full screen mode with a main content area displayed.
     */
    enterFullScreen(): void {
        if (this.allowFullScreen) {
            const container = this.el.nativeElement.querySelector('.adf-viewer__fullscreen-container');
            if (container) {
                if (container.requestFullscreen) {
                    container.requestFullscreen();
                } else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen();
                } else if (container.mozRequestFullScreen) {
                    container.mozRequestFullScreen();
                } else if (container.msRequestFullscreen) {
                    container.msRequestFullscreen();
                }
            }
        }
    }

    private async displayNodeRendition(nodeId: string) {
        this.isLoading = true;

        try {
            const rendition = await this.resolveRendition(nodeId, 'pdf');
            if (rendition) {
                const renditionId = rendition.entry.id;

                if (renditionId === 'pdf') {
                    this.viewerType = 'pdf';
                } else if (renditionId === 'imgpreview') {
                    this.viewerType = 'image';
                }

                this.urlFileContent = this.apiService.contentApi.getRenditionUrl(nodeId, renditionId);
            }
        } catch (err) {
            this.logService.error(err);
        }

        this.isLoading = false;
    }

    private async displaySharedLinkRendition(sharedId: string) {
        this.isLoading = true;

        try {
            const rendition = await this.apiService.renditionsApi.getSharedLinkRendition(sharedId, 'pdf');
            if (rendition.entry.status.toString() === 'CREATED') {
                this.viewerType = 'pdf';
                this.urlFileContent = this.apiService.contentApi.getSharedLinkRenditionUrl(sharedId, 'pdf');
            }
        } catch (error) {
            this.logService.error(error);
            try {
                const rendition = await this.apiService.renditionsApi.getSharedLinkRendition(sharedId, 'imgpreview');
                if (rendition.entry.status.toString() === 'CREATED') {
                    this.viewerType = 'image';
                    this.urlFileContent = this.apiService.contentApi.getSharedLinkRenditionUrl(sharedId, 'imgpreview');
                }
            } catch (error) {
                this.logService.error(error);
            }
        }

        this.isLoading = false;
    }

    private async resolveRendition(nodeId: string, renditionId: string): Promise<RenditionEntry> {
        renditionId = renditionId.toLowerCase();

        const supported = await this.apiService.renditionsApi.getRenditions(nodeId);

        let rendition = supported.list.entries.find(obj => obj.entry.id.toLowerCase() === renditionId);
        if (!rendition) {
            renditionId = 'imgpreview';
            rendition = supported.list.entries.find(obj => obj.entry.id.toLowerCase() === renditionId);

            if (!rendition) {
                return null;
            }
        }

        const status = rendition.entry.status.toString();

        if (status === 'CREATED') {
            return rendition;
        } else if (status === 'NOT_CREATED') {
            try {
                await this.apiService.renditionsApi.createRendition(nodeId, {id: renditionId});
                return await this.waitRendition(nodeId, renditionId, 0);
            } catch (err) {
                this.logService.error(err);
                return null;
            }
        }
    }

    private async waitRendition(nodeId: string, renditionId: string, retries: number): Promise<RenditionEntry> {
        const rendition = await this.apiService.renditionsApi.getRendition(nodeId, renditionId);

        if (retries > this.maxRetries) {
            return null;
        }

        const status = rendition.entry.status.toString();

        if (status === 'CREATED') {
            return rendition;
        } else {
            retries += 1;
            await this.wait(1000);
            return await this.waitRendition(nodeId, renditionId, retries);
        }
    }

    private wait(ms: number): Promise<any> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
