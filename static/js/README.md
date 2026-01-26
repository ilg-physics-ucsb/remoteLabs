# Reusable
Files in `/components` are web components that represent real world tools or controls that can be used by many labs. Changes to a component's file affect all cases where it used.

## Architecture
Each lab has an `app.js` file. This file is unique to each lab, but generally is responsible for relaying tool (component) actions to the server, and for processing messages from the server. These applications may make use of resources in `/services` rather than repeat scripts for common functionality like processing websocket messages.

Components do not generally speak directly to the server.

server <-> app <-> component

### Component Styling
Internal components html is styled at the component level. One seeming exception to this is that some components may render other slotted html `<slot>` content, which is provided and therefore styled by the app. If the html is part of the component itself, the component is responsible for styling. The if the html is provided by the app, the global components stylesheet or application stylesheet are responsible for styling.