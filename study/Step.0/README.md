# Step Zero: Review

React

```javascript
const element = <h1 title="foo">Hello</h1>;
const container = document.getElementById("root");
ReactDOM.render(element, container);
```

JSX로 정의된 Element

```javascript
const element = <h1 title="foo">Hello</h1>;
```

DOM으로부터 노드를 얻음

```javascript
const container = document.getElementById("root");
```

컨테이너 안에 리액트 엘리먼트를 생성

```javascript
ReactDom.render(element, containder);
```

JSX는 Babel과 같은 빌드 도구를 통해 JS로 변환
태그 이름, props, children을 매개변수로 넘기는 createElement 함수를 호출하여 태그 내부의 코드를 바꿈

React.createElement는 인자 값들로 객체를 생성<br/>
몇 가지 유효성 검사를 제외하고는 이게 전부

```javascript
const element = React.createElement("hi", { title: "foo" }, "Hello");
```

element가 type, props를 객체 속성 값으로 가지는 객체(실제로는 더 많은 속성이 있으나 여기서는 두가지만)

type은 우리가 생성하려는 DOM노드의 타입을 지정하는 문자열<br/>
tagName은 HTML엘리먼트를 생성할 때 document.createElement에 전달하는 값 => 이부분은 7단계에서 볼 예정

props는 JSX속성의 key와 value를 포함하고 있는 또하나의 객체<br/>
children이라는 특별한 속성을 가짐<br/>
아래 예제에서 children은 문자열. 하지만 일반적으로 더 많은 엘리먼트의 배열의 형태<br/>
이 엘리먼트들이 트리 형태인 이유

```javascript
const element = {
  type: "h1",
  props: {
    title: "foo",
    children: "Hello",
  },
};
```

교체해야할 리액트 코드의 다른 부분은 ReactDOM.render<br/>
render는 리액트가 DOM을 변경하는 지점.<br/>
이제 우리가 직접 업데이트할 수 있게 수정 예정<br/>

```javascript
const container = document.getElementById("root");
ReactDom.render(element, container);
```

먼저 엘리먼트의 type을 이용해 노드를 생성. 이 경우 타입은 h1<br/>
모든 엘리먼트 props들을 노드에 할당. 지금은 title 뿐<br/>

- 여기에서 엘리먼트는 리액트 엘리먼트, 노드는 DOM엘리먼트를 의미

```javascript
const element = {
  type: "h1",
  props: {
    title: "foo",
    children: "Hello",
  },
};

const container = document.getElementById("root");

const node = document.createElement(element.type);
node["title"] = element.props.title;
```

다음 자식노드 생성. 현재 자식노드는 문자열 하나이며, textNode 하나를 생성<br/>
innderText를 설정하는 대신 textNode를 사용하면 모든 엘리먼트들을 이후에 동일한 방식으로 다룰 수 있음<br/>
h1에 title을 할당한 것을 참고하여 nodeValue의 값을 설정<br/>
이는 문자열이 마치 props:{nodeValue: "hello"} 값을 가지는 것과 비슷

```javascript
const element = {
  type: "h1",
  props: {
    title: "foo",
    children: "Hello",
  },
};

const container = document.getElementById("root");
const node = document.createElement(element.type);
node["title"] = element.props.title;

const text = document.createTextNode("");
text["nodeValue"] = element.props.children;
```

마지막으로 textNode를 h1에 추가하고, 이 h1을 container에 추가

```javascript
const element = {
  type: h1,
  props: {
    title: "foo",
    children: "Hello",
  },
};

const container = document.getElementById("root");

const node = document.createElement(element.type);
node["title"] = element.props.title;

const text = document.createTextNode("");
text["nodeValue"] = element.props.children;

node.appendChild(text);
container.appendChild(node);
```

리액트를 사용하지 않고 동일한 앱 완성!!!✨
