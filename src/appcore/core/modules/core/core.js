define(function(require) {
    "use strict";

    var CoreHelper = require("./core.helper");
    var CoreModel = require("./core.model");
    var CoreView = require("./core.view");

    /*
        @abstract
        @class Core

        @classdesc Core class.
    */
    var Core = (function() {
        //Private instance members
        var Core = {};
        var data = {
            views: []
        };

        Core.Helper = new CoreHelper();
        Core.Model = new CoreModel(Core);
        Core.View = new CoreView(Core, data);

        //Public instance members
        return Core;
    })();

    return Core;
});