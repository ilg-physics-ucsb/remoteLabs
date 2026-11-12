(function () {
    function emit(name, detail) {
        window.dispatchEvent(new CustomEvent(name, { detail }));
    }

    function emitCameraSwitch(command) {
        const [name, switchId, state, pipelineMs, onlineMs] = command.split("/");
        const eventNames = {
            cameraSwitchStarted: "remla:camera-switch-started",
            cameraSwitchReady: "remla:camera-switch-ready",
            cameraSwitchFailed: "remla:camera-switch-failed",
        };
        if (!eventNames[name]) {
            return;
        }
        emit(eventNames[name], {
            switchId,
            state,
            pipelineMs: Number(pipelineMs),
            onlineMs: Number(onlineMs),
            readyMs: Number(onlineMs),
            receivedAt: performance.now(),
        });
    }

    if (!window.RemlaJsonSocket) {
        emit("remla:connection-error", { error: new Error("remlaJsonSocket.js did not load") });
        return;
    }

    function retainState(state, change) {
        window.remlaJsonLatestState = {
            ...state,
            ...change,
            devices: { ...(state?.devices || {}), ...(change.devices || {}) },
        };
        return window.remlaJsonLatestState;
    }

    const endpoint = new URL("ws", new URL(".", window.location.href));
    endpoint.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const client = new window.RemlaJsonSocket({
        url: endpoint.href,
        handlers: {
            onOpen: () => {
                window.remlaJsonConnected = true;
                emit("remla:connection-open", {});
            },
            onClose: (event) => {
                window.remlaJsonConnected = false;
                window.remlaJsonLatestQueue = null;
                window.remlaJsonLatestControl = null;
                window.remlaJsonPendingHandoff = null;
                window.remlaJsonPendingAlerts = [];
                client.pending.forEach((request) => {
                    request.reject(new Error("ReMLA WebSocket disconnected"));
                });
                client.pending.clear();
                emit("remla:connection-closed", { event });
            },
            onError: (error) => emit("remla:connection-error", { error }),
            onSnapshot: (state) => emit("remla:state-snapshot", retainState({}, state)),
            onStateChange: (change) => emit("remla:state-changed", retainState(window.remlaJsonLatestState, change)),
            onQueue: (queue) => {
                window.remlaJsonLatestQueue = queue;
                emit("remla:ownership-queue", queue);
            },
            onFault: (fault) => emit("remla:fault", fault),
            onResyncRequired: (currentRevision, receivedRevision) => {
                emit("remla:resync-required", { currentRevision, receivedRevision });
                window.location.reload();
            },
            onEvent: (name, data, meta) => {
                if (name === "alert" && typeof data?.message === "string") {
                    if (!window.remlaJsonAlertReady) {
                        const pending = window.remlaJsonPendingAlerts ||= [];
                        pending.push(data);
                        if (pending.length > 10) pending.shift();
                    }
                    emit("remla:alert", data);
                }
                if (name === "command" && data && typeof data.command === "string") {
                    emitCameraSwitch(data.command);
                }
                if (name === "ownership.control") {
                    window.remlaJsonLatestControl = data;
                    emit("remla:ownership-control", data);
                }
                if (name === "ownership.handoff") {
                    window.remlaJsonPendingHandoff = data;
                    emit("remla:ownership-handoff", data);
                }
                emit("remla:event", { name, data, meta });
            },
        },
    });

    window.remlaJson = client;
    window.remlaJsonConnected = false;
    window.remlaCommand = function (deviceName, commandName, commandArguments = []) {
        const commandParameters = Array.isArray(commandArguments) ? { arguments: commandArguments } : commandArguments;
        return client.command(deviceName, commandName, commandParameters).then(
            (result) => {
                emit("remla:command-result", { deviceName, commandName, commandParameters, result });
                return result;
            },
            (error) => {
                emit("remla:command-error", { deviceName, commandName, commandParameters, error });
                throw error;
            },
        );
    };
    client.connect();
})();
