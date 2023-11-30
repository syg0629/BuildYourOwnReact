//Step V: 렌더와 커밋 단계 (Render and Commit Phases)

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

function createDom(fiber) {
  //function render(element, container) {
  //const dom = document.createElement(element.type);
  // const dom =
  //   element.type == "TEXT_ELEMENT"
  //     ? document.createTextNode("")
  //     : document.createElement(element.type);
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  // const isProperty = (key) => key !== "children";
  // Object.keys(element.props)
  //   .filter(isProperty)
  //   .forEach((name) => {
  //     dom[name] = element.props[name];
  //   });
  const isProperty = (key) => key !== "children";
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });

  // element.props.children.forEach((child) => render(child, dom));
  // container.appenChild(dom);
  return dom;
}

//모든 작업이 끝나고 나면(더이상 다음 작업이 없는 경우), 전체 fiber트리를 DOM에 커밋
//여기서 모든 노드를 재귀적으로 DOM에 추가
function commitRoot() {
  commitWork(wipRoot.child);
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;
  domParent.appendChild(fiber.dom);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function render(element, container) {
  // nextUnitOfWork = {
  // fiber 트리의 루트를 추적, 작업 중인 work in progress 루트
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  };
  nextUnitOfWork = wipRoot;
}

let nextUnitOfWork = null;
let wipRoot = null;

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  //반복문을 만들기위해 사용. setTimeout같은 것
  //언제 실행해야할 지를 알려주는 대신, 메인 스레드가 대기 상태일 때 브라우저가 콜백을 실행
  //리액트는 requestIdleCallback을 더이상 사용하지 않고 scheduler package를 사용. 개념적으로 동일함.
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

//다음 작업 단위를 반환
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  //엘리먼트에서 작업을 수행할 때마다 각각의 DOM에 새로운 노드를 추가
  //브라우가 렌더링이 진행되고 있는 중간에 난입할 수 있고, 이 경우 유저는 미완성된 UI를 보게 되므로 DOM을 변형시키는 부분 제거
  // if (fiber.parent) {
  //   fiber.parent.dom.appenChild(fiber.dom);
  // }

  const elements = fiber.props.children;
  let index = 0;
  let prevSibling = null;

  while (index < elements.length) {
    const element = elements[index];

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
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
