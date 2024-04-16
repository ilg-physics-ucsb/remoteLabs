// Self-invoking function to encapsulate the WebSocket setup
(function() {
    function getWebSocketUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const hostname = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        const wsPath = '/ws';
        return `${protocol}${hostname}${port}${wsPath}`;
    }

    function getDomainURL() {
        const protocol = window.location.protocol === 'https:' ? 'https://' : 'http://';
        const hostname = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        return `${protocol}${hostname}${port}`;
    }

    // Establish the WebSocket connection
    const wsurl = getWebSocketUrl();
    const dataChannel = new WebSocket(wsurl);
    const url = getDomainURL();

    // Make `dataChannel` accessible globally
    window.dataChannel = dataChannel;

    // Default handlers for WebSocket events
    dataChannel.onopen = function() {
        console.log('WebSocket connection established.');
    };
    dataChannel.onmessage = function(event) {
        console.log('Message from server:', event.data);
    };
    dataChannel.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
    dataChannel.onclose = function(event) {
        console.log('WebSocket connection closed:', event.reason);
    };

    // Function to allow users to set custom event handlers
    window.setWebSocketHandlers = function(handlers) {
        if (handlers.onOpen) dataChannel.onopen = handlers.onOpen;
        if (handlers.onMessage) dataChannel.onmessage = handlers.onMessage;
        if (handlers.onError) dataChannel.onerror = handlers.onError;
        if (handlers.onClose) dataChannel.onclose = handlers.onClose;
    };
})();

window.onload = function () {
    let iframeUrl = getDomainURL() + "/cam";
    document.getElementById('videoFrame').src = iframeUrl;
}