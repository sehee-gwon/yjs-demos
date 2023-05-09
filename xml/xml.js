import * as Y from 'yjs'
import {WebsocketProvider} from 'y-websocket'

window.addEventListener('load', () => {
  const ydoc = new Y.Doc()
  const provider = new WebsocketProvider('wss://demos.yjs.dev', 'xml-demo', ydoc)

  fetch('./sheet.xml')
      .then(response => response.text())
      .then((data) => {
          // Method 1: Define a top-level type
          const yxmlFragment = ydoc.getXmlFragment('my xml fragment')
          // Method 2: Define Y.XmlFragment that can be included into the Yjs document
          const yxmlElement = ydoc.get('prop-name', Y.XmlElement)
          const yxmlNested = new Y.XmlElement('node-name')

          const yxmlText = new Y.XmlText()
          yxmlText.insert(0, 'abc')

          yxmlFragment.insert(0, [yxmlText])
          yxmlFragment.insertAfter(yxmlText, [new Y.XmlElement('TEXT1')])
          yxmlFragment.insertAfter(yxmlText, [new Y.XmlElement('TEXT2')])

          console.log(yxmlFragment.toDOM())
      })
})