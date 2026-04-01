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

import type WebSocket from 'ws';

import type { SessionController } from './sessionController';

type ChannelMethod = 'navigate' | 'mousemove' | 'mousedown' | 'mouseup' | 'wheel' | 'keydown' | 'keyup';

type RPCMessage = {
  id?: number;
  method: ChannelMethod;
  params?: any;
};

export class WsChannel {
  constructor(private readonly _session: SessionController) {
  }

  bind(socket: WebSocket): void {
    socket.on('message', async raw => {
      let message: RPCMessage;
      try {
        message = JSON.parse(String(raw));
      } catch {
        return;
      }

      try {
        const result = await this.dispatch(message.method, message.params ?? {});
        if (typeof message.id === 'number')
          socket.send(JSON.stringify({ id: message.id, result }));
      } catch (error) {
        if (typeof message.id === 'number') {
          socket.send(JSON.stringify({
            id: message.id,
            error: error instanceof Error ? error.message : String(error),
          }));
        }
      }
    });
  }

  async dispatch(method: ChannelMethod, params: any): Promise<void> {
    switch (method) {
      case 'navigate':
        return this._session.navigate(params);
      case 'mousemove':
        return this._session.mousemove(params);
      case 'mousedown':
        return this._session.mousedown(params);
      case 'mouseup':
        return this._session.mouseup(params);
      case 'wheel':
        return this._session.wheel(params);
      case 'keydown':
        return this._session.keydown(params);
      case 'keyup':
        return this._session.keyup(params);
    }
  }
}
