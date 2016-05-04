(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (!meta.extrema) {
                throw 'Histogram `field` ' + field + ' is not ordinal in meta data';
            }
        } else {
            throw 'Histogram `field` ' + field + ' is not recognized in meta data';
        }
    };

    var setHistogram = function(field, interval) {
        if (!field) {
            throw 'Histogram `field` is missing from argument';
        }
        if (!interval) {
            throw 'Histogram `interval` are missing from argument';
        }
        checkField(this._meta[field], field);
        this._params.histogram = {
            field: field,
            interval: interval
        };
        this.clearExtrema();
        return this;
    };

    var getHistogram = function() {
        return this._params.histogram;
    };

    module.exports = {
        setHistogram: setHistogram,
        getHistogram: getHistogram
    };

}());