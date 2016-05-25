(function() {

    'use strict';

    var Canvas = require('../../core/Canvas');
    var ColorRamp = require('../../mixin/ColorRamp');
    var ValueTransform = require('../../mixin/ValueTransform');

    var TILE_SIZE = 256;

    // TODO: currently the tiles edges are padded by the point radius to prevent
    // cutoff of circles. This means that there is a radius*2 amount of overlap
    // between each tile. Currently this is not taken into account for mouse
    // events, which will give priority to tiles that are 'above' others.

    function getHash(tx, ty, radius) {
        var diameter = radius * 2;
        var xHash = Math.floor(tx / diameter);
        var yHash = Math.floor(ty / diameter);
        return xHash + ':' + yHash;
    }

    function fract(f) {
        return f % 1;
    }

    function getHashes(tx, ty, radius) {
        var diameter = radius * 2;
        var numCells = (TILE_SIZE + diameter) / diameter;
        var x = tx / diameter;
        var y = ty / diameter;
        var fx = fract(x);
        var fy = fract(y);
        var px = fx > 0.5;
        var nx = fx < 0.5;
        var py = fy > 0.5;
        var ny = fy < 0.5;
        var cx = Math.floor(x);
        var cy = Math.floor(y);
        var cells = [
            [cx, cy]
        ];
        if (px) {
            cells.push([cx+1, cy]);
        }
        if (py) {
            cells.push([cx, cy+1]);
        }
        if (nx) {
            cells.push([cx-1, cy]);
        }
        if (ny) {
            cells.push([cx, cy-1]);
        }
        if (nx && ny) {
            cells.push([cx-1, cy-1]);
        }
        if (px && py) {
            cells.push([cx+1, cy+1]);
        }
        if (nx && py) {
            cells.push([cx-1, cy+1]);
        }
        if (px && ny) {
            cells.push([cx+1, cy-1]);
        }
        return cells.filter(function(cell) {
            // remove cells outside tile (shouldn't occur?)
            var x = cell[0];
            var y = cell[1];
            return x >= 0 && x < numCells && y >= 0 && y < numCells;
        }).map(function(cell) {
            // hash
            return cell[0] + ':' + cell[1];
        });
    }

    function circleCollision(x, y, origin, radius) {
        var dx = x - origin.x;
        var dy = y - origin.y;
        var distSqr = (dx * dx) + (dy * dy);
        if (distSqr < (radius * radius)) {
            return true;
        }
        return false;
    }

    var MacroMicro = Canvas.extend({

        includes: [
            // mixins
            ColorRamp,
            ValueTransform
        ],

        options: {
            fillColor: 'rgba(10, 80, 20, 0.5)',
            strokeColor: '#ffffff',
            strokeWidth: 1
        },

        initialize: function() {
            if (!this.layers.micro || !this.layers.macro) {
                throw 'MacroMicro renderer requires `micro` and `macro` sub-layers';
            }
            ColorRamp.initialize.apply(this, arguments);
            ValueTransform.initialize.apply(this, arguments);
        },

        onClick: function(e) {
            var target = $(e.originalEvent.target);
            // get layer coord
            var layerPixel = this._getLayerPointFromEvent(e.originalEvent);
            // get tile coord
            var coord = this._getTileCoordFromLayerPoint(layerPixel);
            // get cache key
            var nkey = this.cacheKeyFromCoord(coord, true);
            // get cache entry
            var cached = this._cache[nkey];
            if (cached && cached.spatialHash) {
                // pixel in tile coords
                var tx = Math.floor(layerPixel.x % TILE_SIZE);
                var ty = Math.floor(layerPixel.y % TILE_SIZE);
                // spatial hash key
                var pointRadius = this._getPointRadius();
                var hash = getHash(tx, ty, pointRadius);
                // get points in bin
                var points = cached.spatialHash[hash];
                if (points) {
                    // find first intersecting point in the bin
                    var point, i;
                    for (i=0; i<points.length; i++) {
                        point = points[i];
                        // check for collision
                        if (circleCollision(tx, ty, point, pointRadius)) {
                            // execute callback
                            if (this.options.handlers.click) {
                                this.options.handlers.click(target, {
                                    value: point.hit,
                                    x: coord.x,
                                    y: coord.z,
                                    z: coord.z,
                                    type: 'macro_micro',
                                    layer: this
                                });
                            }
                            return;
                        }
                    }
                }
            }
            if (this.options.handlers.click) {
                this.options.handlers.click(target, null);
            }
        },

        onMouseMove: function(e) {
            var target = $(e.originalEvent.target);
            // get layer coord
            var layerPixel = this._getLayerPointFromEvent(e);
            // get tile coord
            var coord = this._getTileCoordFromLayerPoint(layerPixel);
            // get cache key
            var nkey = this.cacheKeyFromCoord(coord, true);
            // get cache entry
            var cached = this._cache[nkey];
            if (cached && cached.spatialHash) {
                // pixel in tile coords
                var tx = Math.floor(layerPixel.x % TILE_SIZE);
                var ty = Math.floor(layerPixel.y % TILE_SIZE);
                // spatial hash key
                var pointRadius = this._getPointRadius();
                var hash = getHash(tx, ty, pointRadius);
                // get points in bin
                var points = cached.spatialHash[hash];
                if (points) {
                    // find first intersecting point in the bin
                    var point, i;
                    for (i=0; i<points.length; i++) {
                        point = points[i];
                        // check for collision
                        if (circleCollision(tx, ty, point, pointRadius)) {
                            // execute callback
                            if (this.options.handlers.mousemove) {
                                this.options.handlers.mousemove(target, {
                                    value: point.hit,
                                    x: coord.x,
                                    y: coord.z,
                                    z: coord.z,
                                    type: 'macro_micro',
                                    layer: this
                                });
                            }
                            return;
                        }
                    }
                }
            }
            if (this.options.handlers.mousemove) {
                this.options.handlers.mousemove(target, null);
            }
        },

        renderMacroCanvas: function(bins, resolution, ramp) {
            var canvas = document.createElement('canvas');
            canvas.height = resolution;
            canvas.width = resolution;
            var ctx = canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, resolution, resolution);
            var data = imageData.data;
            var self = this;
            var color = [0, 0, 0, 0];
            var nval, rval, bin, i;
            for (i=0; i<bins.length; i++) {
                bin = bins[i];
                if (bin === 0) {
                    color[0] = 0;
                    color[1] = 0;
                    color[2] = 0;
                    color[3] = 0;
                } else {
                    nval = self.transformValue(bin);
                    rval = self.interpolateToRange(nval);
                    ramp(rval, color);
                }
                data[i * 4] = color[0];
                data[i * 4 + 1] = color[1];
                data[i * 4 + 2] = color[2];
                data[i * 4 + 3] = color[3];
            }
            ctx.putImageData(imageData, 0, 0);
            return canvas;
        },

        _getPointRadius: function() {
            return Math.max(1, (TILE_SIZE / this.layers.micro.getResolution()) / 2);
        },

        renderMicroCanvas: function(canvas, pixels) {
            var fillColor = this.options.fillColor;
            var strokeColor = this.options.strokeColor;
            var strokeWidth = this.options.strokeWidth;
            var pointRadius = this._getPointRadius();
            var bufferRadius = pointRadius + strokeWidth;
            var bufferDiameter = bufferRadius * 2;
            // buffer the canvas so that none of the points are cut off
            // ensure the DOM size is the same as the canvas
            $(canvas).css({
                'width': TILE_SIZE + bufferDiameter,
                'height': TILE_SIZE + bufferDiameter,
                'margin-top': -bufferRadius,
                'margin-left': -bufferRadius
            });
            // double the resolution if on a hi-res display
            var devicePixelFactor = (L.Browser.retina) ? 2 : 1;
            canvas.width = (TILE_SIZE + bufferDiameter) * devicePixelFactor;
            canvas.height = (TILE_SIZE + bufferDiameter) * devicePixelFactor;
            // get 2d context
            var ctx = canvas.getContext('2d');
            ctx.globalCompositeOperation = 'lighter';
            // draw each pixel
            pixels.forEach(function(pixel) {
                ctx.beginPath();
                ctx.fillStyle = fillColor;
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = strokeWidth;
                ctx.arc(
                    (bufferRadius + pixel.x) * devicePixelFactor,
                    (bufferRadius + pixel.y) * devicePixelFactor,
                    pointRadius * devicePixelFactor,
                    0, 2 * Math.PI);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            });
        },

        extractExtrema: function(res) {
            if (res.type === 'macro') {
                var bins = new Float64Array(res.data);
                return {
                    min: _.min(bins),
                    max: _.max(bins)
                };
            }
            return {
                min: Infinity,
                max: -Infinity
            };
        },

        renderTile: function(canvas, res, coords) {
            if (!res) {
                return;
            }
            var type = res.type;
            var data = res.data;
            if (type === 'macro') {
                // macro
                var bins = new Float64Array(data);
                var resolution = Math.sqrt(bins.length);
                var ramp = this.getColorRamp();
                var tileCanvas = this.renderMacroCanvas(bins, resolution, ramp);
                var ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(
                    tileCanvas,
                    0, 0,
                    resolution, resolution,
                    0, 0,
                    canvas.width, canvas.height);
            } else {
                // micro
                // modify cache entry
                var nkey = this.cacheKeyFromCoord(coords, true);
                var cached = this._cache[nkey];
                // check if pixel locations have been cached
                if (!cached.pixels || !cached.spatialHash) {
                    // convert x / y to tile pixels
                    var micro = this.layers.micro;
                    var xField = micro.getXField();
                    var yField = micro.getYField();
                    var zoom = coords.z;
                    var pointRadius = this._getPointRadius();
                    var pixels = [];
                    var spatialHash = {};
                    // calc pixel locations
                    data.forEach(function(hit) {
                        var x = _.get(hit, xField);
                        var y = _.get(hit, yField);
                        if (x !== undefined && y !== undefined) {
                            var layerPixel = micro.getLayerPointFromDataPoint(x, y, zoom);
                            // pixel in tile coords
                            var tx = Math.floor(layerPixel.x % TILE_SIZE);
                            var ty = Math.floor(layerPixel.y % TILE_SIZE);
                            // create pixel
                            var pixel = {
                                x: tx,
                                y: ty,
                                hit: hit
                            };
                            pixels.push(pixel);
                            // spatial hash key
                            var hashes = getHashes(tx, ty, pointRadius);
                            // add pixel to hash
                            hashes.forEach(function(hash) {
                                spatialHash[hash] = spatialHash[hash] || [];
                                spatialHash[hash].push(pixel);
                            });
                        }
                    });
                    // store in cache
                    cached.pixels = pixels;
                    cached.spatialHash = spatialHash;
                }
                // render the tile
                this.renderMicroCanvas(canvas, cached.pixels);
            }
        }

    });

    module.exports = MacroMicro;

}());
