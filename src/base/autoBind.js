import autoBind from "auto-bind-inheritance";

class BaseAutoBindedClass {
  constructor() {
    autoBind(this);
  }
}
export default BaseAutoBindedClass;
