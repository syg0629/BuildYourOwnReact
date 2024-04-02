// const element = (
//   <div id="foo">
//     <a>bar</a>
//     <b />
//   </div>
// );

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

//엘리먼트 타입을 이용하여 DOM 노드를 생성, 만약 타입이 TEXT_ELEMENT인 경우, 텍스트 노드를 생성
//그 다음 새롭게 만들어진 노드를 컨테이너에 추가
//이 과정을 각각의 자식들 모두에게 재귀적으로 수행
function render(element, container) {
  //const dom = document.createElement(element.type);
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  //노드에 엘리먼트 속성을 부여
  //다시 Check
  const isProperty = (key) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });

  element.props.children.forEach((child) => render(child, dom));
  container.appenChild(dom);
}

const Didact = {
  createElement,
  render,
};

/**@jsx Didact.createElement */
const element = Didact.createElement(
  "div",
  { id: "foo" },
  Didact.createElement("a", null, "bar"),
  Didact.createElement("b")
);

const container = document.getElementById("root");
//ReactDOM.render(element, container);
Didact.render(element, container);
