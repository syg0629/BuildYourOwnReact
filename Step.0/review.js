// const element = <h1 title="foo">Hello</h1>;

const element = {
  type: "hi",
  props: {
    title: "foo",
    children: "Hello",
  },
};

const container = document.getElementById("root");

//ReactDom.render(element, container);
const node = document.createElement(element.type);
node["title"] = element.props.title;

const text = document.createTextNode("");
text["nodeValue"] = element.props.children;

node.appendChild(text);
container.appendChild(node);
