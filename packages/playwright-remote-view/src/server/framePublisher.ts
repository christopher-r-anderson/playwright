/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { EventEmitter } from 'events';

import type { Page } from 'playwright-core';

export type FrameEvent = {
  data: string;
  viewportWidth: number;
  viewportHeight: number;
};

export class FramePublisher extends EventEmitter {
  private _lastFrameData: string | null = null;
  private _lastViewportSize: { width: number, height: number } | null = null;

  async start(page: Page, size: { width: number, height: number } = { width: 1280, height: 800 }): Promise<void> {
    await page.screencast.start({
      onFrame: ({ data }: { data: Buffer }) => this._writeFrame(data, page.viewportSize()?.width ?? 0, page.viewportSize()?.height ?? 0),
      size,
    });
  }

  async stop(page: Page): Promise<void> {
    await page.screencast.stop().catch(() => {});
  }

  emitCachedFrame(): void {
    if (!this._lastFrameData || !this._lastViewportSize)
      return;
    this.emit('frame', {
      data: this._lastFrameData,
      viewportWidth: this._lastViewportSize.width,
      viewportHeight: this._lastViewportSize.height,
    } satisfies FrameEvent);
  }

  private _writeFrame(data: Buffer, viewportWidth: number, viewportHeight: number): void {
    const base64 = data.toString('base64');
    this._lastFrameData = base64;
    this._lastViewportSize = { width: viewportWidth, height: viewportHeight };
    this.emit('frame', { data: base64, viewportWidth, viewportHeight } satisfies FrameEvent);
  }
}
