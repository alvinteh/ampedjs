define(function(require) {
    "use strict";

    var Event = require("./models/event");
    var EventHelper = require("./helpers/event-helper");

    var _singleton = null;

    var RouteModule = function() {
        //Private instance members
        /*
            Array of routes. Adheres to the following format:

            [
                {
                    path,
                    controller,
                    action,
                    inferred
                }
            ]
        */
        var baseUrl;
        var routes = [];
        var currentPath = null;

        var processRoute = function(path) {
            currentPath = null;

            for (var i = 0, length = routes.length; i < length; i++) {
                var route = routes[i];
                if (route.path === path) {
                    var action = route.controller.getAction(route.action);

                    currentPath = route.path;

                    //Raise enter event on route's action's view if applicable
                    if (action.view !== null) {
                        EventHelper.trigger(new Event(action.view, "enter", { path: currentPath }));
                    }

                    //Execute the action function
                    action.function.apply(route.controller, []);

                    break;
                }
            }
        };

        var RouteModule = {
            /*
                @function isBound

                Checks if the specified path is bound to any routes

                @param {string} path        The desired path
            */
            isBound: function(path) {
                for (var i = 0, length = routes.length; i < length; i++) {
                    if (routes[i].path === path) {
                        return true;
                    }
                }

                return false;
            },

            /*
                @function getBaseUrl

                Retrieves the base URL
            */
            getBaseUrl: function() {
                return baseUrl;
            },

            /*
                @function setBaseUrl

                @param {string} url     The desired base URL

                Sets the base URL
            */
            setBaseUrl: function(url) {
                baseUrl = url;
            },

            /*
                @function bind

                Binds the specified route to the specified controller (and, if applicable, action).

                @param {string} path                The desired path
                @param {Controller} controller      The desired controller
                @param [{string}] action            The desired controller's action
            */
            bind: function(path, controller, action) {
                var newRoutes = [];
                var normalizedPath = path;

                //Normalize the route to ensure it begins with a "/" and ends without a "/")
                if (normalizedPath.charAt(0) !== "/") {
                    normalizedPath = "/" + normalizedPath;
                }
                if (normalizedPath.lastIndexOf("/") === normalizedPath.length - 1) {
                    normalizedPath = normalizedPath.substring(0, normalizedPath.length - 1);
                }

                //Determine the route entries to be added
                if (typeof action === "undefined") {
                    //Infer routes based on the controller's actions' names
                    var actions = controller.getActions();

                    for (var actionName in actions) {
                        newRoutes.push({
                            path: normalizedPath + "/" + actionName,
                            controller: controller,
                            action: actionName,
                            inferred: true
                        });
                    }
                }
                else {
                    newRoutes.push({
                        path: normalizedPath,
                        controller: controller,
                        action: action,
                        inferred: true,
                    });
                }

                //Add the route entries
                newRoutes.forEach(function(newRoute) {
                    var shouldSkip = false;
                    //Check if the route exists
                    for (var i = 0, length = routes.length; i < length; i++) {
                        if (routes[i].path === newRoute.path) {
                            if (newRoute.inferred && !routes[i].inferred) {
                                shouldSkip = true;
                            }
                            else {
                                //Remove the old route so that it can be overriden
                                routes.splice(i, 1);
                            }
                            break;
                        }
                    }

                    if (!shouldSkip) {
                        routes.push(newRoute);
                    }
                });
            },

            /*
                @function go

                Navigates to the specified route

                @param {string} route               The desired route

            */
            go: function(route) {
                if (RouteModule.isBound(currentPath)) {
                    for (var i = 0, length = routes.length; i < length; i++) {
                        //Raise leave event on current route's action's view if applicable
                        if (routes[i].path === currentPath) {
                            var view = routes[i].action.view;

                            if (view !== null) {
                                EventHelper.trigger(new Event(view, "leave", { path: currentPath }));
                            }
                        }
                    }
                }

                history.pushState(null, null, route.substring(1));
                processRoute(route);
            }
        };

        //Determine default base URL
        baseUrl = window.location.href;

        if (baseUrl.lastIndexOf("/") === baseUrl.length - 1) {
            baseUrl = baseUrl.substring(0, baseUrl.length - 1);
        }

        //Listen for changes in history state so that the route can be processed
        window.addEventListener("popstate", function() {
            if (RouteModule.isBound(currentPath)) {
                for (var i = 0, length = routes.length; i < length; i++) {
                    //Raise leave event on current route's action's view if applicable
                    if (routes[i].path === currentPath) {
                        var view = routes[i].action.view;

                        if (view !== null) {
                            EventHelper.trigger(new Event(view, "leave", { path: currentPath }));
                        }
                    }
                }
            }

            //Process the route
            if (window.location.href.indexOf(baseUrl) === 0) {
                processRoute(window.location.href.substring(baseUrl.length));
            }
            else {
                currentPath = null;
            }
        });

        //Public instance members
        return RouteModule;
    };

    return (function() {
        if (_singleton === null || typeof _singleton === "undefined") {
            _singleton = RouteModule;
        }

        return _singleton;
    })();
});
