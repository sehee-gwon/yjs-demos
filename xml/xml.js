import * as Y from 'yjs'
import {XmlElement} from 'yjs'
import {IndexeddbPersistence} from 'y-indexeddb'

const doc = new Y.Doc()

const dbName = 'save-xml';
const xmlFragmentName = 'my-xml-fragment';

const indexedDBProvider = new IndexeddbPersistence(dbName, doc)

// xml dom
const xmlFragment = doc.getXmlFragment(xmlFragmentName)
const content = document.getElementById('xml-test1').querySelector('#content')

// xml 테스트 1
// 편집기 내에 내용을 입력하고, 줄넘김 단위로 xml 생성
// 클라이언트 저장/불러오기
indexedDBProvider.on('synced', idbPersistence => {
    const oldXmlFragment = idbPersistence.doc.share.get(xmlFragmentName);

    // indexed DB 에 xmlFragment 가 있을 경우 바로 불러오기
    if (oldXmlFragment.length > 0) {
        oldXmlFragment.forEach(xmlElement => {
            const elementDoc = new DOMParser().parseFromString(xmlElement.toString(), 'text/xml');
            elementDoc.querySelectorAll('TEXT, text').forEach(xmlElement => {
                content.value += xmlElement.innerHTML + '\n'
            })
        })
        console.log('indexedDB get xmlFragment...')
    }
    // indexed DB 에 xmlFragment 가 없을 경우 서버에 저장된 내용 내려받기
    else {
        fetch('./sheet.xml')
            .then(response => response.text())
            .then((data) => {
                const xmlDoc = new DOMParser().parseFromString(data, 'text/xml')
                xmlDoc.querySelectorAll('TEXT, text').forEach(element => {
                    content.value += element.innerHTML + '\n'
                })
            })
        console.log('serverDB get xmlFragment...')
    }
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

    console.log('textarea input event... {}', xmlFragment.toDOM())
})

// -----------------------------------------------------------------------------

// xml 테스트 2
// xml 요소 관리하기
const xmlFragment2 = doc.getXmlFragment(xmlFragmentName + '2')
const section2 = document.getElementById('xml-test2')
const ID = 'id'

// xml 조회
section2.querySelector('.search button').addEventListener('click', e => {
    console.log(xmlFragment2.toDOM())
})

// xml 요소 추가
section2.querySelector('.add button').addEventListener('click', e => {
    const elementName = section2.querySelector('.add input[name=elementName]').value
    const idValue = section2.querySelector('.add input[name=idValue]').value

    if (elementName === '' || idValue === '' || getXmlElement(elementName, idValue) != null) {
        return
    }

    const xmlElement = new Y.XmlElement(elementName)
    xmlElement.setAttribute(ID, idValue)
    xmlFragment2.push([xmlElement])

    console.log(xmlFragment2.toDOM())
})

// xml 요소 삭제
section2.querySelector('.delete button').addEventListener('click', e => {
    const elementName = section2.querySelector('.delete input[name=elementName]').value
    const idValue = section2.querySelector('.delete input[name=idValue]').value

    if (elementName === '' || idValue === '' || getXmlElement(elementName, idValue) == null) {
        return
    }

    xmlFragment2.forEach((xmlElement, idx) => {
        if (xmlElement.nodeName === elementName && xmlElement.getAttribute(ID) === idValue) {
            xmlFragment2.delete(idx, 1)
        }
    })

    console.log(xmlFragment2.toDOM())
})

// xml dom 변경사항 관찰
xmlFragment2.observe(xmlEvent => {
    // xml fragment 추가시 발생
    xmlEvent.changes.added.forEach(item => {
        console.log('xml fragment added: ', item)

        // xml 요소 변경사항 관찰
        // fragment 추가시 하위 element 의 observe 를 달아줘야 함
        const xmlElement = item.content.type
        xmlElement.observe(xmlEvent => {
            xmlEvent.changes.keys.forEach((change, key) => {
                if (change.action === 'add') {
                    console.log(`xml element added: Attribute { key: "${key}", value: "${xmlElement.getAttribute(key) }" }`)
                } else if (change.action === 'update') {
                    console.log(`xml element updated: Attribute { key: "${key}", old-value: "${change.oldValue}", new-value: "${xmlElement.getAttribute(key) }" }`)
                } else if (change.action === 'delete') {
                    console.log(`xml element deleted: Attribute { key: "${key}", value: "${change.oldValue}" }`)
                }
            })
        })
    })

    // xml fragment 삭제시 발생
    xmlEvent.changes.deleted.forEach(item => {
        console.log('xml fragment deleted: ', item)
    })
})

// -----------------------------------------------------------------------------

// xml 테스트 3
// xml 요소 속성 관리하기
const section3 = document.getElementById('xml-test3')

// xml 요소 조회
section3.querySelector('.search button').addEventListener('click', e => {
    const elementName = section3.querySelector('.search input[name=elementName]').value
    const idValue = section3.querySelector('.search input[name=idValue]').value

    if (elementName === '' || idValue === '') {
        return
    }

    const xmlElement = getXmlElement(elementName, idValue);
    if (xmlElement != null) console.log(xmlElement.toDOM())
    else alert('xml element not exist')
})

// xml 요소 속성 추가/수정
section3.querySelector('.set button').addEventListener('click', e => {
    const elementName = section3.querySelector('.set input[name=elementName]').value
    const idValue = section3.querySelector('.set input[name=idValue]').value
    const attrName = section3.querySelector('.set input[name=attrName]').value
    const attrValue = section3.querySelector('.set input[name=attrValue]').value

    if (elementName === '' || idValue === '' || attrName === '' || attrValue === '') {
        return
    }

    const xmlElement = getXmlElement(elementName, idValue)
    if (xmlElement == null) {
        alert('xml element not exist')
        return
    }

    if (attrName === ID) {
        alert('the id attribute cannot be set')
        return
    }

    xmlElement.setAttribute(attrName, attrValue)
    console.log(xmlElement.toDOM())
})

// xml 요소 속성 삭제
section3.querySelector('.delete button').addEventListener('click', e => {
    const elementName = section3.querySelector('.delete input[name=elementName]').value
    const idValue = section3.querySelector('.delete input[name=idValue]').value
    const attrName = section3.querySelector('.delete input[name=attrName]').value

    if (elementName === '' || idValue === '' || attrName === '') {
        return
    }

    const xmlElement = getXmlElement(elementName, idValue)
    if (xmlElement == null) {
        alert('xml element not exist')
        return
    }

    if (attrName === ID) {
        alert('the id attribute cannot be delete')
        return
    }

    xmlElement.removeAttribute(attrName)
    console.log(xmlElement.toDOM())
})

// xml 요소 조회 function
function getXmlElement(elementName, id) {
    let oldXmlElement;
    xmlFragment2.forEach(xmlElement => {
        if (xmlElement.nodeName === elementName && xmlElement.getAttribute(ID) === id) {
            oldXmlElement = xmlElement
        }
    })
    return oldXmlElement
}

// -----------------------------------------------------------------------------

// xml 테스트 4
// 계층 구조 xml dom 불러와서 화면에 노출하기
const xmlFragment4 = doc.getXmlFragment(xmlFragmentName + '4')
const svgBlock = document.querySelector('#xml-test4 #svg-block')
fetch('./svg-sheet.xml')
    .then(response => response.text())
    .then((data) => {
        const xmlDoc = new DOMParser().parseFromString(data, 'text/xml')

        if (xmlFragment4.length > 1) {
            xmlFragment4.delete(0, xmlFragment4.length-1)
        }

        xmlDoc.querySelectorAll('SVG').forEach(element => {
            const xmlElement = new XmlElement('SVG');
            Array.from(element.attributes).forEach(attr => {
                xmlElement.setAttribute(attr.name, attr.value)
            })

            element.childNodes.forEach(childElement => {
                const xmlChildElement = new XmlElement(childElement.nodeName)
                Array.from(childElement.attributes).forEach(childAttr => {
                    xmlChildElement.setAttribute(childAttr.name, childAttr.value)
                })
                xmlElement.push([xmlChildElement])
            })

            xmlFragment4.push([xmlElement]);
        })

        console.log("계층 구조 xml 매핑 테스트")
        console.log(xmlFragment4.toDOM())

        xmlFragment4.forEach(xmlElement => {
            if (xmlElement.nodeName === 'SVG') {
                svgBlock.innerText += xmlElement.toString();
            }
        })
    })

// webSocket 사용 시 클라이언트 동시 편집 가능
// use provider