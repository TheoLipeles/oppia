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

"""An emulator that mocks the core.platform.cloud_translate API. This emulator
models the Cloud Translate API.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import python_utils
import utils


class TranslateEmulator(python_utils.OBJECT):
    """The emulator mocks the translate_text function from the Cloud Translate
    API. Expected responses must be passed in before using this emulator for
    testing.
    """

    def __init__(self):
        """Initializes the emulator with no expected responses."""
        self.expected_responses = {}

    def translate_text(self, text, source_language, target_language):
        """Responds with the saved expected response for a given input. If no
        response exists for the given input, responds with an empty string.

        Args:
            text: str. The text to be translated.
            source_language: str. A valid ISO 639-1 language code.
            target_language: str. A valid ISO 639-1 language code.

        Returns:
            str. The translated text.
        """
        if not utils.is_valid_language_code(source_language):
            raise ValueError('invalid language code: %s' % source_language)
        if not utils.is_valid_language_code(target_language):
            raise ValueError('invalid language code: %s' % target_language)

        response = ''
        key = (source_language, target_language, text)
        if key in self.expected_responses:
            response = self.expected_responses.get(key)
        return response

    def add_expected_response(self, inputs, response):
        """Adds an expected response for a given set of inputs.

        Args:
            inputs: tuple(str, str, str). A tuple of inputs (source language
                code, target language code, source text).
            response: str. The expected response for the given inputs.
        """
        self.expected_responses.update({inputs: response})