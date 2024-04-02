// 주어진 type, props, children을 받아와 가상 DOM요소를 생성하는 함수
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

// 주어진 텍스트를 포함하는 텍스트 요소를 생성하는 함수
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

// 주어진 Fiber객체를 이용하여 실제 DOM요소를 생성하고 반환
function createDom(fiber) {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
// 주어진 두 객체 "prev", "next"에서 특정 키가 사라졌는지 판단
const isGone = (prev, next) => (key) => !(key in next);

// 주어진 DOM요소의 속성 및 이벤트를 새로운 속성 및 이벤트로 업데이트하는 함수
function updateDom(dom, prevProps, nextProps) {
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

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

//궁금
// 변경된 작업을 실제 DOM에 반영하는 함수
function commitRoot() {
  // 삭제된 요소들에 대한 작업을 커밋
  deletions.forEach(commitWork);
  // 루트 Fiber의 첫번째 자식 요소에 대한 작업을 커밋
  commitWork(wipRoot.child);
  //현재 루트를 업데이트하고 작업 중인 루트를 초기화
  currentRoot = wipRoot;
  wipRoot = null;
}

// 특정 Fiber에 대한 작업을 실제 DOM에 반영하는 함수
function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

// 삭제된 Fiber에 대한 작업을 실제 DOM에서 제거
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

// 주어진 요소를 주어진 컨테이너에 렌더링하는 함수
function render(element, container) {
  // 작업 중인 루트 Fiber 초기화
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // 이전 루트
    alternate: currentRoot,
  };
  // 삭제된 Fiber들을 추적하는데 사용
  deletions = [];
  // 수행해야 할 작업 단위
  nextUnitOfWork = wipRoot;
}

let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = null;

// 작업 루프를 실행하는 함수. 브라우저가 유휴 상태일 때마다 실행
function workLoop(deadline) {
  // 작업을 중단해야하는지 여부
  let shouldYield = false;
  // 현재 작업이 존재하고, 유후 시간이 남아있는 동안 수행
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  // 다음 작업이 없고, 작업 중인 루트가 존재한다면 commitRoot를 호출, 변경사항 커밋
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  // 브라우저가 휴우 상태일때 workLoop가 호출. 브라우저가 다른 중요한 작업을 처리한 후, 남는 시간에 작업 루프를 실행하여 렌더링을 진행하는 방식
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

// 주어진 Fiber에 대한 작업을 수행하고 다음 작업 단위를 반환하는 함수
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // 현재 Fiber에 자식 요소가 없다면, 현재 Fiber의 부모를 따라 올라가며 형제 요소를 찾음. 형제 요소가 없을 때까지 올라가며 다음 작업 단위를 결정합니다.
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

let wipFiber = null;
let hookIndex = null;

// 함수 컴포넌트에 대한 작업을 수행
function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  //궁금
  // 여기서 fiber.type은 App 함수이고, 이를 실행하면 h1 엘리먼트를 반환
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function useState(initial) {
  // 이전 렌더링 시의 훅 상태를 oldHook에 저장
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action) => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

// 궁금
// 호스트 컴포넌트(예: div, span 등)에 대한 작업을 수행
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}

// Fiber(wipFiber)와 요소들(elements) 간의 일관성을 유지하도록 조정하는 함수
// 이전 Fiber트리의 자식 Fiber(oldFiber)와 새로운 요소(element) 배열을 비교하여 새로운 Fiber(newFiber)를 생성하거나 기존 Fiber를 업데이트/삭제하는 로직
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  // 이전 Fiber트리의 첫번째 자식
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  // 이전 형제
  let prevSibling = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;

    const sameType = oldFiber && element && element.type == oldFiber.type;

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }

    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

// createElement 함수와 render 함수를 포함하는 객체입니다. 이를 통해 가상 DOM을 생성하고 렌더링할 수 있음
const Didact = {
  createElement,
  render,
  useState,
};

// JSX를 사용하기 위해 Babel과 같은 도구에서 사용되는 주석.
// JSX 문법이 사용될 때 Didact.createElement 함수를 호출하도록 지정
/** @jsx Didact.createElement */
function Counter() {
  const [state, setState] = Didact.useState(1);

  return <h1 onClick={() => setState((c) => c + 1)}>Count:{state}</h1>;
}

const element = <Counter />;
const container = document.getElementById("root");
Didact.render(element, container);
