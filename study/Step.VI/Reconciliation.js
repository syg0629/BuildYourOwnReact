//Step VI: 재조정 (Reconciliation)

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

//갱신을 위해 사용하는 특별한 종류의 속성이 있는데 바로 이벤트 리스너
//만약 속성의 이름이 "on"이라는 접두사로 시작한다면 이를 다르게 처리해줘야 함
const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);
//오래된 fiber의 props들을 새로운 fiber의 props와 비교하여 사라진 props는 제거하고, 새롭거나 변경된 props를 설정
function updateDom(dom, prevProps, nextProps) {
  //만약 이벤트 핸들러가 바뀐다면, 이를 노드에서 제거
  //Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  // 그 다음 새로운 핸들러를 추가
  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

function commitRoot() {
  //DOM에 변경사항을 커밋할 때 이 배열에 있는 fiber를 사용할 수 있음
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  //마지막으로 DOM에 커밋된 fiber트리를 저장
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;
  //만약 fiber가 "PLACEMENT"태그를 가진다면 이전에 했던 것과 동일하게 부모 fiber노드에 자식 DOM노드를 추가
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
    //DELETION태그는 반대로 자식을 부모 DOM에서 제거
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
    //갱신(UPDATE)의 경우, 이미 존재하는 DOM 노드를 변경된 props를 이용하여 갱신
  } else if (fiber.eeffectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate, fiber.props);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function render(element, container) {
  // nextUnitOfWork = {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    //alternate 속성은 이전 커밋 단계에서 DOM에 추가했던 오래된 fiber에 대한 링크
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

let nextUnitOfWork = null;
//커밋이 끝난 다음에는 "마지막으로 DOM에 저장된 fiber 트리"를 저장할 필요가 있음. 이를 currentRoot라고 합시다.
let currentRoot = null;
let wipRoot = null;
//제거하고 싶은 노드를 추적하기 위한 배열(deletions)이 필요
let deletions = null;

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // if (fiber.parent) {
  //   fiber.parent.dom.appenChild(fiber.dom);
  // }

  const elements = fiber.props.children;
  //새로운 fiber를 생성하는 코드를 performUnitOfWork에서 추출해서, 새로 reconcileChildren 함수를 만듬.
  reconcileChildren(fiber, elements);

  // let index = 0;
  // let prevSibling = null;

  // while (index < elements.length) {
  //   const element = elements[index];

  //   const newFiber = {
  //     type: element.type,
  //     props: element.props,
  //     parent: fiber,
  //     dom: null,
  //   };

  //   if (index === 0) {
  //     fiber.child = newFiber;
  //   } else {
  //     prevSibling.sibling = newFiber;
  //   }
  //   prevSibling = newFiber;
  //   index++;
  // }

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

//이제 이곳에서 오래된 fiber를 새로운 엘리먼트로 재조정(reconcile)함
function reconcileChildren(wipRoot, elements) {
  let index = 0;
  //오래된 fiber(wipFiber.alternate)의 자식들(children)과 재조정하기를 원하는 엘리먼트의 배열을 동시에 순회
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  //만약 배열과 링크드 리스트를 동시에 반복하는데 필요한 이 모든 보일러플레이트를 신경쓰지 않는다면, while문 안에는 oldFiber와 element라는 가장 중요한 부분만 남음.
  //element는 우리가 DOM 안에 렌더링하고 싶은 것이며, oldFiber는 가장 마지막으로 렌더링 했던 것
  //이를 DOM에 적용하기 위해서는 둘 사이에 어떤 차이가 생겼는지 비교해야 함
  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;

    //비교를 위해서 타입을 사용
    const sameType = oldFiber && element && element.type == oldFiber.type;

    //만약 오래된 fiber와 새로운 엘리먼트가 같은 타입이라면, DOM노드를 유지하고 새로운 props만 업데이트
    //여기서 리액트는 더 나은 재조정을 하기 위해 키(key)들을 사용
    //예를 들면, 키를 사용하여 엘리먼트 배열의 자식이 변하는 지점을 감지
    //오래된 fiber와 엘리먼트가 같은 타입을 가질 때, 오래된 fiber와 엘리먼트의 props에서 새로운 fiber를 생성하고 DOM노드를 유지
    // 또한 fiber에 effetTab라는 새로운 속성을 추가. 이 속성은 나중에 커밋 단계에서 사용하게 됨.
    if (sameType) {
      // TODO update the node
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        eeffectTag: "UPDATE",
      };
    }
    //만약 서로 타입이 다르고 새로운 엘리먼트가 존재한다면, 이는 새로운 DOM 노드 생성이 필요하다는 뜻
    //새로운 DOM 노드가 필요한 경우, 새로운 Fiber에 PLACEMENT라는 effect tag를 붙임
    if (element && !sameType) {
      // TODO add this node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        eeffectTag: "PLACEMENT",
      };
    }
    //그리고 만약 타입이 다르고 오래된 fiber가 존재한다면, 오래된 노드를 제거해야 함
    //노드를 삭제해야하는 경우에는 새로운 fiber가 필요하지 않으며, 오래된 fiber에 DELETION태그를 추가
    //하지만 fiber트리를 DOM에 커밋할 때, 작업 중인 루트(work in progress root)에는 오래된 fiber가 없음
    if (oldFiber && !sameType) {
      // TODO delete the oldFiber's node
      oldFiber.eeffectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
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
