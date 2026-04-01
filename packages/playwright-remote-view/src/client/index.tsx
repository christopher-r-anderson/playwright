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

import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

type FrameMessage = {
  method: 'frame';
  params: {
    data: string;
    viewportWidth: number;
    viewportHeight: number;
  };
};

function RemoteView() {
  const [frameData, setFrameData] = React.useState<string>('');
  const [viewport, setViewport] = React.useState({ width: 1280, height: 800 });
  const [url, setUrl] = React.useState('https://example.com');

  const ws = React.useMemo(() => new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws'), []);

  React.useEffect(() => {
    ws.onmessage = event => {
      const message = JSON.parse(event.data) as FrameMessage;
      if (message.method !== 'frame')
        return;
      setFrameData(message.params.data);
      setViewport({ width: message.params.viewportWidth, height: message.params.viewportHeight });
    };
    return () => ws.close();
  }, [ws]);

  const send = React.useCallback((method: string, params: any) => {
    ws.send(JSON.stringify({ method, params }));
  }, [ws]);

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <form onSubmit={event => {
      event.preventDefault();
      send('navigate', { url });
    }}>
      <input value={url} onChange={event => setUrl(event.currentTarget.value)} style={{ width: '100%' }} />
    </form>
    <div
      tabIndex={0}
      style={{ position: 'relative', width: viewport.width, height: viewport.height, outline: 'none' }}
      onMouseMove={event => send('mousemove', { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY })}
      onMouseDown={event => send('mousedown', { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY, button: event.button === 2 ? 'right' : 'left' })}
      onMouseUp={event => send('mouseup', { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY, button: event.button === 2 ? 'right' : 'left' })}
      onWheel={event => send('wheel', { deltaX: event.deltaX, deltaY: event.deltaY })}
      onKeyDown={event => send('keydown', { key: event.key })}
      onKeyUp={event => send('keyup', { key: event.key })}
    >
      <img src={frameData ? `data:image/jpeg;base64,${frameData}` : undefined} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{ position: 'absolute', inset: 0 }} />
    </div>
  </div>;
}

ReactDOM.createRoot(document.querySelector('#root')!).render(<RemoteView />);
