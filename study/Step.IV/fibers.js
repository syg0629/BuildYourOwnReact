//Step IV: Fibers
//작업 단위들을 구조화하기 위해서 fiber tree 자료 구조가 필요
//엘리먼트마다 하나의 fiber를 가지며, 각각의 fiber는 하나의 작업 단위가 됨.
//...

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

function render(element, container) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };
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
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  if (fiber.parent) {
    fiber.parent.dom.appenChild(fiber.dom);
  }

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
