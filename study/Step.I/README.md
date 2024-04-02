# Step I: createElement 함수

다시 다른 앱으로 시작<br/>
여기서는 리액트 코드를 우리가 직접 만든 버전으로 교체 예정

`createElement`를 입력하는 것부터 시작<br/>
JSX를 JS로 변환하면 `createElement`를 호출하는 것을 볼 수 있음

```javascript
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);

const container = document.getElementById("root");
ReactDom.render(element, container);
```

이전 단계에서 보았던 `type`과 `props`를 가진 객체 엘리먼트<br/>
우리가 만들 함수가 하는 일은 객체를 생성하는 것 뿐

```javascript
const element = React.createElement(
  "div",
  { id: "foo" },
  React.createElement("a", null, "bar"),
  React.createElement("b")
);
const container = document.getElementById("root");
ReactDOM.render(element, container);
```

우리는 `props`에 스프레드 연산자를 사용하고, `children`에 나머지 파라미터 구문을 적용하면, `children`이 항상 배열 형태가 됨.

예를 들어, `createElement("div")`는 다음을 반환

```javascript
{
  "type": "div",
  "props": {"children":[]}
}
```

`createElement("div", null, a)`의 결과는 다음과 같음

```javascript
{
  "type": "div",
  "props": {"children":[a]}
}
```

그리고 `createElement("div", null, a, b)`의 결과는 다음과 같음

```javascript
{
  "type": "div",
  "props": {
    "children" : [
      a, b
    ]
  }
}
```

```javascript
function createElement(type, prpos, ...children) {
  return {
    type,
    props: {
      ...props,
      children,
    },
  };
}
```

또한 `children`배열은 `string`이나 `number`와 같은 기본 타입의 값들을 포함할 수 있음. 따라서 우리는 객체가 아닌 모든 것들을 감싸서 자체 엘리먼트 안에 넣고, 이를 `TEXT_ELEMENT`라는 특별한 타입으로 생성할 수 있음.

실제 리액트에서는 `children`이 아닐 경우엔 기본 타입의 값들을 래핑하거나 빈 배열을 생성하지 않음. 하지만 코드를 간결하게 만들고, 우리의 라이브러리의 목적은 성능이 개선된 코드보다는 간단한 코드를 만드는데 있으므로 그냥 진행.

```javascript
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}
```

아직까지는 계속 리액트의 `createElement`를 사용하고 있는 상태

이제 이를 교체하기 위해, 우리의 라이브러리에 이름을 부여. 리액트 같이 들리지만 교육적인(didactic) 목적이 드러나는 이름이 필요.

이제 이를 "디액트(Didact)"라고 부르도록 함.

하지만 여기서도 JSX는 계속 사용하고 싶음. 어떻게 바벨에게 리액트 대신 우리가 만든 디액트의 `createElement`를 사용하도록 할 수 있을까?

```javascript
//이 상태를
const element = React.createElement(
  "div",
  { id: "foo" },
  React.createElement("a", null, "bar"),
  React.createElement("b")
);

//이렇게
const Didact = {
  createElement,
};

const element = Didact.createElement(
  "div",
  { id: "foo" },
  Didact.createElement("a", null, "bar"),
  Didact.createElement("b")
);

const container = document.getElement("root");
ReactDOM.render(element, container);
```

코멘트를 위와 같이 추가하면 바벨이 JSX를 트랜스파일할 때 우리가 정의한 함수를 사용할 수 있게 됨.

```javascript
const Didact = {
  createElement,
};

/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);

const container = document.getElementById("root");
ReactDOM.render(element, container);
```
