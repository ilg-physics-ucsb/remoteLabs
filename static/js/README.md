# Reusable
Files in `/components` are web components that represent real world tools or controls that can be used by many labs. Changes to a component's javascript file apply to all labs where it is used.

## Architecture
Components communicate with each other and with lab apps via [custom javascript events](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent). An example of this is how the `Toolbar` and `ToolDetail` components communicate with one another to display selected tools for students to interact with.

Each lab has its own app (`app.js`) which is unique to each lab, and is responsible for relaying component (lab tool, e.g. potentiometer) actions to the server, and for processing messages from the server. As a rule of thumb, components do not communicate directly with the server.

These applications may make use of resources in `/services` rather than duplicate scripts for common functionality like handling websocket messages.

server <-> app (`app.js`) <-> component <-> component

### Component Styling
Internal components html is styled at the component level. One seeming exception to this is that some components may render other slotted html `<slot>` content, which is provided by and therefore also styled by the app. If the html is part of the component itself, the component is responsible for styling. The if the html is provided by the app, the global components stylesheet or application stylesheet are responsible for styling.