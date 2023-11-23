// const element = (
//   <div id="foo">
//     <a>bar</a>
//     <b />
//   </div>
// );

function createElement(type, props, ...chiledren) {
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

let nextUnitOfWork = null;

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  //반복문을 만들기위해 사용. setTimeout같은 것
  //언제 실행해야할 지를 알려주는 대신, 메인 스레드가 대기 상태일 때 브라우저가 콜백을 실행
  //리액트는 requestIdleCallback을 더이상 사용하지 않고 scheduler package를 사용. 개념적으로 동일함.
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

//다음 작업 단위를 반환
function performUnitOfWork(nextUnitOfWork) {
  //TODO
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
