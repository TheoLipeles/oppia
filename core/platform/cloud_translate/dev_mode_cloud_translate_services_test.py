# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for dev_mode_cloud_translate_services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform.cloud_translate import dev_mode_cloud_translate_services
from core.tests import test_utils


class DevModeCloudTranslateServicesUnitTests(test_utils.TestBase):
    """Tests for dev_mode_cloud_translate_services."""

    def test_translate_text_with_invalid_source_language_raises_error(self):
        with self.assertRaisesRegexp(
            # Hindi (hi) is not a allowlisted language code.
            ValueError, 'Invalid language code: hi'):
            dev_mode_cloud_translate_services.translate_text(
                'hello world', 'hi', 'es')

    def test_translate_text_with_invalid_target_language_raises_error(self):
        with self.assertRaisesRegexp(
            # Hindi (hi) is not a allowlisted language code.
            ValueError, 'Invalid language code: hi'):
            dev_mode_cloud_translate_services.translate_text(
                'hello world', 'en', 'hi')

    def test_translate_text_same_source_target_language_doesnt_call_emulator(
            self):
        def mock_translate_call(
                text, source_language, target_language):
            self.assertEqual(text, 'hello world')
            self.assertEqual(source_language, 'en')
            self.assertEqual(target_language, 'en')
            self.fail(msg='mock api called')

        with self.swap(
            dev_mode_cloud_translate_services.CLIENT, 'translate',
            mock_translate_call):
            translated_text = dev_mode_cloud_translate_services.translate_text(
                'hello world', 'en', 'en')
            self.assertEqual(translated_text, 'hello world')

    def test_translate_text_with_valid_input_calls_emulator_translate(self):

        def mock_translate_call(
                text, source_language, target_language):
            self.assertEqual(text, 'hello world')
            self.assertEqual(source_language, 'en')
            self.assertEqual(target_language, 'es')
            return 'hola mundo'

        with self.swap(
            dev_mode_cloud_translate_services.CLIENT, 'translate',
            mock_translate_call):
            translated_text = dev_mode_cloud_translate_services.translate_text(
                'hello world', 'en', 'es')
            self.assertEqual(translated_text, 'hola mundo')
