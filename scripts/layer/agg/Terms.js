(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type !== 'string') {
                throw 'Terms `field` ' + field + ' is not of type `string` in meta data';
            }
        } else {
            throw 'Terms `field` ' + field + ' is not recognized in meta data';
        }
    };

    var setTerms = function(field, size) {
        if (!field) {
            throw 'Terms `field` is missing from argument';
        }
        checkField(this._meta[field], field);
        this._params.terms = {
            field: field,
            size: size
        };
        this.clearExtrema();
        return this;
    };

    var getTerms = function() {
        return this._params.terms;
    };

    module.exports = {
        setTerms: setTerms,
        getTerms: getTerms
    };

}());
