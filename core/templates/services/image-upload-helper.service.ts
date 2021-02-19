// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Image upload helper service.
 */

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Injectable, SecurityContext } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import constants from 'assets/constants';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { WindowRef } from './contextual/window-ref.service';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadHelperService {
  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private sanitizer: DomSanitizer,
    private windowRef: WindowRef) {}

  private _generateDateTimeStringForFilename() {
    const date = new Date();
    return date.getFullYear() +
      ('0' + (date.getMonth() + 1)).slice(-2) +
      ('0' + date.getDate()).slice(-2) + '_' +
      ('0' + date.getHours()).slice(-2) +
      ('0' + date.getMinutes()).slice(-2) +
      ('0' + date.getSeconds()).slice(-2) + '_' +
      Math.random().toString(36).substr(2, 10);
  }

  convertImageDataToImageFile(dataURI: string): Blob {
    // Convert base64/URLEncoded data component to raw binary data
    // held in a string.
    const byteString = atob(dataURI.split(',')[1]);

    // Separate out the mime component.
    const mime = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // Write the bytes of the string to a typed array.
    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ia], { type: mime });
    if (blob.type.match('image') &&
      blob.size > 0) {
      return blob;
    } else {
      return null;
    }
  }

  getInvalidSvgTagsAndAttrs(dataURI: string):
    {tags: string[], attrs: string[]} {
    // Convert base64/URLEncoded data component to raw binary data
    // held in a string.
    const svgString = atob(dataURI.split(',')[1]);
    const domParser = new DOMParser();
    const doc = domParser.parseFromString(svgString, 'image/svg+xml');
    const invalidTags = [];
    const invalidAttrs = [];
    const allowedTags = Object.keys(constants.SVG_ATTRS_WHITELIST);
    let nodeTagName = null;
    doc.querySelectorAll('*').forEach((node) => {
      nodeTagName = node.tagName.toLowerCase();
      if (allowedTags.indexOf(nodeTagName) !== -1) {
        for (let i = 0; i < node.attributes.length; i++) {
          if (constants.SVG_ATTRS_WHITELIST[nodeTagName].indexOf(
            node.attributes[i].name.toLowerCase()) === -1) {
            invalidAttrs.push(
              node.tagName + ':' + node.attributes[i].name);
          }
        }
      } else {
        invalidTags.push(node.tagName);
      }
    });
    return { tags: invalidTags, attrs: invalidAttrs };
  }

  getTrustedResourceUrlForThumbnailFilename(
      imageFileName: string, entityType: string, entityId: string):
        SafeResourceUrl {
    const encodedFilepath = this.windowRef.nativeWindow.encodeURIComponent(
      imageFileName);
    return this.sanitizer.sanitize(
      SecurityContext.RESOURCE_URL,
      this.assetsBackendApiService.getThumbnailUrlForPreview(
        entityType, entityId, encodedFilepath));
  }

  generateImageFilename(
      height: number, width: number, extension: string): string {
    return 'img_' +
      this._generateDateTimeStringForFilename() +
      '_height_' + height +
      '_width_' + width +
      '.' + extension;
  }

  cleanMathExpressionSvgString(svgString: string): string {
    // We need to modify/remove unnecessary attributes added by mathjax
    // from the svg tag.
    const domParser = new DOMParser();
    const doc = domParser.parseFromString(svgString, 'image/svg+xml');
    doc.querySelectorAll('*').forEach((node) => {
      if (node.tagName.toLowerCase() === 'svg') {
        node.removeAttribute('xmlns:xlink');
        node.removeAttribute('role');
        // We are removing this attribute, because currently it is not in
        // the white list of valid attributes.
        node.removeAttribute('aria-hidden');
        node.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      // Remove the custom data attributes added by MathJax.
      // These custom attributes don't affect the rendering of the SVGs,
      // and they are not present in the white list for allowed attributes.
      for (let i = 0; i < node.attributes.length; i++) {
        if (node.attributes[i].name.toLowerCase().startsWith('data-')) {
          node.removeAttribute(node.attributes[i].name.toLowerCase());
        }
      }
    });
    return doc.documentElement.outerHTML;
  }

  extractDimensionsFromMathExpressionSvgString(svgString: string):
    {height: string, width: string, verticalPadding: string} {
    // The method below extracts the dimensions from the attributes of a
    // math SVG string generated by mathJax.
    const domParser = new DOMParser();
    const dimensions = {
      height: '',
      width: '',
      verticalPadding: ''
    };
    const doc = domParser.parseFromString(svgString, 'image/svg+xml');
    doc.querySelectorAll('*').forEach((node) => {
      // Mathjax SVGs have relative dimensions in the unit of 'ex' rather
      // than 'px'(pixels). Hence the dimesions have decimal points in them,
      // we need to replace these decimals with a letter so that it's easier
      // to process and validate the filnames.
      if (node.tagName.toLowerCase() === 'svg') {
        dimensions.height = (
          (node.getAttribute('height').match(/\d+\.*\d*/g)[0]).replace(
            '.', 'd'));
        dimensions.width = (
          (node.getAttribute('width').match(/\d+\.*\d*/g)[0]).replace(
            '.', 'd'));
        // This attribute is useful for the vertical allignment of the
        // Math SVG while displaying inline with other text.
        // Math SVGs don't necessarily have a vertical allignment, in that
        // case we assign it zero.
        const styleValue = node.getAttribute('style').match(/\d+\.*\d*/g);
        if (styleValue) {
          dimensions.verticalPadding = styleValue[0].replace('.', 'd');
        } else {
          dimensions.verticalPadding = '0';
        }
      }
    });
    return dimensions;
  }

  generateMathExpressionImageFilename(
      height: string, width: string, verticalPadding: string): string {
    const filename = (
      'mathImg_' +
        this._generateDateTimeStringForFilename() +
        '_height_' + height +
        '_width_' + width +
        '_vertical_' + verticalPadding +
        '.' + 'svg'
    );
    const filenameRegexString = constants.MATH_SVG_FILENAME_REGEX;
    const filenameRegex = RegExp(filenameRegexString, 'g');
    if (filenameRegex.exec(filename)) {
      return filename;
    } else {
      throw new Error(
        'The Math SVG filename format is invalid.');
    }
  }
}

angular.module('oppia').factory(
  'ImageUploadHelperService', downgradeInjectable(ImageUploadHelperService));
