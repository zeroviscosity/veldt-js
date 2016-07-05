(function() {

    'use strict';

    var boolQueryCheck = require('../query/Bool');

    function mod(n, m) {
        return ((n % m) + m) % m;
    }

    var Live = L.Class.extend({

        options: {
            transform: function(val) { return val; }
        },

        initialize: function(meta, options) {
            options = options || {};
            // set renderer
            if (options.rendererClass) {
                var renderer;
                // recursively extend and initialize
                if (options.rendererClass.prototype) {
                    renderer = new options.rendererClass();
                } else {
                    renderer = options.rendererClass;
                }
                // extend this object
                $.extend(true, this, renderer);
                // copy prototype options property by value, this is important
                this.options = $.extend(true, {}, this.options);
                delete options.rendererClass;
            }
            // set options
            L.setOptions(this, options);
            // set meta
            this._meta = meta;
            // set params
            this._params = {
                binning: {}
            };
            // set extrema / cache
            this._cache = {};
            this.clearExtrema();
        },

        clearExtrema: function() {
            this._extrema = {
                min: Number.MAX_VALUE,
                max: 0
            };
        },

        getExtrema: function() {
            return this._extrema;
        },

        updateExtrema: function(data) {
            var extrema = this.extractExtrema(data);
            var changed = false;
            if (extrema.min < this._extrema.min) {
                changed = true;
                this._extrema.min = extrema.min;
            }
            if (extrema.max > this._extrema.max) {
                changed = true;
                this._extrema.max = extrema.max;
            }
            return changed;
        },

        extractExtrema: function(data) {
            return {
                min: _.min(data),
                max: _.max(data)
            };
        },

        setQuery: function(query) {
            if (!query.must && !query.must_not && !query.should) {
                throw 'Root query must have at least one `must`, `must_not`, or `should` argument.';
            }
            // check that the query is valid
            boolQueryCheck(this._meta, query);
            // set query
            this._params.must = query.must;
            this._params.must_not = query.must_not;
            this._params.should = query.should;
            // cleat extrema
            this.clearExtrema();
        },

        getQuery: function() {
            return {
                must: this._params.must,
                must_not: this._params.must_not,
                should: this._params.should,
            };
        },

        clearQuery: function() {
            // clear query
            this._params.must = undefined;
            this._params.must_not = undefined;
            this._params.should = undefined;
            // cleat extrema
            this.clearExtrema();
        },

        getMeta: function() {
            return this._meta;
        },

        getParams: function() {
            return this._params;
        },

        getNormalizedCoords: function(coords) {
            var pow = Math.pow(2, coords.z);
            return {
                x: mod(coords.x, pow),
                y: mod(coords.y, pow),
                z: coords.z
            };
        },

        cacheKeyFromCoord: function(coords, normalize) {
            if (normalize) {
                // leaflet layer x and y may be > n^2, and < 0 in the case
                // of a wraparound. If normalize is true, mod the coords
                coords = this.getNormalizedCoords(coords);
            }
            return coords.z + ':' + coords.x + ':' + coords.y;
        },

        coordFromCacheKey: function(key) {
            var arr = key.split(':');
            return {
                x: parseInt(arr[1], 10),
                y: parseInt(arr[2], 10),
                z: parseInt(arr[0], 10)
            };
        },

        onTileUnload: function(event) {
            var coords = event.coords;
            // cache key from coords
            var key = this.cacheKeyFromCoord(coords);
            // cache key from normalized coords
            var nkey = this.cacheKeyFromCoord(coords, true);
            // get cache entry
            var cached = this._cache[nkey];
            // could the be case where the cache is cleared before tiles are
            // unloaded
            if (!cached) {
                return;
            }
            // remove the tile from the cache
            delete cached.tiles[key];
            // don't remove cache entry unless to tiles use it anymore
            if (_.keys(cached.tiles).length === 0) {
                // get the tile being deleted
                var tile = cached.tiles[key];
                // no more tiles use this cached data, so delete it
                this.fire('cacheunload', {
                    tile: tile,
                    coords: coords,
                    entry: cached
                });
                delete this._cache[nkey];
            }
        },

        _requestTile: function(coords, tile, callback) {
            var self = this;
            var ncoords = this.getNormalizedCoords(coords);
            // cache key from coords
            var key = this.cacheKeyFromCoord(coords);
            // cache key from normalized coords
            var nkey = this.cacheKeyFromCoord(coords, true);
            // check cache
            var cached = this._cache[nkey];
            if (cached) {
                // add tile under normalize coords
                cached.tiles[key] = tile;
                if (!cached.isPending) {
                    // cache entry already exists
                    self.fire('cachehit', {
                        tile: tile,
                        coords: coords,
                        entry: cached
                    });
                    // execute callback
                    callback();
                } else {
                    // tile is already pending, add callback
                    cached.callbacks.push(callback);
                }
            } else {
                // create a cache entry
                this._cache[nkey] = {
                    isPending: true,
                    tiles: {},
                    data: null,
                    callbacks: [ callback ]
                };
                // add tile to the cache entry
                this._cache[nkey].tiles[key] = tile;
                // request the tile
                this.requestTile(ncoords, function(data) {
                    var cached = self._cache[nkey];
                    if (!cached) {
                        // tile is no longer being tracked, ignore
                        return;
                    }
                    // flag as no longer pending
                    cached.isPending = false;
                    // transform and store tile data in cache
                    cached.data = self.options.transform(data);
                    if (cached.data) {
                        // execute pending callbacks
                        cached.callbacks.forEach(function(callback) {
                            callback();
                        });
                        cached.callbacks = [];
                        // data is loaded into cache
                        self.fire('cacheload', {
                            tile: tile,
                            coords: coords,
                            entry: cached
                        });
                        // update the extrema
                        if (self.updateExtrema(cached.data)) {
                            // if extrema changed, fire event
                            self.fire('extremachange', {
                                tile: tile,
                                coords: coords,
                                entry: cached
                            });
                        }
                    }
                });
            }
        },

        requestTile: function() {
            // override
        }

    });

    module.exports = Live;

}());
