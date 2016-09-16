(function() {

    'use strict';

    let HTML = require('../../core/HTML');
    let ValueTransform = require('../../mixin/ValueTransform');
    let TILE_SIZE = 256;

    let CommunityLabel = HTML.extend({

        includes: [
            // mixins
            ValueTransform
        ],

        options: {
            minFontSize: 10,
            maxFontSize: 14,
            labelMaxLength: TILE_SIZE,
            labelThreshold: 0.8
        },

        onMouseOver: function(e) {
            // forward community title string to app level mousemove handler
            // when pointer is over a community ring
            let target = $(e.originalEvent.target);
            let data = target.data('communityData');
            let value = {name: data.metadata, count: data.numNodes};
            if (!value) {
                value = {};
            }
            this.fire('mouseover', {
                elem: e.originalEvent.target,
                value: value,
                type: 'community-labels',
                layer: this
            });
        },

        onMouseOut: function(e) {
            // forward cleared string to app level mousemove handler when
            // pointer moves off a community ring
            this.fire('mouseout', {
                elem: e.originalEvent.target,
                type: 'community-labels',
                layer: this
            });
        },

        _createLabelDiv: function(community, coord, className) {
            let nval = this.transformValue(community.numNodes);
            let fontSize = this.options.minFontSize + nval * (this.options.maxFontSize - this.options.minFontSize);
            let dim = Math.pow(2, coord.z);
            let tileSpan = Math.pow(2, 32) / dim;
            let left = (community.pixel.x % tileSpan) / tileSpan * TILE_SIZE - (this.options.labelMaxLength / 2);
            let top = (community.pixel.y % tileSpan) / tileSpan * TILE_SIZE - (fontSize / 2);
            return $(
                `
                <div class="${className}" style="
                    left: ${left}px;
                    top: ${top}px;
                    font-size: ${fontSize}px;
                    line-height: ${fontSize}px;">${community.title}</div>
                `);
        },

        renderTile: function(container, data, coord) {
            if (!data) {
                return;
            }
            let divs = $();
            data.forEach(community => {
                if (community.title === '') {
                    return;
                }
                const nval = this.transformValue(community.numNodes);
                if (nval < this.options.labelThreshold) {
                    return;
                }
                let div = this._createLabelDiv(community, coord, 'community-label');
                div.data('communityData', community);
                divs = divs.add(div);
            });
            $(container).empty().append(divs);
        }

    });

    module.exports = CommunityLabel;

}());
