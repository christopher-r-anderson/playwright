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

import type { Browser, BrowserContext, BrowserType, Page } from 'playwright-core';

export class SessionController {
  private _browser?: Browser;
  private _context?: BrowserContext;
  private _page?: Page;

  async initialize(browserType: BrowserType, options: { viewport?: { width: number, height: number }, contextOptions?: Parameters<Browser['newContext']>[0] } = {}): Promise<void> {
    this._browser = await browserType.launch();
    this._context = await this._browser.newContext({
      viewport: options.viewport ?? { width: 1280, height: 800 },
      ...options.contextOptions,
    });

    const pages = this._context.pages();
    if (pages.length > 0)
      await this._selectPage(pages[0]);
    else
      await this._selectPage(await this._context.newPage());
  }

  page(): Page {
    if (!this._page)
      throw new Error('SessionController has not been initialized');
    return this._page;
  }

  async navigate(params: { url: string }): Promise<void> {
    if (!params.url)
      return;
    await this.page().goto(params.url);
  }

  async mousemove(params: { x: number, y: number }): Promise<void> {
    await this.page().mouse.move(params.x, params.y);
  }

  async mousedown(params: { x: number, y: number, button?: 'left' | 'right' | 'middle' }): Promise<void> {
    await this.page().mouse.move(params.x, params.y);
    await this.page().mouse.down({ button: params.button || 'left' });
  }

  async mouseup(params: { x: number, y: number, button?: 'left' | 'right' | 'middle' }): Promise<void> {
    await this.page().mouse.move(params.x, params.y);
    await this.page().mouse.up({ button: params.button || 'left' });
  }

  async wheel(params: { deltaX: number, deltaY: number }): Promise<void> {
    await this.page().mouse.wheel(params.deltaX, params.deltaY);
  }

  async keydown(params: { key: string }): Promise<void> {
    await this.page().keyboard.down(params.key);
  }

  async keyup(params: { key: string }): Promise<void> {
    await this.page().keyboard.up(params.key);
  }

  private async _selectPage(page: Page): Promise<void> {
    if (this._page === page)
      return;

    if (this._page)
      await this._page.screencast.stop();

    this._page = page;
  }

  async dispose(): Promise<void> {
    if (this._page)
      await this._page.screencast.stop().catch(() => {});
    await this._context?.close();
    await this._browser?.close();
    this._page = undefined;
    this._context = undefined;
    this._browser = undefined;
  }
}
