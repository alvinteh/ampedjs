define(function(require) {
    "use strict";

    var Element = require("./models/element");
    var View = require("./models/view");
    var FunctionHelper = require("./helpers/function-helper");

    var _singleton = null;

    var ViewModule = function(App, appData) {
        //Initialize events
        /*
            Array of event listeners. Adheres to the following format:

            [
                {
                    element,
                    event,
                    listener
                }
            ]
        */
        appData.eventListeners = [];

        var handleEventListeners = function(event) {
            var eventListener;

            for (var i = 0, length = appData.eventListeners.length; i < length; i++) {
                eventListener = appData.eventListeners[i];


                if (eventListener.element === event.target) {
                    if (eventListener.event === event.type) {
                        eventListener.listener.apply(undefined, [event]);
                    }
                }
                else if (eventListener.event === "mutation" && event instanceof window.MutationRecord) {
                    if (eventListener.element === event.target ||
                        (event.type === "characterData" && eventListener.element === event.target.parentElement)) {
                        eventListener.listener.apply(undefined, [event]);
                    }
                }
            }
        };

        var events = ["blur", "change", "click", "focus", "input", "keypress", "keyup", "mousedown", "mouseup",
        "mouseenter", "mouseleave", "mouseover", "mouseout", "pause", "play", "ratechange", "seeked", "volumechange"];

        for (var i  = 0, iLength = events.length; i < iLength; i++) {
            document.addEventListener(events[i], handleEventListeners);
        }

        //Monitor DOM for changes
        var mutationObserver = new window[(window.MutationObserver ? "" : "WebKit") + "MutationObserver"](
            function(mutations) {
            mutations.forEach(function(mutation) {
                handleEventListeners(mutation);
            });
        });

        mutationObserver.observe(window.document.querySelector("body"), {
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true
        });

        Element.prototype.addDataBinding = FunctionHelper.override(Element.prototype.addDataBinding,
            function(originalFunction, context, args) {

            originalFunction.apply(context, args);

            var instance = args[0];
            var objectProperty = args[1];
            var elementProperties = (function(elementProperties) {
                if (typeof elementProperties === "undefined") {
                    return (typeof context.getElements()[0].value === "undefined" ? ["innerHTML"] : ["value"]);
                }
                else {
                    return elementProperties instanceof Array ? elementProperties : [elementProperties];
                }
            })(args[2]);
            var direction = args[3] ? args[3] : Element.TWO_WAY_BINDING;

            if (direction === Element.ONE_WAY_BINDING) {
                return;
            }

            var events = ["change", "input"];

            var elements = context.getElements();
            var element;
            var backwardTransform = args[5], value;

            for (var i = 0, iLength = elements.length; i < iLength; i++) {
                element = elements[i];

                //jshint -W083
                if (elementProperties.indexOf("value") !== -1) {
                    for (var j = 0, jLength = events.length; j < jLength; j++) {
                        appData.eventListeners.push({
                            element: element,
                            event: events[j],
                            listener: function() {
                                value = element.value;

                                if (backwardTransform) {
                                    value = backwardTransform(value);
                                }

                                instance.set(objectProperty, value);
                                ViewModule.refresh(instance);
                            }
                        });
                    }
                }
                else {
                    appData.eventListeners.push({
                        element: element,
                        event: "mutation",
                        listener: function(mutation) {
                            if (mutation.type === "attributes") {
                                if (elementProperties.indexOf(mutation.attributeName) !== -1) {
                                    value = element[mutation.attributeName];

                                    if (backwardTransform) {
                                        value = backwardTransform(value);
                                    }

                                    instance.set(objectProperty, value);
                                    ViewModule.refresh(instance);
                                }
                            }
                            else if (mutation.type === "characterData") {
                                if (elementProperties.indexOf("innerHTML") !== -1) {
                                    value = element.innerHTML;

                                    if (backwardTransform) {
                                        value = backwardTransform(value);
                                    }

                                    instance.set(objectProperty, value);
                                    ViewModule.refresh(instance);
                                }
                            }
                        }
                    });
                }
                //jshint +W083
            }
        });

        Element.prototype.removeDataBinding = FunctionHelper.override(Element.prototype.removeDataBinding,
            function(originalFunction, context, args) {

            originalFunction.apply(context, args);

            var options = args[2];
            var elementProperties = options ? options.elementProperties : undefined;
            var direction = options ? options.direction : undefined;

            if (direction === Element.ONE_WAY_BINDING) {
                return;
            }

            var events = ["change", "input"];

            var elements = context.getElements();
            var element, eventListener;

            for (var i = 0, iLength = elements.length; i < iLength; i++) {
                element = elements[i];

                //jshint -W083
                if ((typeof elementProperties === "undefined" && typeof context.getElements()[0].value !==
                    "undefined") || (typeof elementProperties !== "undefined" && elementProperties.indexOf("value") !==
                    -1)) {
                    for (var j = 0, jLength = events.length; j < jLength; j++) {
                        for (var k = 0, kLength = appData.eventListeners.length; k < kLength; k++) {
                            eventListener = appData.eventListeners[k];

                            if (eventListener.element === element && eventListener.event === event) {
                                appData.eventListeners.splice(k, 1);
                                k--;
                                kLength--;
                            }
                        }
                    }
                }
                else {
                    for (var l = 0, lLength = appData.eventListeners.length; l < lLength; l++) {
                        eventListener = appData.eventListeners[l];

                        if (eventListener.element === element && eventListener.event === event) {
                            appData.eventListeners.splice(l, 1);
                            l--;
                            lLength--;
                        }
                    }
                }
                //jshint +W083
            }
        });

        //Public instance members
        var ViewModule = {
            /*
                @function add

                Adds the specified view to the internal records.

                @param {object} view        The desired view
            */
            add: function(view) {
                //Ignore views which already exist in the internal records
                if (appData.views.indexOf(view) !== -1) {
                    return;
                }

                appData.views.push(view);
            },

            /*
                @function create

                Creates a View instance and adds it to the internal records.

                @param [htmlElement[]|htmlElement|string] elements      The desired HTML element(s)
            */
            create: function(elements) {
                var view = new View(elements);

                appData.views.push(view);

                return view;
            },

            /*
                @function refresh

                Refreshes all views which are data bound to the specified model instance. Generally speaking, this is
                automatically called by AppCore.

                @param [{object}] instance      The desired model instance.
            */
            refresh: function(instance) {
                for (var i = 0, length = appData.views.length; i < length; i++) {
                    appData.views[i].refresh(instance);
                }
            },

            Element: (function() {
                return {
                    /*
                        @function create

                        Creates an Element instance and optionally adds it to the specified View.

                        @param [{HTMLElement[]|HTMLElement|string}] elements        The desired HTML element(s)
                        @param [View] view                                          The desired View
                    */
                    create: function(elements, view) {
                        var element = new Element(elements);

                        if (view instanceof View) {
                            view.addElement(element);
                        }

                        return element;
                    },

                    REVERSE_BINDING: Element.REVERSE_BINDING,
                    ONE_WAY_BINDING: Element.ONE_WAY_BINDING,
                    TWO_WAY_BINDING: Element.TWO_WAY_BINDING
                };
            })()
        };

        return ViewModule;
    };

    return (function() {
        if (_singleton === null || typeof _singleton === "undefined") {
            _singleton = ViewModule;
        }

        return _singleton;
    })();
});
