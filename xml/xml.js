import * as Y from 'yjs'
import {WebrtcProvider} from "y-webrtc";
import {IndexeddbPersistence} from 'y-indexeddb'

const doc = new Y.Doc()
const provider = new WebrtcProvider('my-xml-room', doc)
new IndexeddbPersistence('my-xml-db', doc)

// xml dom
let xmlFragment = doc.getXmlFragment('my-xml-fragment')

const content = document.getElementById("content")

// 서버에 저장된 내용 내려받기
fetch('./sheet.xml')
    .then(response => response.text())
    .then((data) => {
        // 지정된 경로의 xml 파일 text 로 읽기
        const xmlDoc = new DOMParser().parseFromString(data, 'text/xml')

        // TEXT 요소 선택, 내용을 불러와 줄넘김한다.
        let str = ''
        xmlDoc.querySelectorAll('TEXT').forEach(element => {
            str += element.innerHTML + '\n'
        })

        // textarea 에 xml 내용 추가
        content.innerHTML = str;

        console.log("서버로부터 xml 내려받기...")
    })

// action 발생 시 yjs xml 저장 (indexedDB 에 저장됨)
// 예시는 textarea 로 작성, 입력시 이벤트 발생
content.addEventListener("input", (e) => {
    const value = e.target.value;
    const txtArray = value.split('\n'); // 줄넘김 단위로 array 생성

    // 줄넘김이 삭제되면 xml dom 도 삭제
    if (txtArray.length < xmlFragment.length) {
        xmlFragment.delete(txtArray.length-1, xmlFragment.length - txtArray.length)
    }

    // 줄넘김 단위로 TEXT 요소를 생성한다.
    txtArray.forEach((txt, idx) => {
        // TEXT 요소 생성
        const xmlElement = new Y.XmlElement('TEXT')

        // tid 속성 추가
        xmlElement.setAttribute("tid", (idx+1).toString())
        xmlElement.push([new Y.XmlText(txt)]) // textarea 입력값을 내용에 추가

        // xml dom 에 존재할 경우 삭제, 아니면 추가
        if (xmlFragment.get(idx) != null) {
            xmlFragment.delete(idx, 1)
        }
        xmlFragment.insert(idx, [xmlElement])
    })

    console.log('서버에 xml 전송하기... {}', xmlFragment.toDOM())
})

// xml dom 변경사항 관찰
/*xmlFragment.observe(xmlEvent => {
    xmlEvent.changes.delta.forEach(e => {
        console.log(e)
    })
})*/

// webSocket 사용 시 클라이언트 동시 편집 가능
// use provider