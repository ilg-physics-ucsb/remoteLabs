# Reusable
Files in `/components` are [web components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) that represent real world tools or controls that can be used by many labs. Changes to a component's javascript file apply to all labs where it is used.

## Architecture
Components communicate with each other and with lab apps via [custom javascript events](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent). An example of this is how the `Toolbar` and `ToolDetail` components communicate with one another to display selected tools for students to interact with.

Each lab has its own app (`app.js`) which is unique to each lab, and is responsible for relaying component (lab tool, e.g. potentiometer) actions to the server, and for processing messages from the server. As a rule of thumb, components do not communicate directly with the server.

These applications may make use of resources in `/services` rather than duplicate scripts for common functionality like handling websocket messages.

server <-> app (`app.js`) <-> component <-> component

### Component Styling
Internal web component html is styled at the component level. One seeming exception to this is that some components may render other slotted html `<slot>` content, which is provided by and therefore also styled by the app. Here is a model to help determine where styling should be provided:
* If the html is part of the component (shadow document) itself, the **component** is responsible for styling
* The if the html is provided by the app (this includes general lab layout for all labs, or via component <slot>) and should be applied to all labs, the **[global app stylesheet](/static/css/app.css)** is responsible for styling
* If there is a need for styling outside of these cases, it can be provided by a one-off stylesheet unique to a single lab. Ideally styling is handled at the component or shared global app stylesheet levels

## Examples

### Web Component
To create a new web component:
1. create a new class being sure to register the component (see the working web component example [Demo component](../../static/js/components/demo.js))
1. Make sure the new component class is imported by the [library js file](/static/js/lib.js), and ensure the lab html includes that library file
1. Use the registered tag in the lab, like <demo-component></demo-component>

### Sample Lab HTML
```html
<!DOCTYPE html>
<html lang="en">
  <head>
  <!-- The shared global app stylesheet that is used by all labs -->
  <link href="../static/css/app.css" rel="stylesheet" type="text/css">
  </head>

  <body>
    <!-- The application javascript unique to the lab -->
    <script src="static/js/app.js" type="module"></script>

    <!-- Import the web component library so they can be used -->
    <script src="../static/js/lib.js" type="module"></script>

    <div>
      <!-- Use a web component from the web component library -->
      <demo-component data-input="3"></demo-component>
    </div>
  </body>
</html>
```