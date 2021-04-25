// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TranslationModalComponent.
*/

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';

import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { CkEditorCopyContentService } from 'components/ck-editor-helpers/ck-editor-copy-content-service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { TranslationModalComponent, TranslationOpportunity } from 'pages/contributor-dashboard-page/modal-templates/translation-modal.component';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { ContextService } from 'services/context.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { MachineTranslatedTextBackendDict } from '../services/machine-translated-text-backend-api.service';
import { TranslateTextService } from '../services/translate-text.service';

class MockChangeDetectorRef {
  detectChanges(): void {}
}

describe('Translation Modal Component', () => {
  let contextService: ContextService;
  let translateTextService: TranslateTextService;
  let translationLanguageService: TranslationLanguageService;
  let ckEditorCopyContentService: CkEditorCopyContentService;
  let siteAnalyticsService: SiteAnalyticsService;
  let imageLocalStorageService: ImageLocalStorageService;
  let urlInterpolationService: UrlInterpolationService;
  let activeModal: NgbActiveModal;
  let httpTestingController: HttpTestingController;
  let fixture: ComponentFixture<TranslationModalComponent>;
  let component: TranslationModalComponent;
  let changeDetectorRef: MockChangeDetectorRef = new MockChangeDetectorRef();
  const opportunity: TranslationOpportunity = {
    id: '1',
    heading: 'Heading',
    subheading: 'subheading',
    progressPercentage: '20',
    actionButtonTitle: 'Action Button'
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        TranslationModalComponent
      ],
      providers: [
        NgbActiveModal,
        {
          provide: ChangeDetectorRef,
          useValue: changeDetectorRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslationModalComponent);
    component = fixture.componentInstance;
    component.opportunity = opportunity;
    httpTestingController = TestBed.inject(HttpTestingController);
    ckEditorCopyContentService = TestBed.inject(CkEditorCopyContentService);
    contextService = TestBed.inject(ContextService);
    activeModal = TestBed.inject(NgbActiveModal);
    translateTextService = TestBed.inject(TranslateTextService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    translationLanguageService.setActiveLanguageCode('es');
  });

  it('should invoke change detection when html is updated', () => {
    component.activeWrittenTranslation.html = 'old';
    spyOn(changeDetectorRef, 'detectChanges').and.callThrough();
    component.updateHtml('new');
    expect(component.activeWrittenTranslation.html).toEqual('new');
  });

  it('should not invoke change detection when html is not updated', () => {
    component.activeWrittenTranslation.html = 'old';
    spyOn(changeDetectorRef, 'detectChanges').and.callThrough();
    component.updateHtml('old');
    expect(component.activeWrittenTranslation.html).toEqual('old');
    expect(changeDetectorRef.detectChanges).toHaveBeenCalledTimes(0);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should close', () => {
    spyOn(activeModal, 'close');
    component.close();
    expect(activeModal.close).toHaveBeenCalled();
  });

  it('should use UrlInterpolationService for static assets', () => {
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.callThrough();
    const imgUrl = component.getStaticImageUrl(
      '/google-translate-attribution/translated_by_google.svg');
    expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalled();
    expect(imgUrl).toBe(
      '/assets/images/google-translate-attribution/translated_by_google.svg');
  });

  describe('when initialized', () => {
    describe('with an rtl language', () => {
      beforeEach(fakeAsync(() => {
        translationLanguageService.setActiveLanguageCode('ar');
        spyOn(translateTextService, 'init').and.callFake(
          (expId, languageCode, successCallback) => successCallback());
        component.ngOnInit();
      }));

      it('should set the schema constant correctly', () => {
        expect(component.getHtmlSchema().ui_config.languageDirection)
          .toBe('rtl');
      });
    });

    describe('with an ltr language', () => {
      beforeEach(fakeAsync(() => {
        translationLanguageService.setActiveLanguageCode('es');
        spyOn(translateTextService, 'init').and.callFake(
          (expId, languageCode, successCallback) => successCallback());
        component.ngOnInit();
      }));

      it('should set the schema constant correctly', () => {
        expect(component.getHtmlSchema().ui_config.languageDirection)
          .toBe('ltr');
      });
    });

    it('should set context correctly', fakeAsync(() => {
      spyOn(translateTextService, 'init').and.callFake(
        (expId, languageCode, successCallback) => successCallback());
      component.ngOnInit();
      expect(contextService.getEntityType()).toBe(
        AppConstants.ENTITY_TYPE.EXPLORATION);
      expect(contextService.getEntityId()).toBe('1');
      expect(contextService.imageSaveDestination).toBe(
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
    }));

    it('should initialize translateTextService', fakeAsync(() => {
      spyOn(translateTextService, 'init').and.callThrough();
      spyOn(translateTextService, 'getTextToTranslate').and.callThrough();
      spyOn(translateTextService, 'getPreviousTextToTranslate')
        .and.callThrough();
      component.ngOnInit();
      expect(component.loadingData).toBeTrue();
      expect(translateTextService.init).toHaveBeenCalled();

      const sampleStateWiseContentMapping = {
        stateName1: {contentId1: 'text1'},
        stateName2: {contentId2: 'text2'}
      };

      const req = httpTestingController.expectOne(
        '/gettranslatabletexthandler?exp_id=1&language_code=es');
      expect(req.request.method).toEqual('GET');
      req.flush({
        state_names_to_content_id_mapping: sampleStateWiseContentMapping,
        version: 1
      });
      flushMicrotasks();
      expect(component.loadingData).toBeFalse();
      expect(translateTextService.getTextToTranslate).toHaveBeenCalled();

      expect(component.textToTranslate).toBe('text1');
      expect(component.moreAvailable).toBeTrue();
      component.skipActiveTranslation();
      component.returnToPreviousTranslation();
      expect(translateTextService.getPreviousTextToTranslate)
        .toHaveBeenCalled();
      expect(component.textToTranslate).toBe('text1');
      expect(component.moreAvailable).toBeFalse();
    }));

    it('should set the schema constant based on the active language', fakeAsync(
      () => {
        translationLanguageService.setActiveLanguageCode('ar');
        spyOn(translateTextService, 'init').and.callFake(
          (expId, languageCode, successCallback) => successCallback());
        component.ngOnInit();
        expect(component.getHtmlSchema().ui_config.language)
          .toBe('ar');
      }));

    describe('with a machine translatable translation language',
      () => {
        beforeEach(fakeAsync(() => {
          translationLanguageService.setActiveLanguageCode('es');
          component.ngOnInit();
          const sampleStateWiseContentMapping = {
            stateName1: {contentId1: 'Please continue'}
          };

          const req = httpTestingController.expectOne(
            '/gettranslatabletexthandler?exp_id=1&language_code=es');
          expect(req.request.method).toEqual('GET');
          req.flush({
            state_names_to_content_id_mapping: sampleStateWiseContentMapping,
            version: 1
          });
          flushMicrotasks();
        }));

        it('should offer translation', () => {
          expect(component.offerMachineTranslation).toBeTrue();
        });

        it('should not retrieve translation until dropdown chevron is clicked',
          fakeAsync(() => {
            expect(component.hideMachineTranslation).toBeTrue();
            component.toggleMachineTranslation();
            const sampleMachineTranslationResponse:
            MachineTranslatedTextBackendDict = {
              translated_texts: {contentId1: 'Por favor continua.'}
            };
            const req = httpTestingController.expectOne(
              '/machine_translated_state_texts_handler?exp_id=1&state_name=' +
            'stateName1&content_ids=%5B%22contentId1%22%5D&' +
            'target_language_code=es');
            expect(req.request.method).toEqual('GET');
            req.flush(sampleMachineTranslationResponse);
            flushMicrotasks();
            expect(component.hideMachineTranslation).toBeFalse();
            expect(component.machineTranslatedText).toBe('Por favor continua.');
          }));
      });
  });

  describe('when clicking on the translatable content', () => {
    let target: HTMLElement;
    let broadcastSpy: jasmine.Spy<(target: HTMLElement) => void>;
    let propagationSpy: jasmine.Spy<() => void>;
    beforeEach(fakeAsync(() => {
      spyOn(translateTextService, 'init').and.callFake(
        (expId, languageCode, successCallback) => successCallback());
      broadcastSpy = spyOn(
        ckEditorCopyContentService, 'broadcastCopy').and.stub();

      component.ngOnInit();
      target = document.createElement('div');
      target.onclick = function(this, ev) {
        propagationSpy = spyOn(ev, 'stopPropagation').and.stub();
        component.onContentClick(ev);
      };
    }));

    it('should broadcast the clicked element', () => {
      target.click();
      expect(broadcastSpy).toHaveBeenCalledWith(target);
    });

    describe('when copy mode is active', () => {
      beforeEach(() => {
        ckEditorCopyContentService.toggleCopyMode();
      });

      it('should prevent default behavior', () => {
        target.click();
        expect(propagationSpy).toHaveBeenCalled();
      });
    });

    describe('when copy mode is inactive', () => {
      it('should not prevent default behavior', () => {
        target.click();
        expect(propagationSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('when skipping the active translation', () => {
    describe('when there is available text', () => {
      beforeEach(fakeAsync(() => {
        component.ngOnInit();

        const sampleStateWiseContentMapping = {
          stateName1: {contentId1: 'text1'},
          stateName2: {contentId2: 'text2'}
        };

        const req = httpTestingController.expectOne(
          '/gettranslatabletexthandler?exp_id=1&language_code=es');
        expect(req.request.method).toEqual('GET');
        req.flush({
          state_names_to_content_id_mapping: sampleStateWiseContentMapping,
          version: 1
        });
        flushMicrotasks();
      }));


      it('should retrieve remaining text and availability', () => {
        component.skipActiveTranslation();
        expect(component.textToTranslate).toBe('text2');
        expect(component.moreAvailable).toBeFalse();
      });

      it('should hide the machine translation', () => {
        component.hideMachineTranslation = false;
        component.skipActiveTranslation();
        expect(component.hideMachineTranslation).toBeTrue();
      });
    });
  });

  describe('when suggesting translated text', () => {
    let expectedPayload, imagesData;
    beforeEach(fakeAsync(() => {
      expectedPayload = {
        suggestion_type: 'translate_content',
        target_type: 'exploration',
        description: 'Adds translation',
        target_id: '1',
        target_version_at_submission: 1,
        change: {
          cmd: 'add_translation',
          content_id: 'contentId1',
          state_name: 'stateName1',
          language_code: 'es',
          content_html: 'text1',
          translation_html: 'texto1'
        }
      };
      component.ngOnInit();

      const sampleStateWiseContentMapping = {
        stateName1: {contentId1: 'text1'},
        stateName2: {contentId2: 'text2'}
      };

      const req = httpTestingController.expectOne(
        '/gettranslatabletexthandler?exp_id=1&language_code=es');
      expect(req.request.method).toEqual('GET');
      req.flush({
        state_names_to_content_id_mapping: sampleStateWiseContentMapping,
        version: 1
      });
      flushMicrotasks();
      component.activeWrittenTranslation.html = 'texto1';
    }));

    it('should correctly submit a translation suggestion', fakeAsync(() => {
      component.suggestTranslatedText();

      const req = httpTestingController.expectOne(
        '/suggestionhandler/');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body.getAll('payload')[0]).toEqual(
        JSON.stringify(expectedPayload));
      req.flush({});
      flushMicrotasks();
    }));

    describe('when already uploading a translation', () => {
      it('should not submit the translation', fakeAsync(() => {
        spyOn(translateTextService, 'suggestTranslatedText').and.callThrough();

        component.suggestTranslatedText();
        component.suggestTranslatedText();

        const req = httpTestingController.expectOne(
          '/suggestionhandler/');
        expect(req.request.method).toEqual('POST');
        expect(req.request.body.getAll('payload')[0]).toEqual(
          JSON.stringify(expectedPayload));
        req.flush({});
        flushMicrotasks();
        // Prevention of concurrent suggestions also confirmed by "expectOne".
        expect(translateTextService.suggestTranslatedText)
          .toHaveBeenCalledTimes(1);
      }));
    });

    describe('when currently loading data', () => {
      it('should not submit the translation', () => {
        component.loadingData = true;
        spyOn(translateTextService, 'suggestTranslatedText').and.callThrough();

        component.suggestTranslatedText();

        expect(translateTextService.suggestTranslatedText)
          .toHaveBeenCalledTimes(0);
      });
    });

    describe('when suggesting the last available text', () => {
      beforeEach(() => {
        expectedPayload = {
          suggestion_type: 'translate_content',
          target_type: 'exploration',
          description: 'Adds translation',
          target_id: '1',
          target_version_at_submission: 1,
          change: {
            cmd: 'add_translation',
            content_id: 'contentId2',
            state_name: 'stateName2',
            language_code: 'es',
            content_html: 'text2',
            translation_html: 'texto2'
          }
        };
        component.skipActiveTranslation();
        component.activeWrittenTranslation.html = 'texto2';
      });

      it('should close the modal', fakeAsync(() => {
        spyOn(component, 'close');
        component.suggestTranslatedText();

        const req = httpTestingController.expectOne(
          '/suggestionhandler/');
        expect(req.request.method).toEqual('POST');
        expect(req.request.body.getAll('payload')[0]).toEqual(
          JSON.stringify(expectedPayload));
        req.flush({});
        flushMicrotasks();
        expect(component.close).toHaveBeenCalled();
      }));
    });

    it('should register a contributor dashboard submit suggestion event',
      () => {
        spyOn(
          siteAnalyticsService,
          'registerContributorDashboardSubmitSuggestionEvent'
        );
        spyOn(translateTextService, 'suggestTranslatedText').and.stub();
        component.suggestTranslatedText();
      });

    it('should flush stored image data',
      fakeAsync(() => {
        imagesData = [{
          filename: 'imageFilename1',
          imageBlob: 'imageBlob1'
        }, {
          filename: 'imageFilename1',
          imageBlob: 'imageBlob2'
        }, {
          filename: 'imageFilename2',
          imageBlob: 'imageBlob1'
        }, {
          filename: 'imageFilename2',
          imageBlob: 'imageBlob2'
        }];
        spyOn(imageLocalStorageService, 'getStoredImagesData').and.returnValue(
          imagesData
        );
        component.suggestTranslatedText();
        const req = httpTestingController.expectOne(
          '/suggestionhandler/');
        expect(req.request.method).toEqual('POST');
        const filename1Blobs = req.request.body.getAll('imageFilename1');
        const filename2Blobs = req.request.body.getAll('imageFilename2');
        expect(filename1Blobs).toContain('imageBlob1');
        expect(filename1Blobs).toContain('imageBlob2');
        expect(filename2Blobs).toContain('imageBlob1');
        expect(filename2Blobs).toContain('imageBlob2');
        req.flush({});
        flushMicrotasks();
      }));

    it('should reset the image save destination', () => {
      spyOn(translateTextService, 'suggestTranslatedText').and.stub();
      expect(contextService.imageSaveDestination).toBe(
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
      component.suggestTranslatedText();
      expect(contextService.imageSaveDestination).toBe(
        AppConstants.IMAGE_SAVE_DESTINATION_SERVER);
    });
  });
});
