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

"""Controllers for the topic viewer page."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging

from core.controllers import acl_decorators
from core.controllers import base
from core.platform.cloud_translate import cloud_translate_services
import feconf
import utils


class CloudTranslateTestPage(base.BaseHandler):
    """Test page for cloud_translate_services."""
    @acl_decorators.open_access
    def get(self):
        """Handles GET requests."""
        origin_text = 'Hello World'
        translated_text = cloud_translate_services.translate_text(
            origin_text, 'en', 'es')
        self.render_json({
            'origin_text': origin_text,
            'translated_text': translated_text})
