(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.prism = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function () {

    'use strict';

    var WebGLContext = require('./WebGLContext'),
        _boundBuffer = null;

    /**
     * Instantiates an IndexBuffer object.
     * @class IndexBuffer
     * @classdesc An index buffer object.
     */
    function IndexBuffer( arg, options ) {
        options = options || {};
        this.gl = WebGLContext.get();
        this.buffer = 0;
        if ( arg ) {
            if ( arg instanceof WebGLBuffer ) {
                // if the argument is already a webglbuffer, simply wrap it
                this.buffer = arg;
                this.type = options.type || 'UNSIGNED_SHORT';
                this.count = ( options.count !== undefined ) ? options.count : 0;
            } else {
                // otherwise, buffer it
                this.bufferData( arg );
            }
        }
        this.offset = ( options.offset !== undefined ) ? options.offset : 0;
        this.mode = ( options.mode !== undefined ) ? options.mode : 'TRIANGLES';
    }

    /**
     * Upload index data to the GPU.
     * @memberof IndexBuffer
     *
     * @param {Array|Uint16Array|Uint32Array} arg - The array of data to buffer.
     *
     * @returns {IndexBuffer} The index buffer object for chaining.
     */
    IndexBuffer.prototype.bufferData = function( arg ) {
        var gl = this.gl;
        // check for type support
        var uint32support = WebGLContext.checkExtension( 'OES_element_index_uint' );
        if( !uint32support ) {
            // no support for uint32
            if ( arg instanceof Array ) {
                // if array, buffer to uint16
                arg = new Uint16Array( arg );
            } else if ( arg instanceof Uint32Array ) {
                // if uint32, downgrade to uint16
                console.warn( 'Cannot create IndexBuffer of format ' +
                    'gl.UNSIGNED_INT as OES_element_index_uint is not ' +
                    'supported, defaulting to gl.UNSIGNED_SHORT.' );
                arg = new Uint16Array( arg );
            }
        } else {
            // uint32 is supported
            if ( arg instanceof Array ) {
                // if array, buffer to uint32
                arg = new Uint32Array( arg );
            }
        }
        // set data type based on array
        if ( arg instanceof Uint16Array ) {
            this.type = 'UNSIGNED_SHORT';
        } else if ( arg instanceof Uint32Array ) {
            this.type = 'UNSIGNED_INT';
        } else {
            console.error( 'IndexBuffer requires an Array or ' +
                'ArrayBuffer argument, command ignored.' );
            return;
        }
        // create buffer, store count
        if ( !this.buffer ) {
            this.buffer = gl.createBuffer();
        }
        this.count = arg.length;
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.buffer );
        gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, arg, gl.STATIC_DRAW );
        return this;
    };

    /**
     * Binds the index buffer object.
     * @memberof IndexBuffer
     *
     * @returns {IndexBuffer} Returns the index buffer object for chaining.
     */
    IndexBuffer.prototype.bind = function() {
        // if this buffer is already bound, exit early
        if ( _boundBuffer === this ) {
            return;
        }
        var gl = this.gl;
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.buffer );
        _boundBuffer = this;
        return this;
    };

    /**
     * Unbinds the index buffer object.
     * @memberof IndexBuffer
     *
     * @returns {IndexBuffer} Returns the index buffer object for chaining.
     */
    IndexBuffer.prototype.unbind = function() {
        // if there is no buffer bound, exit early
        if ( _boundBuffer === null ) {
            return;
        }
        var gl = this.gl;
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
        _boundBuffer = null;
        return this;
    };

    /**
     * Execute the draw command for the bound buffer.
     * @memberof IndexBuffer
     *
     * @param {Object} options - The options to pass to 'drawElements'. Optional.
     *
     * @returns {IndexBuffer} Returns the index buffer object for chaining.
     */
    IndexBuffer.prototype.draw = function( options ) {
        options = options || {};
        if ( _boundBuffer === null ) {
            console.warn( 'No IndexBuffer is bound, command ignored.' );
            return;
        }
        var gl = this.gl;
        var mode = gl[ options.mode || this.mode || 'TRIANGLES' ];
        var offset = ( options.offset !== undefined ) ? options.offset : this.offset;
        var count = ( options.count !== undefined ) ? options.count : this.count;
        gl.drawElements(
            mode,
            count,
            gl[ this.type ],
            offset );
        return this;
    };

    module.exports = IndexBuffer;

}());

},{"./WebGLContext":11}],2:[function(require,module,exports){
(function () {

    'use strict';

    var WebGLContext = require('./WebGLContext'),
        Stack = require('../util/Stack'),
        _stack = new Stack(),
        _boundBuffer = null;

    /**
     * Binds the renderTarget object, caching it to prevent unnecessary rebinds.
     *
     * @param {RenderTarget} renderTarget - The RenderTarget object to bind.
     */
     function bind( renderTarget ) {
        // if this buffer is already bound, exit early
        if ( _boundBuffer === renderTarget ) {
            return;
        }
        var gl = renderTarget.gl;
        gl.bindFramebuffer( gl.FRAMEBUFFER, renderTarget.framebuffer );
        _boundBuffer = renderTarget;
    }

    /**
     * Unbinds the renderTarget object. Prevents unnecessary unbinding.
     *
     * @param {RenderTarget} renderTarget - The RenderTarget object to unbind.
     */
     function unbind( renderTarget ) {
        // if there is no buffer bound, exit early
        if ( _boundBuffer === null ) {
            return;
        }
        var gl = renderTarget.gl;
        gl.bindFramebuffer( gl.FRAMEBUFFER, null );
        _boundBuffer = null;
    }

    /**
     * Instantiates a RenderTarget object.
     * @class RenderTarget
     * @classdesc A renderTarget class to allow rendering to textures.
     */
    function RenderTarget() {
        var gl = this.gl = WebGLContext.get();
        this.framebuffer = gl.createFramebuffer();
        this.textures = {};
        return this;
    }

    /**
     * Binds the renderTarget object and pushes it to the front of the stack.
     * @memberof RenderTarget
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.push = function() {
        _stack.push( this );
        bind( this );
        return this;
    };

    /**
     * Unbinds the renderTarget object and binds the renderTarget beneath it on
     * this stack. If there is no underlying renderTarget, bind the backbuffer.
     * @memberof RenderTarget
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.pop = function() {
        var top;
        _stack.pop();
        top = _stack.top();
        if ( top ) {
            bind( top );
        } else {
            unbind( this );
        }
        return this;
    };

    /**
     * Attaches the provided texture to the provided attachment location.
     * @memberof RenderTarget
     *
     * @param {Texture2D} texture - The texture to attach.
     * @param {number} index - The attachment index. (optional)
     * @param {String} target - The texture target type. (optional)
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.setColorTarget = function( texture, index, target ) {
        var gl = this.gl;
        if ( typeof index === 'string' ) {
            target = index;
            index = undefined;
        }
        index = ( index !== undefined ) ? index : 0;
        this.textures[ 'color' + index ] = texture;
        this.push();
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl[ 'COLOR_ATTACHMENT' + index ],
            gl[ target || 'TEXTURE_2D' ],
            texture.texture,
            0 );
        this.pop();
        return this;
    };

    /**
     * Attaches the provided texture to the provided attachment location.
     * @memberof RenderTarget
     *
     * @param {Texture2D} texture - The texture to attach.
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.setDepthTarget = function( texture ) {
        var gl = this.gl;
        this.textures.depth = texture;
        this.push();
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.TEXTURE_2D,
            texture.texture,
            0 );
        this.pop();
        return this;
    };

    /**
     * Clears the color bits of the renderTarget.
     * @memberof RenderTarget
     *
     * @param {number} r - The red value.
     * @param {number} g - The green value.
     * @param {number} b - The blue value.
     * @param {number} a - The alpha value.
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.clearColor = function( r, g, b, a ) {
        var gl = this.gl;
        r = ( r !== undefined ) ? r : 0;
        g = ( g !== undefined ) ? g : 0;
        b = ( b !== undefined ) ? b : 0;
        a = ( a !== undefined ) ? a : 0;
        this.push();
        gl.clearColor( r, g, b, a );
        gl.clear( gl.COLOR_BUFFER_BIT );
        this.pop();
        return this;
    };

    /**
     * Clears the depth bits of the renderTarget.
     * @memberof RenderTarget
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.clearDepth = function( r, g, b, a ) {
        var gl = this.gl;
        r = ( r !== undefined ) ? r : 0;
        g = ( g !== undefined ) ? g : 0;
        b = ( b !== undefined ) ? b : 0;
        a = ( a !== undefined ) ? a : 0;
        this.push();
        gl.clearColor( r, g, b, a );
        gl.clear( gl.DEPTH_BUFFER_BIT );
        this.pop();
        return this;
    };

    /**
     * Clears the stencil bits of the renderTarget.
     * @memberof RenderTarget
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.clearStencil = function( r, g, b, a ) {
        var gl = this.gl;
        r = ( r !== undefined ) ? r : 0;
        g = ( g !== undefined ) ? g : 0;
        b = ( b !== undefined ) ? b : 0;
        a = ( a !== undefined ) ? a : 0;
        this.push();
        gl.clearColor( r, g, b, a );
        gl.clear( gl.STENCIL_BUFFER_BIT );
        this.pop();
        return this;
    };

    /**
     * Clears all the bits of the renderTarget.
     * @memberof RenderTarget
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.clear = function( r, g, b, a ) {
        var gl = this.gl;
        r = ( r !== undefined ) ? r : 0;
        g = ( g !== undefined ) ? g : 0;
        b = ( b !== undefined ) ? b : 0;
        a = ( a !== undefined ) ? a : 0;
        this.push();
        gl.clearColor( r, g, b, a );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT );
        this.pop();
        return this;
    };

    /**
     * Resizes the renderTarget and all attached textures by the provided height
     * and width.
     * @memberof RenderTarget
     *
     * @param {number} width - The new width of the renderTarget.
     * @param {number} height - The new height of the renderTarget.
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.resize = function( width, height ) {
        var key;
        if ( !width || !height ) {
            console.warn( 'Width or height arguments missing, command ignored.' );
            return this;
        }
        for ( key in this.textures ) {
            if ( this.textures.hasOwnProperty( key ) ) {
                this.textures[ key ].resize( width, height );
            }
        }
        return this;
    };

    module.exports = RenderTarget;

}());

},{"../util/Stack":13,"./WebGLContext":11}],3:[function(require,module,exports){
(function () {

    'use strict';

    var VertexPackage = require('../core/VertexPackage'),
        VertexBuffer = require('../core/VertexBuffer'),
        IndexBuffer = require('../core/IndexBuffer');

    function Renderable( spec, options ) {
        spec = spec || {};
        options = options || {};
        if ( spec.vertexBuffer || spec.vertexBuffers ) {
            // use existing vertex buffer
            this.vertexBuffers = spec.vertexBuffers || [ spec.vertexBuffer ];
        } else {
            // create vertex package
            var vertexPackage = new VertexPackage( spec.vertices );
            // create vertex buffer
            this.vertexBuffers = [ new VertexBuffer( vertexPackage ) ];
        }
        if ( spec.indexBuffer ) {
            // use existing index buffer
            this.indexBuffer = spec.indexBuffer;
        } else {
            if ( spec.indices ) {
                // create index buffer
                this.indexBuffer = new IndexBuffer( spec.indices );
            }
        }
        // store rendering options
        this.options = {
            mode: options.mode,
            offset: options.offset,
            count: options.count
        };
        return this;
    }

    Renderable.prototype.draw = function( options ) {
        var overrides = options || {};
        // override options if provided
        overrides.mode = overrides.mode || this.options.mode;
        overrides.offset = ( overrides.offset !== undefined ) ? overrides.offset : this.options.offset;
        overrides.count = ( overrides.count !== undefined ) ? overrides.count : this.options.count;
        // draw the renderable
        if ( this.indexBuffer ) {
            // use index buffer to draw elements
            this.vertexBuffers.forEach( function( vertexBuffer ) {
                vertexBuffer.bind();
                // no advantage to unbinding as there is no stack used
            });
            this.indexBuffer.bind();
            this.indexBuffer.draw( overrides );
            // no advantage to unbinding as there is no stack used
        } else {
            // no index buffer, use draw arrays
            this.vertexBuffers.forEach( function( vertexBuffer ) {
                vertexBuffer.bind();
                vertexBuffer.draw( overrides );
                // no advantage to unbinding as there is no stack used
            });
        }
        return this;
    };

    module.exports = Renderable;

}());

},{"../core/IndexBuffer":1,"../core/VertexBuffer":8,"../core/VertexPackage":9}],4:[function(require,module,exports){
(function () {

    'use strict';

    var WebGLContext = require('./WebGLContext'),
        ShaderParser = require('./ShaderParser'),
        Util = require('../util/Util'),
        XHRLoader = require('../util/XHRLoader'),
        Stack = require('../util/Stack'),
        UNIFORM_FUNCTIONS = {
            'bool': 'uniform1i',
            'bool[]': 'uniform1iv',
            'float': 'uniform1f',
            'float[]': 'uniform1fv',
            'int': 'uniform1i',
            'int[]': 'uniform1iv',
            'uint': 'uniform1i',
            'uint[]': 'uniform1iv',
            'vec2': 'uniform2fv',
            'vec2[]': 'uniform2fv',
            'ivec2': 'uniform2iv',
            'ivec2[]': 'uniform2iv',
            'vec3': 'uniform3fv',
            'vec3[]': 'uniform3fv',
            'ivec3': 'uniform3iv',
            'ivec3[]': 'uniform3iv',
            'vec4': 'uniform4fv',
            'vec4[]': 'uniform4fv',
            'ivec4': 'uniform4iv',
            'ivec4[]': 'uniform4iv',
            'mat2': 'uniformMatrix2fv',
            'mat2[]': 'uniformMatrix2fv',
            'mat3': 'uniformMatrix3fv',
            'mat3[]': 'uniformMatrix3fv',
            'mat4': 'uniformMatrix4fv',
            'mat4[]': 'uniformMatrix4fv',
            'sampler2D': 'uniform1i',
            'samplerCube': 'uniform1i'
        },
        _stack = new Stack(),
        _boundShader = null;

    /**
     * Given vertex and fragment shader source, returns an object containing
     * information pertaining to the uniforms and attribtues declared.
     *
     * @param {String} vertSource - The vertex shader source.
     * @param {String} fragSource - The fragment shader source.
     *
     * @returns {Object} The attribute and uniform information.
     */
    function getAttributesAndUniformsFromSource( vertSource, fragSource ) {
        var declarations = ShaderParser.parseDeclarations(
                [ vertSource, fragSource ],
                [ 'uniform', 'attribute' ]),
            attributes = {},
            uniforms = {},
            attrCount = 0,
            declaration,
            i;
        // for each declaration in the shader
        for ( i=0; i<declarations.length; i++ ) {
            declaration = declarations[i];
            // check if its an attribute or uniform
            if ( declaration.qualifier === 'attribute' ) {
                // if attribute, store type and index
                attributes[ declaration.name ] = {
                    type: declaration.type,
                    index: attrCount++
                };
            } else if ( declaration.qualifier === 'uniform' ) {
                // if uniform, store type and buffer function name
                uniforms[ declaration.name ] = {
                    type: declaration.type,
                    func: UNIFORM_FUNCTIONS[ declaration.type + (declaration.count > 1 ? '[]' : '') ]
                };
            }
        }
        return {
            attributes: attributes,
            uniforms: uniforms
        };
    }

    /*
     * Given a shader source string and shader type, compiles the shader and
     * returns the resulting WebGLShader object.
     *
     * @param {WebGLRenderingContext} gl - The webgl rendering context.
     * @param {String} shaderSource - The shader source.
     * @param {String} type - The shader type.
     *
     * @returns {WebGLShader} The compiled shader object.
     */
    function compileShader( gl, shaderSource, type ) {
        var shader = gl.createShader( gl[ type ] );
        gl.shaderSource( shader, shaderSource );
        gl.compileShader( shader );
        if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
            console.error( 'An error occurred compiling the shaders: ' +
                gl.getShaderInfoLog( shader ) );
            return null;
        }
        return shader;
    }

    /**
     * Binds the attribute locations for the Shader object.
     *
     * @param {Shader} shader - The Shader object.
     */
    function bindAttributeLocations( shader ) {
        var gl = shader.gl,
            attributes = shader.attributes,
            name;
        for ( name in attributes ) {
            if ( attributes.hasOwnProperty( name ) ) {
                // bind the attribute location
                gl.bindAttribLocation(
                    shader.program,
                    attributes[ name ].index,
                    name );
                /*
                console.log( 'Bound vertex attribute \`' + name +
                    '\' to location ' + attributes[ name ].index );
                */
            }
        }
    }

    /**
     * Queries the webgl rendering context for the uniform locations.
     *
     * @param {Shader} shader - The Shader object.
     */
    function getUniformLocations( shader ) {
        var gl = shader.gl,
            uniforms = shader.uniforms,
            uniform,
            name;
        for ( name in uniforms ) {
            if ( uniforms.hasOwnProperty( name ) ) {
                uniform = uniforms[ name ];
                // get the uniform location
                uniform.location = gl.getUniformLocation( shader.program, name );
                /*
                console.log( name + ', ' +
                    gl.getUniformLocation( shader.program, name ) + ',' );
                */
            }
        }
    }

    /**
     * Returns a function to load shader source from a url.
     *
     * @param {String} url - The url to load the resource from.
     *
     * @returns {Function} The function to load the shader source.
     */
    function loadShaderSource( url ) {
        return function( done ) {
            XHRLoader.load(
                url,
                {
                    responseType: 'text',
                    success: done,
                    error: function(err) {
                        console.error( err );
                        done( null );
                    }
                });
        };
    }

    /**
     * Returns a function to pass through the shader source.
     *
     * @param {String} source - The source of the shader.
     *
     * @returns {Function} The function to pass through the shader source.
     */
    function passThroughSource( source ) {
        return function( done ) {
            done( source );
        };
    }

    /**
     * Returns a function that takes an array of GLSL source strings and URLs,
     * and resolves them into and array of GLSL source.
     */
    function resolveSources( sources ) {
        return function( done ) {
            var jobs = [];
            sources = sources || [];
            sources = ( !( sources instanceof Array ) ) ? [ sources ] : sources;
            sources.forEach( function( source ) {
                if ( ShaderParser.isGLSL( source ) ) {
                    jobs.push( passThroughSource( source ) );
                } else {
                    jobs.push( loadShaderSource( source ) );
                }
            });
            Util.async( jobs, function( results ) {
                done( results );
            });
        };
    }

    /**
     * Binds the shader object, caching it to prevent unnecessary rebinds.
     *
     * @param {Shader} shader - The Shader object to bind.
     */
    function bind( shader ) {
        // if this shader is already bound, exit early
        if ( _boundShader === shader ) {
            return;
        }
        shader.gl.useProgram( shader.program );
        _boundShader = shader;
    }

    /**
     * Unbinds the shader object. Prevents unnecessary unbinding.
     *
     * @param {Shader} shader - The Shader object to unbind.
     */
    function unbind( shader ) {
        // if there is no shader bound, exit early
        if ( _boundShader === null ) {
            return;
        }
        shader.gl.useProgram( null );
        _boundShader = null;
    }

    /**
     * Clears the shader attributes due to aborting of initialization.
     *
     * @param {Shader} shader - The Shader object.
     */
    function abortShader( shader ) {
        shader.program = null;
        shader.attributes = null;
        shader.uniforms = null;
        return shader;
    }

    /**
     * Instantiates a Shader object.
     * @class Shader
     * @classdesc A shader class to assist in compiling and linking webgl
     * shaders, storing attribute and uniform locations, and buffering uniforms.
     */
    function Shader( spec, callback ) {
        var that = this;
        spec = spec || {};
        this.program = 0;
        this.gl = WebGLContext.get();
        this.version = spec.version || '1.00';
        // check source arguments
        if ( !spec.vert ) {
            console.error( 'Vertex shader argument has not been provided, ' +
                'shader initialization aborted.' );
        }
        if ( !spec.frag ) {
            console.error( 'Fragment shader argument has not been provided, ' +
                'shader initialization aborted.' );
        }
        // create the shader
        Util.async({
            common: resolveSources( spec.common ),
            vert: resolveSources( spec.vert ),
            frag: resolveSources( spec.frag ),
        }, function( shaders ) {
            that.create( shaders );
            if ( callback ) {
                callback( that );
            }
        });
    }

    /**
     * Creates the shader object from source strings. This includes:
     *    1) Compiling and linking the shader program.
     *    2) Parsing shader source for attribute and uniform information.
     *    3) Binding attribute locations, by order of delcaration.
     *    4) Querying and storing uniform location.
     * @memberof Shader
     *
     * @param {Object} shaders - A map containing sources under 'vert' and
     *     'frag' attributes.
     *
     * @returns {Shader} The shader object, for chaining.
     */
    Shader.prototype.create = function( shaders ) {
        // once all shader sources are loaded
        var gl = this.gl,
            common = shaders.common.join( '' ),
            vert = shaders.vert.join( '' ),
            frag = shaders.frag.join( '' ),
            vertexShader,
            fragmentShader,
            attributesAndUniforms;
        // compile shaders
        vertexShader = compileShader( gl, common + vert, 'VERTEX_SHADER' );
        fragmentShader = compileShader( gl, common + frag, 'FRAGMENT_SHADER' );
        if ( !vertexShader || !fragmentShader ) {
            console.error( 'Aborting instantiation of shader due to compilation errors.' );
            return abortShader( this );
        }
        // parse source for attribute and uniforms
        attributesAndUniforms = getAttributesAndUniformsFromSource( vert, frag );
        // set member attributes
        this.attributes = attributesAndUniforms.attributes;
        this.uniforms = attributesAndUniforms.uniforms;
        // create the shader program
        this.program = gl.createProgram();
        // attach vertex and fragment shaders
        gl.attachShader( this.program, vertexShader );
        gl.attachShader( this.program, fragmentShader );
        // bind vertex attribute locations BEFORE linking
        bindAttributeLocations( this );
        // link shader
        gl.linkProgram( this.program );
        // If creating the shader program failed, alert
        if ( !gl.getProgramParameter( this.program, gl.LINK_STATUS ) ) {
            console.error( 'An error occured linking the shader: ' +
                gl.getProgramInfoLog( this.program ) );
            console.error( 'Aborting instantiation of shader due to linking errors.' );
            return abortShader( this );
        }
        // get shader uniform locations
        getUniformLocations( this );
        return this;
    };

    /**
     * Binds the shader object and pushes it to the front of the stack.
     * @memberof Shader
     *
     * @returns {Shader} The shader object, for chaining.
     */
    Shader.prototype.push = function() {
        _stack.push( this );
        bind( this );
        return this;
    };

    /**
     * Unbinds the shader object and binds the shader beneath it on
     * this stack. If there is no underlying shader, bind the backbuffer.
     * @memberof Shader
     *
     * @returns {Shader} The shader object, for chaining.
     */
    Shader.prototype.pop = function() {
        var top;
        _stack.pop();
        top = _stack.top();
        if ( top ) {
            bind( top );
        } else {
            unbind( this );
        }
        return this;
    };

    /**
     * Buffer a uniform value by name.
     * @memberof Shader
     *
     * @param {String} uniformName - The uniform name in the shader source.
     * @param {*} uniform - The uniform value to buffer.
     *
     * @returns {Shader} The shader object, for chaining.
     */
    Shader.prototype.setUniform = function( uniformName, uniform ) {
        if ( !this.program ) {
            if ( !this.hasLoggedError ) {
                console.warn( 'Attempting to use an incomplete shader, command ignored.' );
                this.hasLoggedError = true;
            }
            return;
        }
        if ( this !== _boundShader ) {
            console.warn( 'Attempting to set uniform `' + uniformName +
                '` for an unbound shader, command ignored.' );
            return;
        }
        var uniformSpec = this.uniforms[ uniformName ],
            func,
            type,
            location,
            value;
        // ensure that the uniform spec exists for the name
        if ( !uniformSpec ) {
            console.warn( 'No uniform found under name `' + uniformName +
                '`, command ignored.' );
            return;
        }
        // ensure that the uniform argument is defined
        if ( uniform === undefined ) {
            console.warn( 'Argument passed for uniform `' + uniformName +
                '` is undefined, command ignored.' );
            return;
        }
        // get the uniform location, type, and buffer function
        func = uniformSpec.func;
        type = uniformSpec.type;
        location = uniformSpec.location;
        value = uniform.toArray ? uniform.toArray() : uniform;
        value = ( value instanceof Array ) ? new Float32Array( value ) : value;
        // convert boolean's to 0 or 1
        value = ( typeof value === 'boolean' ) ? ( value ? 1 : 0 ) : value;
        // pass the arguments depending on the type
        switch ( type ) {
            case 'mat2':
            case 'mat3':
            case 'mat4':
                this.gl[ func ]( location, false, value );
                break;
            default:
                this.gl[ func ]( location, value );
                break;
        }
        return this;
    };

    module.exports = Shader;

}());

},{"../util/Stack":13,"../util/Util":14,"../util/XHRLoader":15,"./ShaderParser":5,"./WebGLContext":11}],5:[function(require,module,exports){
(function () {

    'use strict';

    var PRECISION_QUALIFIERS = {
        highp: true,
        mediump: true,
        lowp: true
    };

    var PRECISION_TYPES = {
        float: 'float',
        vec2: 'float',
        vec3: 'float',
        vec4: 'float',
        ivec2: 'int',
        ivec3: 'int',
        ivec4: 'int',
        int: 'int',
        uint: 'int',
        sampler2D: 'sampler2D',
        samplerCube: 'samplerCube',
    };

    var COMMENTS_REGEXP = /(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm;
    var ENDLINE_REGEXP = /(\r\n|\n|\r)/gm;
    var WHITESPACE_REGEXP = /\s{2,}/g;
    var BRACKET_WHITESPACE_REGEXP = /(\s*)(\[)(\s*)(\d+)(\s*)(\])(\s*)/g;
    var NAME_COUNT_REGEXP = /([a-zA-Z_][a-zA-Z0-9_]*)(?:\[(\d+)\])?/;
    var PRECISION_REGEX = /\b(precision)\s+(\w+)\s+(\w+)/;
    var GLSL_REGEXP =  /void\s+main\s*\(\s*\)\s*/mi;

    /**
     * Removes standard comments from the provided string.
     *
     * @param {String} str - The string to strip comments from.
     *
     * @return {String} The commentless string.
     */
    function stripComments( str ) {
        // regex source: https://github.com/moagrius/stripcomments
        return str.replace( COMMENTS_REGEXP, '' );
    }

    /**
     * Converts all whitespace into a single ' ' space character.
     *
     * @param {String} str - The string to normalize whitespace from.
     *
     * @return {String} The normalized string.
     */
    function normalizeWhitespace( str ) {
        return str.replace( ENDLINE_REGEXP, ' ' ) // remove line endings
            .replace( WHITESPACE_REGEXP, ' ' ) // normalize whitespace to single ' '
            .replace( BRACKET_WHITESPACE_REGEXP, '$2$4$6' ); // remove whitespace in brackets
    }

    /**
     * Parses the name and count out of a name statement, returning the
     * declaration object.
     *
     * @param {String} qualifier - The qualifier string.
     * @param {String} precision - The precision string.
     * @param {String} type - The type string.
     * @param {String} entry - The variable declaration string.
     */
    function parseNameAndCount( qualifier, precision, type, entry ) {
        // determine name and size of variable
        var matches = entry.match( NAME_COUNT_REGEXP );
        var name = matches[1];
        var count = ( matches[2] === undefined ) ? 1 : parseInt( matches[2], 10 );
        return {
            qualifier: qualifier,
            precision: precision,
            type: type,
            name: name,
            count: count
        };
    }

    /**
     * Parses a single 'statement'. A 'statement' is considered any sequence of
     * characters followed by a semi-colon. Therefore, a single 'statement' in
     * this sense could contain several comma separated declarations. Returns
     * all resulting declarations.
     *
     * @param {String} statement - The statement to parse.
     * @param {Object} precisions - The current state of global precisions.
     *
     * @returns {Array} The array of parsed declaration objects.
     */
    function parseStatement( statement, precisions ) {
        // split statement on commas
        //
        // [ 'uniform highp mat4 A[10]', 'B', 'C[2]' ]
        //
        var commaSplit = statement.split(',').map( function( elem ) {
            return elem.trim();
        });

        // split declaration header from statement
        //
        // [ 'uniform', 'highp', 'mat4', 'A[10]' ]
        //
        var header = commaSplit.shift().split(' ');

        // qualifier is always first element
        //
        // 'uniform'
        //
        var qualifier = header.shift();

        // precision may or may not be declared
        //
        // 'highp' || (if it was omited) 'mat4'
        //
        var precision = header.shift();
        var type;
        // if not a precision keyword it is the type instead
        if ( !PRECISION_QUALIFIERS[ precision ] ) {
            type = precision;
            precision = precisions[ PRECISION_TYPES[ type ] ];
        } else {
            type = header.shift();
        }

        // last part of header will be the first, and possible only variable name
        //
        // [ 'A[10]', 'B', 'C[2]' ]
        //
        var names = header.concat( commaSplit );
        // if there are other names after a ',' add them as well
        var results = [];
        names.forEach( function( name ) {
            results.push( parseNameAndCount( qualifier, precision, type, name ) );
        });
        return results;
    }

    /**
     * Splits the source string by semi-colons and constructs an array of
     * declaration objects based on the provided qualifier keywords.
     *
     * @param {String} source - The shader source string.
     * @param {String|Array} keywords - The qualifier declaration keywords.
     *
     * @returns {Array} The array of qualifier declaration objects.
     */
    function parseSource( source, keywords ) {
        // remove all comments from source
        var commentlessSource = stripComments( source );
        // normalize all whitespace in the source
        var normalized = normalizeWhitespace( commentlessSource );
        // get individual statements ( any sequence ending in ; )
        var statements = normalized.split(';');
        // build regex for parsing statements with targetted keywords
        var keywordStr = keywords.join('|');
        var keywordRegex = new RegExp( '.*\\b(' + keywordStr + ')\\b.*' );
        // parse and store global precision statements and any declarations
        var precisions = {};
        var matched = [];
        // for each statement
        statements.forEach( function( statement ) {
            // check if precision statement
            //
            // [ 'precision highp float', 'precision', 'highp', 'float' ]
            //
            var pmatch = statement.match( PRECISION_REGEX );
            if ( pmatch ) {
                precisions[ pmatch[3] ] = pmatch[2];
                return;
            }
            // check for keywords
            //
            // [ 'uniform float time' ]
            //
            var kmatch = statement.match( keywordRegex );
            if ( kmatch ) {
                // parse statement and add to array
                matched = matched.concat( parseStatement( kmatch[0], precisions ) );
            }
        });
        return matched;
    }

    /**
     * Filters out duplicate declarations present between shaders.
     *
     * @param {Array} declarations - The array of declarations.
     *
     * @returns {Array} The filtered array of declarations.
     */
    function filterDuplicatesByName( declarations ) {
        // in cases where the same declarations are present in multiple
        // sources, this function will remove duplicates from the results
        var seen = {};
        return declarations.filter( function( declaration ) {
            if ( seen[ declaration.name ] ) {
                return false;
            }
            seen[ declaration.name ] = true;
            return true;
        });
    }

    module.exports = {

        /**
         * Parses the provided GLSL source, and returns all declaration statements
         * that contain the provided qualifier type. This can be used to extract
         * all attributes and uniform names and types from a shader.
         *
         * For example, when provided a 'uniform' qualifiers, the declaration:
         * <pre>
         *     'uniform highp vec3 uSpecularColor;'
         * </pre>
         * Would be parsed to:
         * <pre>
         *     {
         *         qualifier: 'uniform',
         *         type: 'vec3',
         *         name: 'uSpecularColor',
         *         count: 1
         *     }
         * </pre>
         * @param {String|Array} sources - The shader sources.
         * @param {String|Array} qualifiers - The qualifiers to extract.
         *
         * @returns {Array} The array of qualifier declaration statements.
         */
        parseDeclarations: function( sources, qualifiers ) {
            // if no sources or qualifiers are provided, return empty array
            if ( !qualifiers || qualifiers.length === 0 ||
                !sources || sources.length === 0 ) {
                return [];
            }
            sources = ( sources instanceof Array ) ? sources : [ sources ];
            qualifiers = ( qualifiers instanceof Array ) ? qualifiers : [ qualifiers ];
            // parse out targetted declarations
            var declarations = [];
            sources.forEach( function( source ) {
                declarations = declarations.concat( parseSource( source, qualifiers ) );
            });
            // remove duplicates and return
            return filterDuplicatesByName( declarations );
        },

        /**
         * Detects based on the existence of a 'void main() {' statement, if
         * the string is glsl source code.
         *
         * @param {String} str - The input string to test.
         *
         * @returns {boolean} - True if the string is glsl code.
         */
        isGLSL: function( str ) {
            return GLSL_REGEXP.test( str );
        }

    };

}());

},{}],6:[function(require,module,exports){
(function () {

    'use strict';

    var WebGLContext = require('./WebGLContext'),
        Util = require('../util/Util'),
        Stack = require('../util/Stack'),
        _stack = {},
        _boundTexture = null;

    /**
     * If the provided image dimensions are not powers of two, it will redraw
     * the image to the next highest power of two.
     *
     * @param {HTMLImageElement} image - The image object.
     *
     * @returns {HTMLImageElement} The new image object.
     */
    function ensurePowerOfTwo( image ) {
        if ( !Util.isPowerOfTwo( image.width ) ||
            !Util.isPowerOfTwo( image.height ) ) {
            var canvas = document.createElement( 'canvas' );
            canvas.width = Util.nextHighestPowerOfTwo( image.width );
            canvas.height = Util.nextHighestPowerOfTwo( image.height );
            var ctx = canvas.getContext('2d');
            ctx.drawImage(
                image,
                0, 0,
                image.width, image.height,
                0, 0,
                canvas.width, canvas.height );
            return canvas;
        }
        return image;
    }

    /**
     * Binds the texture object to a location and activates the texture unit
     * while caching it to prevent unnecessary rebinds.
     *
     * @param {Texture2D} texture - The Texture2D object to bind.
     * @param {number} location - The texture unit location index.
     */
    function bind( texture, location ) {
        // if this buffer is already bound, exit early
        if ( _boundTexture === texture ) {
            return;
        }
        var gl = texture.gl;
        location = gl[ 'TEXTURE' + location ] || gl.TEXTURE0;
        gl.activeTexture( location );
        gl.bindTexture( gl.TEXTURE_2D, texture.texture );
        _boundTexture = texture;
    }

    /**
     * Unbinds the texture object. Prevents unnecessary unbinding.
     *
     * @param {Texture2D} texture - The Texture2D object to unbind.
     */
    function unbind( texture ) {
        // if no buffer is bound, exit early
        if ( _boundTexture === null ) {
            return;
        }
        var gl = texture.gl;
        gl.bindTexture( gl.TEXTURE_2D, null );
        _boundTexture = null;
    }

    /**
     * Instantiates a Texture2D object.
     * @class Texture2D
     * @classdesc A texture class to represent a 2D texture.
     */
    function Texture2D( spec, callback ) {
        var that = this;
        // default
        spec = spec || {};
        this.gl = WebGLContext.get();
        // create texture object
        this.texture = this.gl.createTexture();
        this.wrap = spec.wrap || 'REPEAT';
        this.filter = spec.filter || 'LINEAR';
        this.invertY = spec.invertY !== undefined ? spec.invertY : true;
        this.mipMap = spec.mipMap !== undefined ? spec.mipMap : true;
        this.preMultiplyAlpha = spec.preMultiplyAlpha !== undefined ? spec.preMultiplyAlpha : true;
        // buffer the texture based on arguments
        if ( spec.image ) {
            // use existing Image object
            this.bufferData( spec.image );
            this.setParameters( this );
        } else if ( spec.url ) {
            // request image source from url
            var image = new Image();
            image.onload = function() {
                that.bufferData( image );
                that.setParameters( that );
                callback( that );
            };
            image.src = spec.url;
        } else {
            // assume this texture will be  rendered to. In this case disable
            // mipmapping, there is no need and it will only introduce very
            // peculiar rendering bugs in which the texture 'transforms' at
            // certain angles / distances to the mipmapped (empty) portions.
            this.mipMap = false;
            // buffer data
            if ( spec.format === 'DEPTH_COMPONENT' ) {
                // depth texture
                var depthTextureExt = WebGLContext.checkExtension( 'WEBGL_depth_texture' );
                if( !depthTextureExt ) {
                    console.warn( 'Cannot create Texture2D of format ' +
                        'gl.DEPTH_COMPONENT as WEBGL_depth_texture is ' +
                        'unsupported by this browser, command ignored' );
                    return;
                }
                // set format
                this.format = spec.format;
                // set type
                if ( !spec.type ) {
                    // default to unsigned int for higher precision
                    this.type = 'UNSIGNED_INT';
                } else if ( spec.type === 'UNSIGNED_SHORT' || spec.type === 'UNSIGNED_INT' ) {
                    // set to accept types
                    this.type = spec.type;
                } else {
                    // error
                    console.warn( 'Depth textures do not support type`' +
                        spec.type + '`, defaulting to `UNSIGNED_INT`.');
                    // default
                    this.type = 'UNSIGNED_INT';
                }
                // always disable mip mapping for depth texture
            } else {
                // other
                this.format = spec.format || 'RGBA';
                this.type = spec.type || 'UNSIGNED_BYTE';
            }
            this.internalFormat = this.format; // webgl requires format === internalFormat
            this.bufferData( spec.data || null, spec.width, spec.height );
            this.setParameters( this );
        }
    }

    /**
     * Binds the texture object and pushes it to the front of the stack.
     * @memberof Texture2D
     *
     * @param {number} location - The texture unit location index.
     *
     * @returns {Texture2D} The texture object, for chaining.
     */
    Texture2D.prototype.push = function( location ) {
        _stack[ location ] = _stack[ location ] || new Stack();
        _stack[ location ].push( this );
        bind( this, location );
        return this;
    };

    /**
     * Unbinds the texture object and binds the texture beneath it on
     * this stack. If there is no underlying texture, unbinds the unit.
     * @memberof Texture2D
     *
     * @param {number} location - The texture unit location index.
     *
     * @returns {Texture2D} The texture object, for chaining.
     */
    Texture2D.prototype.pop = function( location ) {
        var top;
        if ( !_stack[ location ] ) {
            console.warn( 'No texture was bound to texture unit `' + location +
                '`, command ignored.' );
        }
        _stack[ location ].pop();
        top = _stack[ location ].top();
        if ( top ) {
            bind( top, location );
        } else {
            unbind( this );
        }
        return this;
    };

    /**
     * Buffer data into the texture.
     * @memberof Texture2D
     *
     * @param {ImageData|ArrayBufferView|HTMLImageElement} data - The data.
     * @param {number} width - The width of the data.
     * @param {number} height - The height of the data.
     *
     * @returns {Texture2D} The texture object, for chaining.
     */
    Texture2D.prototype.bufferData = function( data, width, height ) {
        var gl = this.gl;
        this.push();
        // invert y if specified
        gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, this.invertY );
        // premultiple alpha if specified
        gl.pixelStorei( gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.preMultiplyAlpha );
        // buffer texture based on type of data
        if ( data instanceof HTMLImageElement ) {
            // set dimensions of original image before resizing
            this.width = data.width;
            this.height = data.height;
            data = ensurePowerOfTwo( data );
            this.image = data;
            gl.texImage2D(
                gl.TEXTURE_2D,
                0, // level
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                data );
        } else {
            this.data = data;
            this.width = width || this.width;
            this.height = height || this.height;
            gl.texImage2D(
                gl.TEXTURE_2D,
                0, // level
                gl[ this.internalFormat ],
                this.width,
                this.height,
                0, // border, must be 0
                gl[ this.format ],
                gl[ this.type ],
                this.data );
        }
        if ( this.mipMap ) {
            gl.generateMipmap( gl.TEXTURE_2D );
        }
        this.pop();
        return this;
    };

    /**
     * Set the texture parameters.
     * @memberof Texture2D
     *
     * @param {Object} parameters - The parameters by name.
     * <pre>
     *     wrap | wrap.s | wrap.t - The wrapping type.
     *     filter | filter.min | filter.mag - The filter type.
     * </pre>
     * @returns {Texture2D} The texture object, for chaining.
     */
    Texture2D.prototype.setParameters = function( parameters ) {
        var gl = this.gl;
        this.push();
        if ( parameters.wrap ) {
            // set wrap parameters
            this.wrap = parameters.wrap;
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_S,
                gl[ this.wrap.s || this.wrap ] );
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_T,
                gl[ this.wrap.t || this.wrap ] );
        }
        if ( parameters.filter ) {
            // set filter parameters
            this.filter = parameters.filter;
            var minFilter = this.filter.min || this.filter;
            if ( this.mipMap ) {
                // append mipmap suffix to min filter
                minFilter += '_MIPMAP_LINEAR';
            }
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_MAG_FILTER,
                gl[ this.filter.mag || this.filter ] );
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_MIN_FILTER,
                gl[ minFilter] );
        }
        this.pop();
        return this;
    };

    /**
     * Resize the texture.
     * @memberof Texture2D
     *
     * @param {number} width - The new width of the texture.
     * @param {number} height - The new height of the texture.
     *
     * @returns {Texture2D} The texture object, for chaining.
     */
    Texture2D.prototype.resize = function( width, height ) {
        if ( this.image ) {
            // there is no need to ever resize a texture that is based
            // of an actual image. That is what sampling is for.
            console.error( 'Cannot resize image based Texture2D' );
            return;
        }
        if ( !width || !height ) {
            console.warn( 'Width or height arguments missing, command ignored.' );
            return;
        }
        this.bufferData( this.data, width, height );
        return this;
    };

    module.exports = Texture2D;

}());

},{"../util/Stack":13,"../util/Util":14,"./WebGLContext":11}],7:[function(require,module,exports){
(function () {

    'use strict';

    var WebGLContext = require('./WebGLContext'),
        Util = require('../util/Util'),
        Stack = require('../util/Stack'),
        FACES = [
            '-x', '+x',
            '-y', '+y',
            '-z', '+z'
        ],
        FACE_TARGETS = {
            '+z': 'TEXTURE_CUBE_MAP_POSITIVE_Z',
            '-z': 'TEXTURE_CUBE_MAP_NEGATIVE_Z',
            '+x': 'TEXTURE_CUBE_MAP_POSITIVE_X',
            '-x': 'TEXTURE_CUBE_MAP_NEGATIVE_X',
            '+y': 'TEXTURE_CUBE_MAP_POSITIVE_Y',
            '-y': 'TEXTURE_CUBE_MAP_NEGATIVE_Y'
        },
        _stack = {},
        _boundTexture = null;

    /**
     * If the provided image dimensions are not powers of two, it will redraw
     * the image to the next highest power of two.
     *
     * @param {HTMLImageElement} image - The image object.
     *
     * @returns {HTMLImageElement} The new image object.
     */
    function ensurePowerOfTwo( image ) {
        if ( !Util.isPowerOfTwo( image.width ) ||
            !Util.isPowerOfTwo( image.height ) ) {
            var canvas = document.createElement( 'canvas' );
            canvas.width = Util.nextHighestPowerOfTwo( image.width );
            canvas.height = Util.nextHighestPowerOfTwo( image.height );
            var ctx = canvas.getContext('2d');
            ctx.drawImage(
                image,
                0, 0,
                image.width, image.height,
                0, 0,
                canvas.width, canvas.height );
            return canvas;
        }
        return image;
    }

    /**
     * Binds the texture object to a location and activates the texture unit
     * while caching it to prevent unnecessary rebinds.
     *
     * @param {TextureCubeMap} texture - The TextureCubeMap object to bind.
     * @param {number} location - The texture unit location index.
     */
    function bind( texture, location ) {
        // if this buffer is already bound, exit early
        if ( _boundTexture === texture ) {
            return;
        }
        var gl = texture.gl;
        location = gl[ 'TEXTURE' + location ] || gl.TEXTURE0;
        gl.activeTexture( location );
        gl.bindTexture( gl.TEXTURE_CUBE_MAP, texture.texture );
        _boundTexture = texture;
    }

    /**
     * Unbinds the texture object. Prevents unnecessary unbinding.
     *
     * @param {TextureCubeMap} texture - The TextureCubeMap object to unbind.
     */
    function unbind( texture ) {
        // if no buffer is bound, exit early
        if ( _boundTexture === null ) {
            return;
        }
        var gl = texture.gl;
        gl.bindTexture( gl.TEXTURE_CUBE_MAP, null );
        _boundTexture = null;
    }

    /**
     * Returns a function to load and buffer a given cube map face.
     *
     * @param {TextureCubeMap} cubeMap - The cube map object.
     * @param {String} url - The url to load the image.
     * @param {String} face - The face identification string.
     *
     * @returns {Function} The resulting function.
     */
    function loadAndBufferImage( cubeMap, url, face ) {
        return function( done ) {
            var image = new Image();
            image.onload = function() {
                // buffer face texture
                cubeMap.bufferFaceData( face, image );
                done();
            };
            image.src = url;
        };
    }

    /**
     * Instantiates a TextureCubeMap object.
     * @class TextureCubeMap
     * @classdesc A texture class to represent a cube map texture.
     */
    function TextureCubeMap( spec, callback ) {
        var that = this,
            face,
            jobs;
        // store gl context
        this.gl = WebGLContext.get();
        this.texture = this.gl.createTexture();
        this.wrap = spec.wrap || 'CLAMP_TO_EDGE';
        this.filter = spec.filter || 'LINEAR';
        this.invertY = spec.invertY !== undefined ? spec.invertY : false;
        // create cube map based on input
        if ( spec.images ) {
            // multiple Image objects
            for ( face in spec.images ) {
                if ( spec.images.hasOwnProperty( face ) ) {
                    // buffer face texture
                    this.bufferFaceData( face, spec.images[ face ] );
                }
            }
            this.setParameters( this );
        } else if ( spec.urls ) {
            // multiple urls
            jobs = {};
            for ( face in spec.urls ) {
                if ( spec.urls.hasOwnProperty( face ) ) {
                    // add job to map
                    jobs[ face ] = loadAndBufferImage(
                        this,
                        spec.urls[ face ],
                        face );
                }
            }
            Util.async( jobs, function() {
                that.setParameters( that );
                callback( that );
            });
        } else {
            // empty cube map
            this.format = spec.format || 'RGBA';
            this.internalFormat = this.format; // webgl requires format === internalFormat
            this.type = spec.type || 'UNSIGNED_BYTE';
            this.mipMap = spec.mipMap !== undefined ? spec.mipMap : false;
            FACES.forEach( function( face ) {
                var data = ( spec.data ? spec.data[face] : spec.data ) || null;
                that.bufferFaceData( face, data, spec.width, spec.height );
            });
            this.setParameters( this );
        }
    }

    /**
     * Binds the texture object and pushes it to the front of the stack.
     * @memberof TextureCubeMap
     *
     * @param {number} location - The texture unit location index.
     *
     * @returns {TextureCubeMap} The texture object, for chaining.
     */
     TextureCubeMap.prototype.push = function( location ) {
        _stack[ location ] = _stack[ location ] || new Stack();
        _stack[ location ].push( this );
        bind( this, location );
        return this;
    };

    /**
     * Unbinds the texture object and binds the texture beneath it on
     * this stack. If there is no underlying texture, unbinds the unit.
     * @memberof TextureCubeMap
     *
     * @param {number} location - The texture unit location index.
     *
     * @returns {TextureCubeMap} The texture object, for chaining.
     */
     TextureCubeMap.prototype.pop = function( location ) {
        var top;
        if ( !_stack[ location ] ) {
            console.log('No texture was bound to texture unit `' + location +
                '`, command ignored.');
        }
        _stack[ location ].pop();
        top = _stack[ location ].top();
        if ( top ) {
            bind( top, location );
        } else {
            unbind( this );
        }
        return this;
    };

    /**
     * Buffer data into the respective cube map face.
     * @memberof TextureCubeMap
     *
     * @param {String} face - The face identification string.
     * @param {ImageData|ArrayBufferView|HTMLImageElement} data - The data.
     * @param {number} width - The width of the data.
     * @param {number} height - The height of the data.
     *
     * @returns {TextureCubeMap} The texture object, for chaining.
     */
    TextureCubeMap.prototype.bufferFaceData = function( face, data, width, height ) {
        var gl = this.gl,
            faceTarget = gl[ FACE_TARGETS[ face ] ];
        if ( !faceTarget ) {
            console.log('Invalid face enumeration `' + face + '` provided, ' +
                'command ignored.');
        }
        // buffer face texture
        this.push();
        if ( data instanceof HTMLImageElement ) {
            this.images = this.images || {};
            this.images[ face ] = ensurePowerOfTwo( data );
            this.filter = 'LINEAR'; // must be linear for mipmapping
            this.mipMap = true;
            gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, this.invertY );
            gl.texImage2D(
                faceTarget,
                0, // level
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                this.images[ face ] );
        } else {
            this.data = this.data || {};
            this.data[ face ] = data;
            this.width = width || this.width;
            this.height = height || this.height;
            gl.texImage2D(
                faceTarget,
                0, // level
                gl[ this.internalFormat ],
                this.width,
                this.height,
                0, // border, must be 0
                gl[ this.format ],
                gl[ this.type ],
                data );
        }
        // only generate mipmaps if all faces are buffered
        this.bufferedFaces = this.bufferedFaces || {};
        this.bufferedFaces[ face ] = true;
        // once all faces are buffered
        if ( this.mipMap &&
            this.bufferedFaces['-x'] && this.bufferedFaces['+x'] &&
            this.bufferedFaces['-y'] && this.bufferedFaces['+y'] &&
            this.bufferedFaces['-z'] && this.bufferedFaces['+z'] ) {
            // generate mipmaps once all faces are buffered
            gl.generateMipmap( gl.TEXTURE_CUBE_MAP );
        }
        this.pop();
        return this;
    };

    /**
     * Set the texture parameters.
     * @memberof TextureCubeMap
     *
     * @param {Object} parameters - The parameters by name.
     * <pre>
     *     wrap | wrap.s | wrap.t - The wrapping type.
     *     filter | filter.min | filter.mag - The filter type.
     * </pre>
     * @returns {TextureCubeMap} The texture object, for chaining.
     */
    TextureCubeMap.prototype.setParameters = function( parameters ) {
        var gl = this.gl;
        this.push();
        if ( parameters.wrap ) {
            // set wrap parameters
            this.wrap = parameters.wrap;
            gl.texParameteri(
                gl.TEXTURE_CUBE_MAP,
                gl.TEXTURE_WRAP_S,
                gl[ this.wrap.s || this.wrap ] );
            gl.texParameteri(
                gl.TEXTURE_CUBE_MAP,
                gl.TEXTURE_WRAP_T,
                gl[ this.wrap.t || this.wrap ] );
            /* not supported in webgl 1.0
            gl.texParameteri(
                gl.TEXTURE_CUBE_MAP,
                gl.TEXTURE_WRAP_R,
                gl[ this.wrap.r || this.wrap ] );
            */
        }
        if ( parameters.filter ) {
            // set filter parameters
            this.filter = parameters.filter;
            var minFilter = this.filter.min || this.filter;
            if ( this.minMap ) {
                // append min mpa suffix to min filter
                minFilter += '_MIPMAP_LINEAR';
            }
            gl.texParameteri(
                gl.TEXTURE_CUBE_MAP,
                gl.TEXTURE_MAG_FILTER,
                gl[ this.filter.mag || this.filter ] );
            gl.texParameteri(
                gl.TEXTURE_CUBE_MAP,
                gl.TEXTURE_MIN_FILTER,
                gl[ minFilter] );
        }
        this.pop();
        return this;
    };

    module.exports = TextureCubeMap;

}());

},{"../util/Stack":13,"../util/Util":14,"./WebGLContext":11}],8:[function(require,module,exports){
(function () {

    'use strict';

    var WebGLContext = require('./WebGLContext'),
        VertexPackage = require('./VertexPackage'),
        Util = require('../util/Util'),
        _boundBuffer = null,
        _enabledAttributes = null;

    function getStride( attributePointers ) {
        var BYTES_PER_COMPONENT = 4;
        var maxOffset = 0;
        var stride = 0;
        Object.keys( attributePointers ).forEach( function( key ) {
            // track the largest offset to determine the stride of the buffer
            var pointer = attributePointers[ key ];
            var offset = pointer.offset;
            if ( offset > maxOffset ) {
                maxOffset = offset;
                stride = offset + ( pointer.size * BYTES_PER_COMPONENT );
            }
        });
        return stride;
    }

    function getAttributePointers( attributePointers ) {
        // ensure there are pointers provided
        if ( !attributePointers || Object.keys( attributePointers ).length === 0 ) {
            console.warning( 'VertexBuffer requires attribute pointers to be ' +
                'specified upon instantiation, this buffer will not draw correctly.' );
            return {};
        }
        // parse pointers to ensure they are valid
        var pointers = {};
        Object.keys( attributePointers ).forEach( function( key ) {
            var index = parseInt( key, 10 );
            // check that key is an valid integer
            if ( isNaN( index ) ) {
                console.warn('Attribute index `' + key + '` does not represent an integer, discarding attribute pointer.');
                return;
            }
            var pointer = attributePointers[key];
            var size = pointer.size;
            var type = pointer.type;
            var offset = pointer.offset;
            // check size
            if ( !size || size < 1 || size > 4 ) {
                console.warn('Attribute pointer `size` parameter is invalid, ' +
                    'defaulting to 4.');
                size = 4;
            }
            // check type
            if ( !type || type !== 'FLOAT' ) {
                console.warn('Attribute pointer `type` parameter is invalid, ' +
                    'defaulting to `FLOAT`.');
                type = 'FLOAT';
            }
            pointers[ index ] = {
                size: size,
                type: type,
                offset: ( offset !== undefined ) ? offset : 0
            };
        });
        return pointers;
    }

    function getNumComponents(pointers) {
        var size = 0;
        var index;
        for ( index in pointers ) {
            if ( pointers.hasOwnProperty( index ) ) {
                size += pointers[ index ].size;
            }
        }
        return size;
    }

    function VertexBuffer( arg, attributePointers, options ) {
        options = options || {};
        this.buffer = 0;
        this.gl = WebGLContext.get();
        // first, set the attribute pointers
        if ( arg instanceof VertexPackage ) {
            // VertexPackage argument, use its attribute pointers
            this.pointers = arg.attributePointers();
            // shift options arg since there will be no attrib pointers arg
            options = attributePointers || {};
        } else {
            this.pointers = getAttributePointers( attributePointers );
        }
        // then buffer the data
        if ( arg ) {
            if ( arg instanceof VertexPackage ) {
                // VertexPackage argument
                this.bufferData( arg.buffer() );
            } else if ( arg instanceof WebGLBuffer ) {
                // WebGLBuffer argument
                this.buffer = arg;
                this.count = ( options.count !== undefined ) ? options.count : 0;
            } else {
                // Array or ArrayBuffer or number argument
                this.bufferData( arg );
            }
        }
        // set stride
        this.stride = getStride( this.pointers );
        // set draw offset and mode
        this.offset = ( options.offset !== undefined ) ? options.offset : 0;
        this.mode = ( options.mode !== undefined ) ? options.mode : 'TRIANGLES';
    }

    VertexBuffer.prototype.bufferData = function( arg ) {
        var gl = this.gl;
        if ( arg instanceof Array ) {
            // cast arrays into bufferview
            arg = new Float32Array( arg );
        } else if ( !Util.isTypedArray( arg ) && typeof arg !== 'number' ) {
            console.error( 'VertexBuffer requires an Array or ArrayBuffer, ' +
                'or a size argument, command ignored.' );
            return;
        }
        if ( !this.buffer ) {
            this.buffer = gl.createBuffer();
        }
        // get the total number of attribute components from pointers
        var numComponents = getNumComponents(this.pointers);
        // set count based on size of buffer and number of components
        if (typeof arg === 'number') {
            this.count = arg / numComponents;
        } else {
            this.count = arg.length / numComponents;
        }
        gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
        gl.bufferData( gl.ARRAY_BUFFER, arg, gl.STATIC_DRAW );
    };

    VertexBuffer.prototype.bufferSubData = function( array, offset ) {
        var gl = this.gl;
        if ( !this.buffer ) {
            console.error( 'VertexBuffer has not been initially buffered, ' +
                'command ignored.' );
            return;
        }
        if ( array instanceof Array ) {
            array = new Float32Array( array );
        } else if ( !Util.isTypedArray( array ) ) {
            console.error( 'VertexBuffer requires an Array or ArrayBuffer ' +
                'argument, command ignored.' );
            return;
        }
        offset = ( offset !== undefined ) ? offset : 0;
        gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
        gl.bufferSubData( gl.ARRAY_BUFFER, offset, array );
    };

    VertexBuffer.prototype.bind = function() {
        // if this buffer is already bound, exit early
        if ( _boundBuffer === this ) {
            return;
        }
        var gl = this.gl,
            pointers = this.pointers,
            previouslyEnabledAttributes = _enabledAttributes || {},
            pointer,
            index;
        // cache this vertex buffer
        _boundBuffer = this;
        _enabledAttributes = {};
        // bind buffer
        gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
        for ( index in pointers ) {
            if ( pointers.hasOwnProperty( index ) ) {
                pointer = this.pointers[ index ];
                // set attribute pointer
                gl.vertexAttribPointer( index,
                    pointer.size,
                    gl[ pointer.type ],
                    false,
                    this.stride,
                    pointer.offset );
                // enabled attribute array
                gl.enableVertexAttribArray( index );
                // cache attribute
                _enabledAttributes[ index ] = true;
                // remove from previous list
                delete previouslyEnabledAttributes[ index ];
            }
        }
        // ensure leaked attribute arrays are disabled
        for ( index in previouslyEnabledAttributes ) {
            if ( previouslyEnabledAttributes.hasOwnProperty( index ) ) {
                gl.disableVertexAttribArray( index );
            }
        }
    };

    VertexBuffer.prototype.draw = function( options ) {
        options = options || {};
        if ( _boundBuffer === null ) {
            console.warn( 'No VertexBuffer is bound, command ignored.' );
            return;
        }
        var gl = this.gl;
        var mode = gl[ options.mode || this.mode || 'TRIANGLES' ];
        var offset = ( options.offset !== undefined ) ? options.offset : this.offset;
        var count = ( options.count !== undefined ) ? options.count : this.count;
        gl.drawArrays(
            mode, // primitive type
            offset, // offset
            count ); // count
    };

    VertexBuffer.prototype.unbind = function() {
        // if no buffer is bound, exit early
        if ( _boundBuffer === null ) {
            return;
        }
        var gl = this.gl,
            pointers = this.pointers,
            index;
        for ( index in pointers ) {
            if ( pointers.hasOwnProperty( index ) ) {
                gl.disableVertexAttribArray( index );
            }
        }
        gl.bindBuffer( gl.ARRAY_BUFFER, null );
        _boundBuffer = null;
        _enabledAttributes = {};
    };

    module.exports = VertexBuffer;

}());

},{"../util/Util":14,"./VertexPackage":9,"./WebGLContext":11}],9:[function(require,module,exports){
(function () {

    'use strict';

    var COMPONENT_TYPE = 'FLOAT';
    var BYTES_PER_COMPONENT = 4;

    /**
     * Removes invalid attribute arguments. A valid argument
     * must be an Array of length > 0 key by a string representing an int.
     *
     * @param {Object} attributes - The map of vertex attributes.
     *
     * @returns {Array} The valid array of arguments.
     */
    function parseAttributeMap( attributes ) {
        var goodAttributes = [];
        Object.keys( attributes ).forEach( function( key ) {
            var index = parseInt( key, 10 );
            // check that key is an valid integer
            if ( isNaN( index ) ) {
                console.warn('Attribute index `' + key + '` does not ' +
                    'represent an integer, discarding attribute pointer.');
                return;
            }
            var vertices = attributes[key];
            // ensure attribute is valid
            if ( vertices &&
                vertices instanceof Array &&
                vertices.length > 0 ) {
                // add attribute data and index
                goodAttributes.push({
                    index: index,
                    data: vertices
                });
            } else {
                console.warn( 'Error parsing attribute of index `' + key +
                    '`, attribute discarded.' );
            }
        });
        // sort attributes ascending by index
        goodAttributes.sort(function(a,b) {
            return a.index - b.index;
        });
        return goodAttributes;
    }

    /**
     * Returns a component's byte size.
     *
     * @param {Object|Array} component - The component to measure.
     *
     * @returns {integer} The byte size of the component.
     */
    function getComponentSize( component ) {
        // check if vector
        if ( component.x !== undefined ) {
            // 1 component vector
            if ( component.y !== undefined ) {
                // 2 component vector
                if ( component.z !== undefined ) {
                    // 3 component vector
                    if ( component.w !== undefined ) {
                        // 4 component vector
                        return 4;
                    }
                    return 3;
                }
                return 2;
            }
            return 1;
        }
        // check if array
        if ( component instanceof Array ) {
            return component.length;
        }
        return 1;
    }

    /**
     * Calculates the type, size, and offset for each attribute in the
     * attribute array along with the length and stride of the package.
     *
     * @param {VertexPackage} vertexPackage - The VertexPackage object.
     * @param {Array} attributes - The array of vertex attributes.
     */
    function setPointersAndStride( vertexPackage, attributes ) {
        var shortestArray = Number.MAX_VALUE;
        var offset = 0;
        // clear pointers
        vertexPackage.pointers = {};
        // for each attribute
        attributes.forEach( function( vertices ) {
            // set size to number of components in the attribute
            var size = getComponentSize( vertices.data[0] );
            // length of the package will be the shortest attribute array length
            shortestArray = Math.min( shortestArray, vertices.data.length );
            // store pointer under index
            vertexPackage.pointers[ vertices.index ] = {
                type : COMPONENT_TYPE,
                size : size,
                offset : offset * BYTES_PER_COMPONENT
            };
            // accumulate attribute offset
            offset += size;
        });
        // set stride to total offset
        vertexPackage.stride = offset * BYTES_PER_COMPONENT;
        // set length of package to the shortest attribute array length
        vertexPackage.length = shortestArray;
    }

    function VertexPackage( attributes ) {
        if ( attributes !== undefined ) {
            return this.set( attributes );
        } else {
            this.data = new Float32Array(0);
            this.pointers = {};
        }
    }

    VertexPackage.prototype.set = function( attributeMap ) {
        var that = this;
        // remove bad attributes
        var attributes = parseAttributeMap( attributeMap );
        // set attribute pointers and stride
        setPointersAndStride( this, attributes );
        // set size of data vector
        this.data = new Float32Array( this.length * ( this.stride / BYTES_PER_COMPONENT ) );
        // for each vertex attribute array
        attributes.forEach( function( vertices ) {
            // get the pointer
            var pointer = that.pointers[ vertices.index ];
            // get the pointers offset
            var offset = pointer.offset / BYTES_PER_COMPONENT;
            // get the package stride
            var stride = that.stride / BYTES_PER_COMPONENT;
            // for each vertex
            var vertex, i, j;
            for ( i=0; i<that.length; i++ ) {
                vertex = vertices.data[i];
                // get the index in the buffer to the particular vertex
                j = offset + ( stride * i );
                switch ( pointer.size ) {
                    case 2:
                        that.data[j] = ( vertex.x !== undefined ) ? vertex.x : vertex[0];
                        that.data[j+1] = ( vertex.y !== undefined ) ? vertex.y : vertex[1];
                        break;
                    case 3:
                        that.data[j] = ( vertex.x !== undefined ) ? vertex.x : vertex[0];
                        that.data[j+1] = ( vertex.y !== undefined ) ? vertex.y : vertex[1];
                        that.data[j+2] = ( vertex.z !== undefined ) ? vertex.z : vertex[2];
                        break;
                    case 4:
                        that.data[j] = ( vertex.x !== undefined ) ? vertex.x : vertex[0];
                        that.data[j+1] = ( vertex.y !== undefined ) ? vertex.y : vertex[1];
                        that.data[j+2] = ( vertex.z !== undefined ) ? vertex.z : vertex[2];
                        that.data[j+3] = ( vertex.w !== undefined ) ? vertex.w : vertex[3];
                        break;
                    default:
                        if ( vertex.x !== undefined ) {
                            that.data[j] = vertex.x;
                        } else if ( vertex[0] !== undefined ) {
                            that.data[j] = vertex[0];
                        } else {
                            that.data[j] = vertex;
                        }
                        break;
                }
            }
        });
        return this;
    };

    VertexPackage.prototype.buffer = function() {
        return this.data;
    };

    VertexPackage.prototype.attributePointers = function() {
        return this.pointers;
    };

    module.exports = VertexPackage;

}());

},{}],10:[function(require,module,exports){
(function() {

    'use strict';

    var WebGLContext = require('./WebGLContext'),
        Stack = require('../util/Stack'),
        _stack = new Stack();

    function set( viewport, x, y, width, height ) {
        var gl = viewport.gl;
        x = ( x !== undefined ) ? x : viewport.x;
        y = ( y !== undefined ) ? y : viewport.y;
        width = ( width !== undefined ) ? width : viewport.width;
        height = ( height !== undefined ) ? height : viewport.height;
        gl.viewport( x, y, width, height );
    }

    function Viewport( spec ) {
        spec = spec || {};
        this.gl = WebGLContext.get();
        // set size
        this.resize(
            spec.width || this.gl.canvas.width,
            spec.height || this.gl.canvas.height );
        // set offset
        this.offset(
            spec.x !== undefined ? spec.x : 0,
            spec.y !== undefined ? spec.y : 0);
    }

    /**
     * Updates the viewport objects width and height.
     * @memberof Viewport
     *
     * @returns {Viewport} The viewport object, for chaining.
     */
    Viewport.prototype.resize = function( width, height ) {
        if ( width !== undefined && height !== undefined ) {
            this.width = width;
            this.height = height;
            this.gl.canvas.width = width + this.x;
            this.gl.canvas.height = height + this.y;
        }
        return this;
    };

    /**
     * Updates the viewport objects x and y offsets.
     * @memberof Viewport
     *
     * @returns {Viewport} The viewport object, for chaining.
     */
    Viewport.prototype.offset = function( x, y ) {
        if ( x !== undefined && y !== undefined ) {
            this.x = x;
            this.y = y;
            this.gl.canvas.width = this.width + x;
            this.gl.canvas.height = this.height + y;
        }
        return this;
    };

    /**
     * Sets the viewport object and pushes it to the front of the stack.
     * @memberof Viewport
     *
     * @returns {Viewport} The viewport object, for chaining.
     */
     Viewport.prototype.push = function( x, y, width, height ) {
        _stack.push({
            viewport: this,
            x: x,
            y: y,
            width: width,
            height: height
        });
        set( this, x, y, width, height );
        return this;
    };

    /**
     * Pops current the viewport object and sets the viewport beneath it.
     * @memberof Viewport
     *
     * @returns {Viewport} The viewport object, for chaining.
     */
     Viewport.prototype.pop = function() {
        var top;
        _stack.pop();
        top = _stack.top();
        if ( top ) {
            set( top.viewport, top.x, top.y, top.width, top.height );
        } else {
            set( this );
        }
        return this;
    };

    module.exports = Viewport;

}());

},{"../util/Stack":13,"./WebGLContext":11}],11:[function(require,module,exports){
(function() {

    'use strict';

    var _boundContext = null,
        _contextsById = {},
        EXTENSIONS = [
            // ratified
            'OES_texture_float',
            'OES_texture_half_float',
            'WEBGL_lose_context',
            'OES_standard_derivatives',
            'OES_vertex_array_object',
            'WEBGL_debug_renderer_info',
            'WEBGL_debug_shaders',
            'WEBGL_compressed_texture_s3tc',
            'WEBGL_depth_texture',
            'OES_element_index_uint',
            'EXT_texture_filter_anisotropic',
            'WEBGL_draw_buffers',
            'ANGLE_instanced_arrays',
            'OES_texture_float_linear',
            'OES_texture_half_float_linear',
            // community
            'WEBGL_compressed_texture_atc',
            'WEBGL_compressed_texture_pvrtc',
            'EXT_color_buffer_half_float',
            'WEBGL_color_buffer_float',
            'EXT_frag_depth',
            'EXT_sRGB',
            'WEBGL_compressed_texture_etc1',
            'EXT_blend_minmax',
            'EXT_shader_texture_lod'
        ];

    /**
     * Returns a Canvas element object from either an existing object, or
     * identification string.
     *
     * @param {HTMLCanvasElement|String} arg - The Canvas
     *     object or Canvas identification string.
     *
     * @returns {HTMLCanvasElement} The Canvas element object.
     */
    function getCanvas( arg ) {
        if ( arg instanceof HTMLImageElement ||
             arg instanceof HTMLCanvasElement ) {
            return arg;
        } else if ( typeof arg === 'string' ) {
            return document.getElementById( arg );
        }
        return null;
    }

    /**
     * Attempts to retreive a wrapped WebGLRenderingContext.
     *
     * @param {HTMLCanvasElement} The Canvas element object to create the context under.
     *
     * @returns {Object} The context wrapper.
     */
    function getContextWrapper( arg ) {
        if ( !arg ) {
            if ( _boundContext ) {
                // return last bound context
                return _boundContext;
            }
        } else {
            var canvas = getCanvas( arg );
            if ( canvas ) {
                return _contextsById[ canvas.id ];
            }
        }
        // no bound context or argument
        return null;
    }

    /**
     * Attempts to load all known extensions for a provided
     * WebGLRenderingContext. Stores the results in the context wrapper for
     * later queries.
     *
     * @param {Object} contextWrapper - The context wrapper.
     */
    function loadExtensions( contextWrapper ) {
        var gl = contextWrapper.gl,
            extension,
            i;
        for ( i=0; i<EXTENSIONS.length; i++ ) {
            extension = EXTENSIONS[i];
            contextWrapper.extensions[ extension ] = gl.getExtension( extension );
        }
    }

    /**
     * Attempts to create a WebGLRenderingContext wrapped inside an object which
     * will also store the extension query results.
     *
     * @param {HTMLCanvasElement} The Canvas element object to create the context under.
     * @param {Object}} options - Parameters to the webgl context, only used during instantiation. Optional.
     *
     * @returns {Object} The context wrapper.
     */
    function createContextWrapper( canvas, options ) {
        var contextWrapper,
            gl;
        try {
            // get WebGL context, fallback to experimental
            gl = canvas.getContext( 'webgl', options ) || canvas.getContext( 'experimental-webgl', options );
            // wrap context
            contextWrapper = {
                id: canvas.id,
                gl: gl,
                extensions: {}
            };
            // load WebGL extensions
            loadExtensions( contextWrapper );
            // add context wrapper to map
            _contextsById[ canvas.id ] = contextWrapper;
            // bind the context
            _boundContext = contextWrapper;
        } catch( err ) {
            console.error( err.message );
        }
        if ( !gl ) {
            console.error( 'Unable to initialize WebGL. Your browser may not ' +
                'support it.' );
        }
        return contextWrapper;
    }

    module.exports = {

        /**
         * Binds a specific WebGL context as the active context. This context
         * will be used for all code /webgl.
         *
         * @param {HTMLCanvasElement|String} arg - The Canvas object or Canvas identification string.
         *
         * @returns {WebGLContext} This namespace, used for chaining.
         */
        bind: function( arg ) {
            var wrapper = getContextWrapper( arg );
            if ( wrapper ) {
                _boundContext = wrapper;
                return this;
            }
            console.error( 'No context exists for provided argument `' + arg +
                '`, command ignored.' );
            return this;
        },

        /**
         * Creates a new or retreives an existing WebGL context for a provided
         * canvas object. During creation attempts to load all extensions found
         * at: https://www.khronos.org/registry/webgl/extensions/. If no
         * argument is provided it will attempt to return the currently bound
         * context. If no context is bound, it will return 'null'.
         *
         * @param {HTMLCanvasElement|String} arg - The Canvas object or Canvas identification string. Optional.
         * @param {Object}} options - Parameters to the webgl context, only used during instantiation. Optional.
         *
         * @returns {WebGLRenderingContext} The WebGLRenderingContext context object.
         */
        get: function( arg, options ) {
            var wrapper = getContextWrapper( arg );
            if ( wrapper ) {
                // return the native WebGLRenderingContext
                return wrapper.gl;
            }
            // get canvas element
            var canvas = getCanvas( arg );
            // try to find or create context
            if ( !canvas || !createContextWrapper( canvas, options ) ) {
                console.error( 'Context could not be found or created for ' +
                    'argument of type`' + ( typeof arg ) + '`, returning `null`.' );
                return null;
            }
            // return context
            return _contextsById[ canvas.id ].gl;
        },

        /**
         * Returns an array of all supported extensions for the provided canvas
         * object. If no argument is provided it will attempt to query the
         * currently bound context. If no context is bound, it will return
         * an empty array.
         *
         * @param {HTMLCanvasElement|String} arg - The Canvas object or Canvas identification string. Optional.
         *
         * @returns {Array} All supported extensions.
         */
        supportedExtensions: function( arg ) {
            var wrapper = getContextWrapper( arg );
            if ( wrapper ) {
                var extensions = wrapper.extensions;
                var supported = [];
                for ( var key in extensions ) {
                    if ( extensions.hasOwnProperty( key ) && extensions[ key ] ) {
                        supported.push( key );
                    }
                }
                return supported;
            }
            console.error('No context is currently bound or was provided, ' +
                'returning an empty array.');
            return [];
        },

        /**
         * Returns an array of all unsupported extensions for the provided canvas
         * object. If no argument is provided it will attempt to query the
         * currently bound context. If no context is bound, it will return
         * an empty array.
         *
         * @param {HTMLCanvasElement|String} arg - The Canvas object or Canvas identification string. Optional.
         *
         * @returns {Array} All unsupported extensions.
         */
        unsupportedExtensions: function( arg ) {
            var wrapper = getContextWrapper( arg );
            if ( wrapper ) {
                var extensions = wrapper.extensions;
                var unsupported = [];
                for ( var key in extensions ) {
                    if ( extensions.hasOwnProperty( key ) && !extensions[ key ] ) {
                        unsupported.push( key );
                    }
                }
                return unsupported;
            }
            console.error('No context is currently bound or was provided, ' +
                'returning an empty array.');
            return [];
        },

        /**
         * Checks if an extension has been successfully loaded by the provided
         * canvas object. If no argument is provided it will attempt to return
         * the currently bound context. If no context is bound, it will return
         * 'false'.
         *
         * @param {HTMLCanvasElement|String} arg - The Canvas object or Canvas identification string. Optional.
         * @param {String} extension - The extension name.
         *
         * @returns {boolean} Whether or not the provided extension has been loaded successfully.
         */
        checkExtension: function( arg, extension ) {
            if ( !extension ) {
                // shift parameters if no canvas arg is provided
                extension = arg;
                arg = null;
            }
            var wrapper = getContextWrapper( arg );
            if ( wrapper ) {
                var extensions = wrapper.extensions;
                return extensions[ extension ] ? extensions[ extension ] : false;
            }
            console.error('No context is currently bound or provided as ' +
                'argument, returning false.');
            return false;
        }
    };

}());

},{}],12:[function(require,module,exports){
(function () {

    'use strict';

    module.exports = {
        IndexBuffer: require('./core/IndexBuffer'),
        Renderable: require('./core/Renderable'),
        RenderTarget: require('./core/RenderTarget'),
        Shader: require('./core/Shader'),
        Texture2D: require('./core/Texture2D'),
        TextureCubeMap: require('./core/TextureCubeMap'),
        VertexBuffer: require('./core/VertexBuffer'),
        VertexPackage: require('./core/VertexPackage'),
        Viewport: require('./core/Viewport'),
        WebGLContext: require('./core/WebGLContext')
    };

}());

},{"./core/IndexBuffer":1,"./core/RenderTarget":2,"./core/Renderable":3,"./core/Shader":4,"./core/Texture2D":6,"./core/TextureCubeMap":7,"./core/VertexBuffer":8,"./core/VertexPackage":9,"./core/Viewport":10,"./core/WebGLContext":11}],13:[function(require,module,exports){
(function () {

    'use strict';

    function Stack() {
        this.data = [];
    }

    Stack.prototype.push = function( value ) {
        this.data.push( value );
        return this;
    };

    Stack.prototype.pop = function() {
        this.data.pop();
        return this;
    };

    Stack.prototype.top = function() {
        var index = this.data.length - 1;
        if ( index < 0 ) {
            return null;
        }
        return this.data[ index ];
    };

    module.exports = Stack;

}());

},{}],14:[function(require,module,exports){
(function () {

    'use strict';

    var simplyDeferred = require('simply-deferred'),
        Deferred = simplyDeferred.Deferred,
        when = simplyDeferred.when;

    /**
     * Returns a function that resolves the provided deferred.
     *
     * @param {Deferred} deferred - The deferred object.
     *
     * @returns {Function} The function to resolve the deferred.
     */
    function resolveDeferred( deferred ) {
        return function( result ) {
            deferred.resolve( result );
        };
    }

    /**
     * Dispatches an array of jobs, accumulating the results and
     * passing them to the callback function in corresponding indices.
     *
     * @param {Array} jobs - The job array.
     * @param {Function} callback - The callback function.
     */
     function asyncArray( jobs, callback ) {
        var deferreds = [],
            deferred,
            i;
        for ( i=0; i<jobs.length; i++ ) {
            deferred = new Deferred();
            deferreds.push( deferred );
            jobs[i]( resolveDeferred( deferred ) );
        }
        when.apply( when, deferreds ).then( function() {
            var results = Array.prototype.slice.call( arguments, 0 );
            callback( results );
        });
    }

    /**
     * Dispatches a map of jobs, accumulating the results and
     * passing them to the callback function under corresponding
     * keys.
     *
     * @param {Object} jobs - The job map.
     * @param {Function} callback - The callback function.
     */
     function asyncObj( jobs, callback ) {
        var jobsByIndex = [],
            deferreds = [],
            deferred,
            key;
        for ( key in jobs ) {
            if ( jobs.hasOwnProperty( key ) ) {
                deferred = new Deferred();
                deferreds.push( deferred );
                jobsByIndex.push( key );
                jobs[ key ]( resolveDeferred( deferred ) );
            }
        }
        when.apply( when, deferreds ).done( function() {
            var results = Array.prototype.slice.call( arguments, 0 ),
                resultsByKey = {},
                i;
            for ( i=0; i<jobsByIndex.length; i++ ) {
                resultsByKey[ jobsByIndex[i] ] = results[i];
            }
            callback( resultsByKey );
        });
    }

    module.exports = {

        /**
         * Execute a set of functions asynchronously, once all have been
         * completed, execute the provided callback function. Jobs may be passed
         * as an array or object. The callback function will be passed the
         * results in the same format as the jobs. All jobs must have accept and
         * execute a callback function upon completion.
         *
         * @param {Array|Object} jobs - The set of functions to execute.
         * @param {Function} callback - The callback function to be executed upon completion.
         */
        async: function( jobs, callback ) {
            if ( jobs instanceof Array ) {
                asyncArray( jobs, callback );
            } else {
                asyncObj( jobs, callback );
            }
        },

        /**
         * Returns true if a provided array is a javscript TypedArray.
         *
         * @param {*} array - The variable to test.
         *
         * @returns {boolean} - Whether or not the variable is a TypedArray.
         */
        isTypedArray: function( array ) {
            return array &&
                array.buffer instanceof ArrayBuffer &&
                array.byteLength !== undefined;
        },

        /**
         * Returns true if the provided integer is a power of two.
         *
         * @param {integer} num - The number to test.
         *
         * @returns {boolean} - Whether or not the number is a power of two.
         */
        isPowerOfTwo: function( num ) {
            return ( num !== 0 ) ? ( num & ( num - 1 ) ) === 0 : false;
        },

        /**
         * Returns the next highest power of two for a number.
         *
         * Ex.
         *
         *     200 -> 256
         *     256 -> 256
         *     257 -> 512
         *
         * @param {integer} num - The number to modify.
         *
         * @returns {integer} - Next highest power of two.
         */
        nextHighestPowerOfTwo: function( num ) {
            var i;
            if ( num !== 0 ) {
                num = num-1;
            }
            for ( i=1; i<32; i<<=1 ) {
                num = num | num >> i;
            }
            return num + 1;
        }
    };

}());

},{"simply-deferred":20}],15:[function(require,module,exports){
(function() {

    'use strict';

    module.exports = {

        /**
         * Sends an XMLHttpRequest GET request to the supplied url.
         *
         * @param {String} url - The URL for the resource.
         * @param {Object} options - Contains the following options:
         * <pre>
         *     {
         *         {String} success - The success callback function.
         *         {String} error - The error callback function.
         *         {String} progress - The progress callback function.
         *         {String} responseType - The responseType of the XHR.
         *     }
         * </pre>
         */
        load: function ( url, options ) {
            var request = new XMLHttpRequest();
            request.open( 'GET', url, true );
            request.responseType = options.responseType;
            request.addEventListener( 'load', function () {
                if ( options.success ) {
                    options.success( this.response );
                }
            });
            if ( options.progress ) {
                request.addEventListener( 'progress', function ( event ) {
                    options.progress( event );
                });
            }
            if ( options.error ) {
                request.addEventListener( 'error', function ( event ) {
                    options.error( event );
                });
            }
            request.send();
        }
    };

}());

},{}],16:[function(require,module,exports){
var json = typeof JSON !== 'undefined' ? JSON : require('jsonify');

module.exports = function (obj, opts) {
    if (!opts) opts = {};
    if (typeof opts === 'function') opts = { cmp: opts };
    var space = opts.space || '';
    if (typeof space === 'number') space = Array(space+1).join(' ');
    var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;
    var replacer = opts.replacer || function(key, value) { return value; };

    var cmp = opts.cmp && (function (f) {
        return function (node) {
            return function (a, b) {
                var aobj = { key: a, value: node[a] };
                var bobj = { key: b, value: node[b] };
                return f(aobj, bobj);
            };
        };
    })(opts.cmp);

    var seen = [];
    return (function stringify (parent, key, node, level) {
        var indent = space ? ('\n' + new Array(level + 1).join(space)) : '';
        var colonSeparator = space ? ': ' : ':';

        if (node && node.toJSON && typeof node.toJSON === 'function') {
            node = node.toJSON();
        }

        node = replacer.call(parent, key, node);

        if (node === undefined) {
            return;
        }
        if (typeof node !== 'object' || node === null) {
            return json.stringify(node);
        }
        if (isArray(node)) {
            var out = [];
            for (var i = 0; i < node.length; i++) {
                var item = stringify(node, i, node[i], level+1) || json.stringify(null);
                out.push(indent + space + item);
            }
            return '[' + out.join(',') + indent + ']';
        }
        else {
            if (seen.indexOf(node) !== -1) {
                if (cycles) return json.stringify('__cycle__');
                throw new TypeError('Converting circular structure to JSON');
            }
            else seen.push(node);

            var keys = objectKeys(node).sort(cmp && cmp(node));
            var out = [];
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var value = stringify(node, key, node[key], level+1);

                if(!value) continue;

                var keyValue = json.stringify(key)
                    + colonSeparator
                    + value;
                ;
                out.push(indent + space + keyValue);
            }
            seen.splice(seen.indexOf(node), 1);
            return '{' + out.join(',') + indent + '}';
        }
    })({ '': obj }, '', obj, 0);
};

var isArray = Array.isArray || function (x) {
    return {}.toString.call(x) === '[object Array]';
};

var objectKeys = Object.keys || function (obj) {
    var has = Object.prototype.hasOwnProperty || function () { return true };
    var keys = [];
    for (var key in obj) {
        if (has.call(obj, key)) keys.push(key);
    }
    return keys;
};

},{"jsonify":17}],17:[function(require,module,exports){
exports.parse = require('./lib/parse');
exports.stringify = require('./lib/stringify');

},{"./lib/parse":18,"./lib/stringify":19}],18:[function(require,module,exports){
var at, // The index of the current character
    ch, // The current character
    escapee = {
        '"':  '"',
        '\\': '\\',
        '/':  '/',
        b:    '\b',
        f:    '\f',
        n:    '\n',
        r:    '\r',
        t:    '\t'
    },
    text,

    error = function (m) {
        // Call error when something is wrong.
        throw {
            name:    'SyntaxError',
            message: m,
            at:      at,
            text:    text
        };
    },
    
    next = function (c) {
        // If a c parameter is provided, verify that it matches the current character.
        if (c && c !== ch) {
            error("Expected '" + c + "' instead of '" + ch + "'");
        }
        
        // Get the next character. When there are no more characters,
        // return the empty string.
        
        ch = text.charAt(at);
        at += 1;
        return ch;
    },
    
    number = function () {
        // Parse a number value.
        var number,
            string = '';
        
        if (ch === '-') {
            string = '-';
            next('-');
        }
        while (ch >= '0' && ch <= '9') {
            string += ch;
            next();
        }
        if (ch === '.') {
            string += '.';
            while (next() && ch >= '0' && ch <= '9') {
                string += ch;
            }
        }
        if (ch === 'e' || ch === 'E') {
            string += ch;
            next();
            if (ch === '-' || ch === '+') {
                string += ch;
                next();
            }
            while (ch >= '0' && ch <= '9') {
                string += ch;
                next();
            }
        }
        number = +string;
        if (!isFinite(number)) {
            error("Bad number");
        } else {
            return number;
        }
    },
    
    string = function () {
        // Parse a string value.
        var hex,
            i,
            string = '',
            uffff;
        
        // When parsing for string values, we must look for " and \ characters.
        if (ch === '"') {
            while (next()) {
                if (ch === '"') {
                    next();
                    return string;
                } else if (ch === '\\') {
                    next();
                    if (ch === 'u') {
                        uffff = 0;
                        for (i = 0; i < 4; i += 1) {
                            hex = parseInt(next(), 16);
                            if (!isFinite(hex)) {
                                break;
                            }
                            uffff = uffff * 16 + hex;
                        }
                        string += String.fromCharCode(uffff);
                    } else if (typeof escapee[ch] === 'string') {
                        string += escapee[ch];
                    } else {
                        break;
                    }
                } else {
                    string += ch;
                }
            }
        }
        error("Bad string");
    },

    white = function () {

// Skip whitespace.

        while (ch && ch <= ' ') {
            next();
        }
    },

    word = function () {

// true, false, or null.

        switch (ch) {
        case 't':
            next('t');
            next('r');
            next('u');
            next('e');
            return true;
        case 'f':
            next('f');
            next('a');
            next('l');
            next('s');
            next('e');
            return false;
        case 'n':
            next('n');
            next('u');
            next('l');
            next('l');
            return null;
        }
        error("Unexpected '" + ch + "'");
    },

    value,  // Place holder for the value function.

    array = function () {

// Parse an array value.

        var array = [];

        if (ch === '[') {
            next('[');
            white();
            if (ch === ']') {
                next(']');
                return array;   // empty array
            }
            while (ch) {
                array.push(value());
                white();
                if (ch === ']') {
                    next(']');
                    return array;
                }
                next(',');
                white();
            }
        }
        error("Bad array");
    },

    object = function () {

// Parse an object value.

        var key,
            object = {};

        if (ch === '{') {
            next('{');
            white();
            if (ch === '}') {
                next('}');
                return object;   // empty object
            }
            while (ch) {
                key = string();
                white();
                next(':');
                if (Object.hasOwnProperty.call(object, key)) {
                    error('Duplicate key "' + key + '"');
                }
                object[key] = value();
                white();
                if (ch === '}') {
                    next('}');
                    return object;
                }
                next(',');
                white();
            }
        }
        error("Bad object");
    };

value = function () {

// Parse a JSON value. It could be an object, an array, a string, a number,
// or a word.

    white();
    switch (ch) {
    case '{':
        return object();
    case '[':
        return array();
    case '"':
        return string();
    case '-':
        return number();
    default:
        return ch >= '0' && ch <= '9' ? number() : word();
    }
};

// Return the json_parse function. It will have access to all of the above
// functions and variables.

module.exports = function (source, reviver) {
    var result;
    
    text = source;
    at = 0;
    ch = ' ';
    result = value();
    white();
    if (ch) {
        error("Syntax error");
    }

    // If there is a reviver function, we recursively walk the new structure,
    // passing each name/value pair to the reviver function for possible
    // transformation, starting with a temporary root object that holds the result
    // in an empty key. If there is not a reviver function, we simply return the
    // result.

    return typeof reviver === 'function' ? (function walk(holder, key) {
        var k, v, value = holder[key];
        if (value && typeof value === 'object') {
            for (k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    v = walk(value, k);
                    if (v !== undefined) {
                        value[k] = v;
                    } else {
                        delete value[k];
                    }
                }
            }
        }
        return reviver.call(holder, key, value);
    }({'': result}, '')) : result;
};

},{}],19:[function(require,module,exports){
var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    gap,
    indent,
    meta = {    // table of character substitutions
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    },
    rep;

function quote(string) {
    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.
    
    escapable.lastIndex = 0;
    return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
        var c = meta[a];
        return typeof c === 'string' ? c :
            '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + string + '"';
}

function str(key, holder) {
    // Produce a string from holder[key].
    var i,          // The loop counter.
        k,          // The member key.
        v,          // The member value.
        length,
        mind = gap,
        partial,
        value = holder[key];
    
    // If the value has a toJSON method, call it to obtain a replacement value.
    if (value && typeof value === 'object' &&
            typeof value.toJSON === 'function') {
        value = value.toJSON(key);
    }
    
    // If we were called with a replacer function, then call the replacer to
    // obtain a replacement value.
    if (typeof rep === 'function') {
        value = rep.call(holder, key, value);
    }
    
    // What happens next depends on the value's type.
    switch (typeof value) {
        case 'string':
            return quote(value);
        
        case 'number':
            // JSON numbers must be finite. Encode non-finite numbers as null.
            return isFinite(value) ? String(value) : 'null';
        
        case 'boolean':
        case 'null':
            // If the value is a boolean or null, convert it to a string. Note:
            // typeof null does not produce 'null'. The case is included here in
            // the remote chance that this gets fixed someday.
            return String(value);
            
        case 'object':
            if (!value) return 'null';
            gap += indent;
            partial = [];
            
            // Array.isArray
            if (Object.prototype.toString.apply(value) === '[object Array]') {
                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }
                
                // Join all of the elements together, separated with commas, and
                // wrap them in brackets.
                v = partial.length === 0 ? '[]' : gap ?
                    '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                    '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }
            
            // If the replacer is an array, use it to select the members to be
            // stringified.
            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            else {
                // Otherwise, iterate through all of the keys in the object.
                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            
        // Join all of the member texts together, separated with commas,
        // and wrap them in braces.

        v = partial.length === 0 ? '{}' : gap ?
            '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
            '{' + partial.join(',') + '}';
        gap = mind;
        return v;
    }
}

module.exports = function (value, replacer, space) {
    var i;
    gap = '';
    indent = '';
    
    // If the space parameter is a number, make an indent string containing that
    // many spaces.
    if (typeof space === 'number') {
        for (i = 0; i < space; i += 1) {
            indent += ' ';
        }
    }
    // If the space parameter is a string, it will be used as the indent string.
    else if (typeof space === 'string') {
        indent = space;
    }

    // If there is a replacer, it must be a function or an array.
    // Otherwise, throw an error.
    rep = replacer;
    if (replacer && typeof replacer !== 'function'
    && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
        throw new Error('JSON.stringify');
    }
    
    // Make a fake root object containing our value under the key of ''.
    // Return the result of stringifying the value.
    return str('', {'': value});
};

},{}],20:[function(require,module,exports){
// Generated by CoffeeScript 1.6.3
(function() {
  var Deferred, PENDING, REJECTED, RESOLVED, VERSION, after, execute, flatten, has, installInto, isArguments, isPromise, wrap, _when,
    __slice = [].slice;

  VERSION = '3.0.0';

  PENDING = "pending";

  RESOLVED = "resolved";

  REJECTED = "rejected";

  has = function(obj, prop) {
    return obj != null ? obj.hasOwnProperty(prop) : void 0;
  };

  isArguments = function(obj) {
    return has(obj, 'length') && has(obj, 'callee');
  };

  isPromise = function(obj) {
    return has(obj, 'promise') && typeof (obj != null ? obj.promise : void 0) === 'function';
  };

  flatten = function(array) {
    if (isArguments(array)) {
      return flatten(Array.prototype.slice.call(array));
    }
    if (!Array.isArray(array)) {
      return [array];
    }
    return array.reduce(function(memo, value) {
      if (Array.isArray(value)) {
        return memo.concat(flatten(value));
      }
      memo.push(value);
      return memo;
    }, []);
  };

  after = function(times, func) {
    if (times <= 0) {
      return func();
    }
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  wrap = function(func, wrapper) {
    return function() {
      var args;
      args = [func].concat(Array.prototype.slice.call(arguments, 0));
      return wrapper.apply(this, args);
    };
  };

  execute = function(callbacks, args, context) {
    var callback, _i, _len, _ref, _results;
    _ref = flatten(callbacks);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      callback = _ref[_i];
      _results.push(callback.call.apply(callback, [context].concat(__slice.call(args))));
    }
    return _results;
  };

  Deferred = function() {
    var candidate, close, closingArguments, doneCallbacks, failCallbacks, progressCallbacks, state;
    state = PENDING;
    doneCallbacks = [];
    failCallbacks = [];
    progressCallbacks = [];
    closingArguments = {
      'resolved': {},
      'rejected': {},
      'pending': {}
    };
    this.promise = function(candidate) {
      var pipe, storeCallbacks;
      candidate = candidate || {};
      candidate.state = function() {
        return state;
      };
      storeCallbacks = function(shouldExecuteImmediately, holder, holderState) {
        return function() {
          if (state === PENDING) {
            holder.push.apply(holder, flatten(arguments));
          }
          if (shouldExecuteImmediately()) {
            execute(arguments, closingArguments[holderState]);
          }
          return candidate;
        };
      };
      candidate.done = storeCallbacks((function() {
        return state === RESOLVED;
      }), doneCallbacks, RESOLVED);
      candidate.fail = storeCallbacks((function() {
        return state === REJECTED;
      }), failCallbacks, REJECTED);
      candidate.progress = storeCallbacks((function() {
        return state !== PENDING;
      }), progressCallbacks, PENDING);
      candidate.always = function() {
        var _ref;
        return (_ref = candidate.done.apply(candidate, arguments)).fail.apply(_ref, arguments);
      };
      pipe = function(doneFilter, failFilter, progressFilter) {
        var filter, master;
        master = new Deferred();
        filter = function(source, funnel, callback) {
          if (!callback) {
            return candidate[source](master[funnel]);
          }
          return candidate[source](function() {
            var args, value;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            value = callback.apply(null, args);
            if (isPromise(value)) {
              return value.done(master.resolve).fail(master.reject).progress(master.notify);
            } else {
              return master[funnel](value);
            }
          });
        };
        filter('done', 'resolve', doneFilter);
        filter('fail', 'reject', failFilter);
        filter('progress', 'notify', progressFilter);
        return master;
      };
      candidate.pipe = pipe;
      candidate.then = pipe;
      if (candidate.promise == null) {
        candidate.promise = function() {
          return candidate;
        };
      }
      return candidate;
    };
    this.promise(this);
    candidate = this;
    close = function(finalState, callbacks, context) {
      return function() {
        if (state === PENDING) {
          state = finalState;
          closingArguments[finalState] = arguments;
          execute(callbacks, closingArguments[finalState], context);
          return candidate;
        }
        return this;
      };
    };
    this.resolve = close(RESOLVED, doneCallbacks);
    this.reject = close(REJECTED, failCallbacks);
    this.notify = close(PENDING, progressCallbacks);
    this.resolveWith = function(context, args) {
      return close(RESOLVED, doneCallbacks, context).apply(null, args);
    };
    this.rejectWith = function(context, args) {
      return close(REJECTED, failCallbacks, context).apply(null, args);
    };
    this.notifyWith = function(context, args) {
      return close(PENDING, progressCallbacks, context).apply(null, args);
    };
    return this;
  };

  _when = function() {
    var def, defs, finish, resolutionArgs, trigger, _i, _len;
    defs = flatten(arguments);
    if (defs.length === 1) {
      if (isPromise(defs[0])) {
        return defs[0];
      } else {
        return (new Deferred()).resolve(defs[0]).promise();
      }
    }
    trigger = new Deferred();
    if (!defs.length) {
      return trigger.resolve().promise();
    }
    resolutionArgs = [];
    finish = after(defs.length, function() {
      return trigger.resolve.apply(trigger, resolutionArgs);
    });
    defs.forEach(function(def, index) {
      if (isPromise(def)) {
        return def.done(function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          resolutionArgs[index] = args.length > 1 ? args : args[0];
          return finish();
        });
      } else {
        resolutionArgs[index] = def;
        return finish();
      }
    });
    for (_i = 0, _len = defs.length; _i < _len; _i++) {
      def = defs[_i];
      isPromise(def) && def.fail(trigger.reject);
    }
    return trigger.promise();
  };

  installInto = function(fw) {
    fw.Deferred = function() {
      return new Deferred();
    };
    fw.ajax = wrap(fw.ajax, function(ajax, options) {
      var createWrapper, def, promise, xhr;
      if (options == null) {
        options = {};
      }
      def = new Deferred();
      createWrapper = function(wrapped, finisher) {
        return wrap(wrapped, function() {
          var args, func;
          func = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          if (func) {
            func.apply(null, args);
          }
          return finisher.apply(null, args);
        });
      };
      options.success = createWrapper(options.success, def.resolve);
      options.error = createWrapper(options.error, def.reject);
      xhr = ajax(options);
      promise = def.promise();
      promise.abort = function() {
        return xhr.abort();
      };
      return promise;
    });
    return fw.when = _when;
  };

  if (typeof exports !== 'undefined') {
    exports.Deferred = function() {
      return new Deferred();
    };
    exports.when = _when;
    exports.installInto = installInto;
  } else if (typeof define === 'function' && define.amd) {
    define(function() {
      if (typeof Zepto !== 'undefined') {
        return installInto(Zepto);
      } else {
        Deferred.when = _when;
        Deferred.installInto = installInto;
        return Deferred;
      }
    });
  } else if (typeof Zepto !== 'undefined') {
    installInto(Zepto);
  } else {
    this.Deferred = function() {
      return new Deferred();
    };
    this.Deferred.when = _when;
    this.Deferred.installInto = installInto;
  }

}).call(this);

},{}],21:[function(require,module,exports){
(function () {

    'use strict';

    module.exports = {
        TileLayer: require('./layer/exports'),
        Renderer: require('./renderer/exports'),
        TileRequestor: require('./request/TileRequestor'),
        MetaRequestor: require('./request/MetaRequestor')
    };

}());

},{"./layer/exports":26,"./renderer/exports":50,"./request/MetaRequestor":62,"./request/TileRequestor":64}],22:[function(require,module,exports){
(function() {

    'use strict';

    var Image = require('./Image');

    var Debug = Image.extend({

        options: {
            unloadInvisibleTiles: true,
            zIndex: 5000
        },

        initialize: function(options) {
            // set renderer
            if (!options.rendererClass) {
                console.warn('No `rendererClass` option found, this layer will not render any data.');
            } else {
                // recursively extend
                $.extend(true, this, options.rendererClass);
            }
            // set options
            L.setOptions(this, options);
        },

        redraw: function() {
            if (this._map) {
                this._reset({
                    hard: true
                });
                this._update();
            }
            return this;
        },

        _redrawTile: function(tile) {
            var coord = {
                x: tile._tilePoint.x,
                y: tile._tilePoint.y,
                z: this._map._zoom
            };
            this.renderTile(tile, coord);
            this.tileDrawn(tile);
        },

        _createTile: function() {
            var tile = L.DomUtil.create('div', 'leaflet-tile leaflet-debug-tile');
            tile.width = this.options.tileSize;
            tile.height = this.options.tileSize;
            tile.onselectstart = L.Util.falseFn;
            tile.onmousemove = L.Util.falseFn;
            return tile;
        },

        _loadTile: function(tile, tilePoint) {
            tile._layer = this;
            tile._tilePoint = tilePoint;
            this._adjustTilePoint(tilePoint);
            this._redrawTile(tile);
        },

        renderTile: function( /*elem, coord*/ ) {
            // override
        },

        tileDrawn: function(tile) {
            this._tileOnLoad.call(tile);
        }

    });

    module.exports = Debug;

}());

},{"./Image":23}],23:[function(require,module,exports){
(function() {

    'use strict';

    var Image = L.TileLayer.extend({

        getOpacity: function() {
            return this.options.opacity;
        },

        show: function() {
            this._hidden = false;
            this._prevMap.addLayer(this);
        },

        hide: function() {
            this._hidden = true;
            this._prevMap = this._map;
            this._map.removeLayer(this);
        },

        isHidden: function() {
            return this._hidden;
        },

        setBrightness: function(brightness) {
            this._brightness = brightness;
            $(this._container).css('-webkit-filter', 'brightness(' + (this._brightness * 100) + '%)');
            $(this._container).css('filter', 'brightness(' + (this._brightness * 100) + '%)');
        },

        getBrightness: function() {
            return (this._brightness !== undefined) ? this._brightness : 1;
        }

    });

    module.exports = Image;

}());

},{}],24:[function(require,module,exports){
(function() {

    'use strict';

    var MIN = Number.MAX_VALUE;
    var MAX = 0;

    var Live = L.Class.extend({

        initialize: function(meta, options) {
            // set renderer
            if (!options.rendererClass) {
                console.warn('No `rendererClass` option found, this layer will not render any data.');
            } else {
                // recursively extend and initialize
                if (options.rendererClass.prototype) {
                    $.extend(true, this, options.rendererClass.prototype);
                    options.rendererClass.prototype.initialize.apply(this, arguments);
                } else {
                    $.extend(true, this, options.rendererClass);
                    options.rendererClass.initialize.apply(this, arguments);
                }
            }
            // set options
            L.setOptions(this, options);
            // set meta
            this._meta = meta;
            // set params
            this._params = {
                binning: {}
            };
            this.clearExtrema();
        },

        clearExtrema: function() {
            this._extrema = {
                min: MIN,
                max: MAX
            };
            this._cache = {};
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

        setMeta: function(meta) {
            this._meta = meta;
            return this;
        },

        getMeta: function() {
            return this._meta;
        },

        setParams: function(params) {
            this._params = params;
        },

        getParams: function() {
            return this._params;
        }

    });

    module.exports = Live;

}());

},{}],25:[function(require,module,exports){
(function() {

    'use strict';

    var Image = require('./Image');

    var Pending = Image.extend({

        options: {
            unloadInvisibleTiles: true,
            zIndex: 5000
        },

        initialize: function(options) {
            this._pendingTiles = {};
            // set renderer
            if (!options.rendererClass) {
                console.warn('No `rendererClass` option found, this layer will not render any data.');
            } else {
                // recursively extend
                $.extend(true, this, options.rendererClass);
            }
            // set options
            L.setOptions(this, options);
        },

        increment: function(coord) {
            var hash = this._getTileHash(coord);
            if (this._pendingTiles[hash] === undefined) {
                this._pendingTiles[hash] = 1;
                var tiles = this._getTilesWithHash(hash);
                tiles.forEach(function(tile) {
                    this._redrawTile(tile);
                }, this);
            } else {
                this._pendingTiles[hash]++;
            }
        },

        decrement: function(coord) {
            var hash = this._getTileHash(coord);
            this._pendingTiles[hash]--;
            if (this._pendingTiles[hash] === 0) {
                delete this._pendingTiles[hash];
                var tiles = this._getTilesWithHash(hash);
                tiles.forEach(function(tile) {
                    this._redrawTile(tile);
                }, this);
            }
        },

        redraw: function() {
            if (this._map) {
                this._reset({
                    hard: true
                });
                this._update();
            }
            return this;
        },

        _getTileClass: function(hash) {
            return 'pending-' + hash;
        },

        _getTileHash: function(coord) {
            return coord.z + '-' + coord.x + '-' + coord.y;
        },

        _getTilesWithHash: function(hash) {
            var className = this._getTileClass(hash);
            var tiles = [];
            $(this._container).find('.' + className).each(function() {
                tiles.push(this);
            });
            return tiles;
        },

        _redrawTile: function(tile) {
            var coord = {
                x: tile._tilePoint.x,
                y: tile._tilePoint.y,
                z: this._map._zoom
            };
            var hash = this._getTileHash(coord);
            $(tile).addClass(this._getTileClass(hash));
            if (this._pendingTiles[hash] > 0) {
                this.renderTile(tile, coord);
            } else {
                tile.innerHTML = '';
            }
            this.tileDrawn(tile);
        },

        _createTile: function() {
            var tile = L.DomUtil.create('div', 'leaflet-tile leaflet-pending-tile');
            tile.width = this.options.tileSize;
            tile.height = this.options.tileSize;
            tile.onselectstart = L.Util.falseFn;
            tile.onmousemove = L.Util.falseFn;
            return tile;
        },

        _loadTile: function(tile, tilePoint) {
            tile._layer = this;
            tile._tilePoint = tilePoint;
            this._adjustTilePoint(tilePoint);
            this._redrawTile(tile);
        },

        renderTile: function( /*elem*/ ) {
            // override
        },

        tileDrawn: function(tile) {
            this._tileOnLoad.call(tile);
        }

    });

    module.exports = Pending;

}());

},{"./Image":23}],26:[function(require,module,exports){
(function() {

    'use strict';

    // debug tile layer
    var Debug = require('./core/Debug');

    // pending tile layer
    var Pending = require('./core/Pending');

    // standard XYZ / TMX image layer
    var Image = require('./core/Image');

    // live tile layers
    var Heatmap = require('./types/Heatmap');
    var TopCount = require('./types/TopCount');
    var TopFrequency = require('./types/TopFrequency');
    var TopicCount = require('./types/TopicCount');
    var TopicFrequency = require('./types/TopicFrequency');

    module.exports = {
        Debug: Debug,
        Pending: Pending,
        Image: Image,
        Heatmap: Heatmap,
        TopCount: TopCount,
        TopFrequency: TopFrequency,
        TopicCount: TopicCount,
        TopicFrequency: TopicFrequency
    };

}());

},{"./core/Debug":22,"./core/Image":23,"./core/Pending":25,"./types/Heatmap":41,"./types/TopCount":42,"./types/TopFrequency":43,"./types/TopicCount":44,"./types/TopicFrequency":45}],27:[function(require,module,exports){
(function() {

    'use strict';

    function rgb2lab(rgb) {
        var r = rgb[0] > 0.04045 ? Math.pow((rgb[0] + 0.055) / 1.055, 2.4) : rgb[0] / 12.92;
        var g = rgb[1] > 0.04045 ? Math.pow((rgb[1] + 0.055) / 1.055, 2.4) : rgb[1] / 12.92;
        var b = rgb[2] > 0.04045 ? Math.pow((rgb[2] + 0.055) / 1.055, 2.4) : rgb[2] / 12.92;
        //Observer. = 2°, Illuminant = D65
        var x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
        var y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
        var z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;
        x = x / 0.95047; // Observer= 2°, Illuminant= D65
        y = y / 1.00000;
        z = z / 1.08883;
        x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787037 * x) + (16 / 116);
        y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787037 * y) + (16 / 116);
        z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787037 * z) + (16 / 116);
        return [(116 * y) - 16,
            500 * (x - y),
            200 * (y - z),
            rgb[3]];
    }

    function lab2rgb(lab) {
        var y = (lab[0] + 16) / 116;
        var x = y + lab[1] / 500;
        var z = y - lab[2] / 200;
        x = x > 0.206893034 ? x * x * x : (x - 4 / 29) / 7.787037;
        y = y > 0.206893034 ? y * y * y : (y - 4 / 29) / 7.787037;
        z = z > 0.206893034 ? z * z * z : (z - 4 / 29) / 7.787037;
        x = x * 0.95047; // Observer= 2°, Illuminant= D65
        y = y * 1.00000;
        z = z * 1.08883;
        var r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
        var g = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
        var b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
        r = r > 0.00304 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
        g = g > 0.00304 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
        b = b > 0.00304 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;
        return [Math.max(Math.min(r, 1), 0), Math.max(Math.min(g, 1), 0), Math.max(Math.min(b, 1), 0), lab[3]];
    }

    function distance(c1, c2) {
        return Math.sqrt(
            (c1[0] - c2[0]) * (c1[0] - c2[0]) +
            (c1[1] - c2[1]) * (c1[1] - c2[1]) +
            (c1[2] - c2[2]) * (c1[2] - c2[2]) +
            (c1[3] - c2[3]) * (c1[3] - c2[3])
        );
    }

    var GRADIENT_STEPS = 200;

    // Interpolate between a set of colors using even perceptual distance and interpolation in CIE L*a*b* space
    var buildPerceptualLookupTable = function(baseColors) {
        var outputGradient = [];
        // Calculate perceptual spread in L*a*b* space
        var labs = _.map(baseColors, function(color) {
            return rgb2lab([color[0] / 255, color[1] / 255, color[2] / 255, color[3] / 255]);
        });
        var distances = _.map(labs, function(color, index, colors) {
            return index > 0 ? distance(color, colors[index - 1]) : 0;
        });
        // Calculate cumulative distances in [0,1]
        var totalDistance = _.reduce(distances, function(a, b) {
            return a + b;
        }, 0);
        distances = _.map(distances, function(d) {
            return d / totalDistance;
        });
        var distanceTraversed = 0;
        var key = 0;
        var progress;
        var stepProgress;
        var rgb;
        for (var i = 0; i < GRADIENT_STEPS; i++) {
            progress = i / (GRADIENT_STEPS - 1);
            if (progress > distanceTraversed + distances[key + 1] && key + 1 < labs.length - 1) {
                key += 1;
                distanceTraversed += distances[key];
            }
            stepProgress = (progress - distanceTraversed) / distances[key + 1];
            rgb = lab2rgb([
                labs[key][0] + (labs[key + 1][0] - labs[key][0]) * stepProgress,
                labs[key][1] + (labs[key + 1][1] - labs[key][1]) * stepProgress,
                labs[key][2] + (labs[key + 1][2] - labs[key][2]) * stepProgress,
                labs[key][3] + (labs[key + 1][3] - labs[key][3]) * stepProgress
            ]);
            outputGradient.push([
                Math.round(rgb[0] * 255),
                Math.round(rgb[1] * 255),
                Math.round(rgb[2] * 255),
                Math.round(rgb[3] * 255)
            ]);
        }
        return outputGradient;
    };

    var COOL = buildPerceptualLookupTable([
        [0x04, 0x20, 0x40, 0x50],
        [0x08, 0x40, 0x81, 0x7f],
        [0x08, 0x68, 0xac, 0xff],
        [0x2b, 0x8c, 0xbe, 0xff],
        [0x4e, 0xb3, 0xd3, 0xff],
        [0x7b, 0xcc, 0xc4, 0xff],
        [0xa8, 0xdd, 0xb5, 0xff],
        [0xcc, 0xeb, 0xc5, 0xff],
        [0xe0, 0xf3, 0xdb, 0xff],
        [0xf7, 0xfc, 0xf0, 0xff]
    ]);

    var HOT = buildPerceptualLookupTable([
        [0x40, 0x00, 0x13, 0x50],
        [0x80, 0x00, 0x26, 0x7f],
        [0xbd, 0x00, 0x26, 0xff],
        [0xe3, 0x1a, 0x1c, 0xff],
        [0xfc, 0x4e, 0x2a, 0xff],
        [0xfd, 0x8d, 0x3c, 0xff],
        [0xfe, 0xb2, 0x4c, 0xff],
        [0xfe, 0xd9, 0x76, 0xff],
        [0xff, 0xed, 0xa0, 0xff]
    ]);

    var VERDANT = buildPerceptualLookupTable([
        [0x00, 0x40, 0x26, 0x50],
        [0x00, 0x5a, 0x32, 0x7f],
        [0x23, 0x84, 0x43, 0xff],
        [0x41, 0xab, 0x5d, 0xff],
        [0x78, 0xc6, 0x79, 0xff],
        [0xad, 0xdd, 0x8e, 0xff],
        [0xd9, 0xf0, 0xa3, 0xff],
        [0xf7, 0xfc, 0xb9, 0xff],
        [0xff, 0xff, 0xe5, 0xff]
    ]);

    var SPECTRAL = buildPerceptualLookupTable([
        [0x26, 0x1a, 0x40, 0x50],
        [0x44, 0x2f, 0x72, 0x7f],
        [0xe1, 0x2b, 0x02, 0xff],
        [0x02, 0xdc, 0x01, 0xff],
        [0xff, 0xd2, 0x02, 0xff],
        [0xff, 0xff, 0xff, 0xff]
    ]);

    var TEMPERATURE = buildPerceptualLookupTable([
        [0x00, 0x16, 0x40, 0x50],
        [0x00, 0x39, 0x66, 0x7f], //blue
        [0x31, 0x3d, 0x66, 0xff], //purple
        [0xe1, 0x2b, 0x02, 0xff], //red
        [0xff, 0xd2, 0x02, 0xff], //yellow
        [0xff, 0xff, 0xff, 0xff] //white
    ]);

    var GREYSCALE = buildPerceptualLookupTable([
        [0x00, 0x00, 0x00, 0x7f],
        [0x40, 0x40, 0x40, 0xff],
        [0xff, 0xff, 0xff, 0xff]
    ]);

    var POLAR_HOT = buildPerceptualLookupTable([
        [ 0xff, 0x44, 0x00, 0xff ],
        [ 0xbd, 0xbd, 0xbd, 0xb0 ]
    ]);

    var POLAR_COLD = buildPerceptualLookupTable([
        [ 0xbd, 0xbd, 0xbd, 0xb0 ],
        [ 0x32, 0xa5, 0xf9, 0xff ]
    ]);

    var buildLookupFunction = function(RAMP) {
        return function(scaledValue, inColor) {
            var color = RAMP[Math.floor(scaledValue * (RAMP.length - 1))];
            inColor[0] = color[0];
            inColor[1] = color[1];
            inColor[2] = color[2];
            inColor[3] = color[3];
            return inColor;
        };
    };

    var ColorRamp = {
        cool: buildLookupFunction(COOL),
        hot: buildLookupFunction(HOT),
        verdant: buildLookupFunction(VERDANT),
        spectral: buildLookupFunction(SPECTRAL),
        temperature: buildLookupFunction(TEMPERATURE),
        grey: buildLookupFunction(GREYSCALE),
        polar: buildLookupFunction(POLAR_HOT.concat(POLAR_COLD))
    };

    var setColorRamp = function(type) {
        var func = ColorRamp[type.toLowerCase()];
        if (func) {
            this._colorRamp = func;
        }
        return this;
    };

    var getColorRamp = function() {
        return this._colorRamp;
    };

    var initialize = function() {
        this._colorRamp = ColorRamp.verdant;
    };

    module.exports = {
        initialize: initialize,
        setColorRamp: setColorRamp,
        getColorRamp: getColorRamp
    };

}());

},{}],28:[function(require,module,exports){
(function() {

    'use strict';

    var SIGMOID_SCALE = 0.15;

    // log10

    function log10Transform(val, min, max) {
        var logMin = Math.log10(min || 1);
        var logMax = Math.log10(max || 1);
        var logVal = Math.log10(val || 1);
        return (logVal - logMin) / ((logMax - logMin) || 1);
    }

    function inverseLog10Transform(nval, min, max) {
        var logMin = Math.log10(min || 1);
        var logMax = Math.log10(max || 1);
        return Math.pow(10, (nval * logMax - nval * logMin) + logMin);
    }

    // sigmoid

    function sigmoidTransform(val, min, max) {
        var absMin = Math.abs(min);
        var absMax = Math.abs(max);
        var distance = Math.max(absMin, absMax);
        var scaledVal = val / (SIGMOID_SCALE * distance);
        return 1 / (1 + Math.exp(-scaledVal));
    }

    function inverseSigmoidTransform(nval, min, max) {
        var absMin = Math.abs(min);
        var absMax = Math.abs(max);
        var distance = Math.max(absMin, absMax);
        return Math.log((1/nval) - 1) * -(SIGMOID_SCALE * distance);
    }

    // linear

    function linearTransform(val, min, max) {
        var range = max - min;
        return (val - min) / range;
    }

    function inverseLinearTransform(nval, min, max) {
        var range = max - min;
        return min + nval * range;
    }

    var Transform = {
        linear: linearTransform,
        log10: log10Transform,
        sigmoid: sigmoidTransform
    };

    var Inverse = {
        linear: inverseLinearTransform,
        log10: inverseLog10Transform,
        sigmoid: inverseSigmoidTransform
    };

    var initialize = function() {
        this._range = {
            min: 0,
            max: 1
        };
        this._transformFunc = log10Transform;
        this._inverseFunc = inverseLog10Transform;
    };

    var setTransformFunc = function(type) {
        var func = type.toLowerCase();
        this._transformFunc = Transform[func];
        this._inverseFunc = Inverse[func];
    };

    var setValueRange = function(range) {
        this._range.min = range.min;
        this._range.max = range.max;
    };

    var getValueRange = function() {
        return this._range;
    };

    var interpolateToRange = function(nval) {
        // interpolate between the filter range
        var rMin = this._range.min;
        var rMax = this._range.max;
        var rval = (nval - rMin) / (rMax - rMin);
        // ensure output is [0:1]
        return Math.max(0, Math.min(1, rval));
    };

    var transformValue = function(val) {
        // clamp the value between the extreme (shouldn't be necessary)
        var min = this._extrema.min;
        var max = this._extrema.max;
        var clamped = Math.max(Math.min(val, max), min);
        // normalize the value
        return this._transformFunc(clamped, min, max);
    };

    var untransformValue = function(nval) {
        var min = this._extrema.min;
        var max = this._extrema.max;
        // clamp the value between the extreme (shouldn't be necessary)
        var clamped = Math.max(Math.min(nval, 1), 0);
        // unnormalize the value
        return this._inverseFunc(clamped, min, max);
    };

    module.exports = {
        initialize: initialize,
        setTransformFunc: setTransformFunc,
        setValueRange: setValueRange,
        getValueRange: getValueRange,
        transformValue: transformValue,
        untransformValue: untransformValue,
        interpolateToRange: interpolateToRange
    };

}());

},{}],29:[function(require,module,exports){
(function() {

    'use strict';

    var Tiling = require('./Tiling');

    var setResolution = function(resolution) {
        if (resolution !== this._params.binning.resolution) {
            this._params.binning.resolution = resolution;
            this.clearExtrema();
        }
        return this;
    };

    var getResolution = function() {
        return this._params.binning.resolution;
    };

    module.exports = {
        // tiling
        setXField: Tiling.setXField,
        getXField: Tiling.getXField,
        setYField: Tiling.setYField,
        getYField: Tiling.getYField,
        // binning
        setResolution: setResolution,
        getResolution: getResolution
    };

}());

},{"./Tiling":39}],30:[function(require,module,exports){
(function(){

  'use strict';

  var checkField = function(meta, field) {
    if (meta && meta.type) {

    }
  }

  function addBoolQuery(query){

    // do some validation on the query object
    // e.g. make sure that all of the fields referenced are actually part of the metadata for the layer
    this._params.bool_query = query;
    console.log('adding forreals');
    return {};
  }

  function removeBoolQuery(){
    this._params.bool_query = null;
    console.log('removing forreals');
    return {};
  }

  function getBoolQuery(){

    console.log('getting forreals');
    return this._params.bool_query;
  }

  module.exports = {
    addBoolQuery : addBoolQuery,
    removeBoolQuery : removeBoolQuery,
    getBoolQuery : getBoolQuery
  }
}());

},{}],31:[function(require,module,exports){
(function() {

    'use strict';

    var setDateHistogram = function(field, from, to, interval) {
        if (!field) {
            console.warn('DateHistogram `field` is missing from argument. Ignoring command.');
            return;
        }
        if (from === undefined) {
            console.warn('DateHistogram `from` are missing from argument. Ignoring command.');
            return;
        }
        if (to === undefined) {
            console.warn('DateHistogram `to` are missing from argument. Ignoring command.');
            return;
        }
        this._params.date_histogram = {
            field: field,
            from: from,
            to: to,
            interval: interval
        };
        this.clearExtrema();
        return this;
    };

    var getDateHistogram = function() {
        return this._params.date_histogram;
    };

    module.exports = {
        setDateHistogram: setDateHistogram,
        getDateHistogram: getDateHistogram
    };

}());

},{}],32:[function(require,module,exports){
(function() {

    'use strict';

    var setHistogram = function(field, interval) {
        if (!field) {
            console.warn('Histogram `field` is missing from argument. Ignoring command.');
            return;
        }
        if (!interval) {
            console.warn('Histogram `interval` are missing from argument. Ignoring command.');
            return;
        }
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

},{}],33:[function(require,module,exports){
(function() {

    'use strict';

    var METRICS = {
        'min': true,
        'max': true,
        'sum': true,
        'avg': true
    };

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.extrema) {
                return true;
            } else {
                console.warn('Field `' + field + '` is not ordinal in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var setMetricAgg = function(field, type) {
        if (!field) {
            console.warn('MetricAgg `field` is missing from argument. Ignoring command.');
            return;
        }
        if (!type) {
            console.warn('MetricAgg `type` is missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            if (!METRICS[type]) {
                console.warn('MetricAgg type `' + type + '` is not supported. Ignoring command.');
                return;
            }
            this._params.metric_agg = {
                field: field,
                type: type
            };
            this.clearExtrema();
        }
        return this;
    };

    var getMetricAgg = function() {
        return this._params.metric_agg;
    };

    module.exports = {
        // tiling
        setMetricAgg: setMetricAgg,
        getMetricAgg: getMetricAgg,
    };

}());

},{}],34:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type === 'string') {
                return true;
            } else {
                console.warn('Field `' + field + '` is not of type `string` in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var normalizeTerms = function(prefixes) {
        prefixes.sort(function(a, b) {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        });
        return prefixes;
    };

    var addPrefixFilter = function(field, prefixes) {
        if (!field) {
            console.warn('PrefixFilter `field` is missing from argument. Ignoring command.');
            return;
        }
        if (prefixes === undefined) {
            console.warn('PrefixFilter `prefixes` are missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            var filter = _.find(this._params.prefix_filter, function(filter) {
                return filter.field === field;
            });
            if (filter) {
                console.warn('Range with `field` of `' + field + '` already exists, used `updateRange` instead.');
                return;
            }
            this._params.prefix_filter = this._params.prefix_filter || [];
            this._params.prefix_filter.push({
                field: field,
                prefixes: normalizeTerms(prefixes)
            });
            this.clearExtrema();
        }
        return this;
    };

    var updatePrefixFilter = function(field, prefixes) {
        var filter = _.find(this._params.prefix_filter, function(filter) {
            return filter.field === field;
        });
        if (!filter) {
            console.warn('Range with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        if (prefixes !== undefined) {
            filter.prefixes = normalizeTerms(prefixes);
            this.clearExtrema();
        }
        return this;
    };

    var removePrefixFilter = function(field) {
        var filter = _.find(this._params.prefix_filter, function(filter) {
            return filter.field === field;
        });
        if (!filter) {
            console.warn('Range with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        this._params.prefix_filter = _.filter(this._params.prefix_filter, function(filter) {
            return filter.field !== field;
        });
        this.clearExtrema();
        return this;
    };

    var getPrefixFilter = function() {
        return this._params.prefix_filter;
    };

    module.exports = {
        addPrefixFilter: addPrefixFilter,
        updatePrefixFilter: updatePrefixFilter,
        removePrefixFilter: removePrefixFilter,
        getPrefixFilter: getPrefixFilter
    };

}());

},{}],35:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type === 'string') {
                return true;
            } else {
                console.warn('Field `' + field + '` is not `string` in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var addQueryString = function(field, str) {
        if (!field) {
            console.warn('QueryString `field` is missing from argument. Ignoring command.');
            return;
        }
        if (!str) {
            console.warn('QueryString `string` is missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            var query = _.find(this._params.query_string, function(query) {
                return query.field === field;
            });
            if (query) {
                console.warn('QueryString with `field` of `' + field + '` already exists, used `updateQueryString` instead.');
                return;
            }
            this._params.query_string = this._params.query_string || [];
            this._params.query_string.push({
                field: field,
                string: str
            });
            this.clearExtrema();
        }
        return this;
    };

    var updateQueryString = function(field, str) {
        var query = _.find(this._params.query_string, function(query) {
            return query.field === field;
        });
        if (!query) {
            console.warn('QueryString with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        var changed = false;
        if (str !== undefined) {
            changed = true;
            query.string = str;
        }
        if (changed) {
            this.clearExtrema();
        }
        return this;
    };

    var removeQueryString = function(field) {
        var query = _.find(this._params.query_string, function(query) {
            return query.field === field;
        });
        if (!query) {
            console.warn('QueryString with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        this._params.query_string = _.filter(this._params.query_string, function(query) {
            return query.field !== field;
        });
        this.clearExtrema();
        return this;
    };

    var getQueryString = function() {
        return this._params.query_string;
    };

    module.exports = {
        addQueryString: addQueryString,
        updateQueryString: updateQueryString,
        removeQueryString: removeQueryString,
        getQueryString: getQueryString
    };

}());

},{}],36:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.extrema) {
                return true;
            } else {
                console.warn('Field `' + field + '` is not ordinal in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var addRange = function(field, from, to) {
        if (!field) {
            console.warn('Range `field` is missing from argument. Ignoring command.');
            return;
        }
        if (from === undefined) {
            console.warn('Range `from` is missing from argument. Ignoring command.');
            return;
        }
        if (to === undefined) {
            console.warn('Range `to` is missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            var range = _.find(this._params.range, function(range) {
                return range.field === field;
            });
            if (range) {
                console.warn('Range with `field` of `' + field + '` already exists, used `updateRange` instead.');
                return;
            }
            this._params.range = this._params.range || [];
            this._params.range.push({
                field: field,
                from: from,
                to: to
            });
            this.clearExtrema();
        }
        return this;
    };

    var updateRange = function(field, from, to) {
        var range = _.find(this._params.range, function(range) {
            return range.field === field;
        });
        if (!range) {
            console.warn('Range with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        var changed = false;
        if (from !== undefined) {
            changed = true;
            range.from = from;
        }
        if (to !== undefined) {
            changed = true;
            range.to = to;
        }
        if (changed) {
            this.clearExtrema();
        }
        return this;
    };

    var removeRange = function(field) {
        var range = _.find(this._params.range, function(range) {
            return range.field === field;
        });
        if (!range) {
            console.warn('Range with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        this._params.range = _.filter(this._params.range, function(range) {
            return range.field !== field;
        });
        this.clearExtrema();
        return this;
    };

    var getRange = function() {
        return this._params.range;
    };

    module.exports = {
        addRange: addRange,
        updateRange: updateRange,
        removeRange: removeRange,
        getRange: getRange
    };

}());

},{}],37:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type === 'string') {
                return true;
            } else {
                console.warn('Field `' + field + '` is not of type `string` in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var normalizeTerms = function(terms) {
        terms.sort(function(a, b) {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        });
        return terms;
    };

    var setTermsAgg = function(field, terms) {
        if (!field) {
            console.warn('TermsAgg `field` is missing from argument. Ignoring command.');
            return;
        }
        if (terms === undefined) {
            console.warn('TermsAgg `terms` are missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            this._params.terms_agg = {
                field: field,
                terms: normalizeTerms(terms)
            };
            this.clearExtrema();
        }
        return this;
    };

    var getTermsAgg = function() {
        return this._params.terms_agg;
    };

    module.exports = {
        setTermsAgg: setTermsAgg,
        getTermsAgg: getTermsAgg
    };

}());

},{}],38:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type === 'string') {
                return true;
            } else {
                console.warn('Field `' + field + '` is not of type `string` in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var normalizeTerms = function(terms) {
        terms.sort(function(a, b) {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        });
        return terms;
    };

    var addTermsFilter = function(field, terms) {
        if (!field) {
            console.warn('TermsFilter `field` is missing from argument. Ignoring command.');
            return;
        }
        if (terms === undefined) {
            console.warn('TermsFilter `terms` are missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            var filter = _.find(this._params.terms_filter, function(filter) {
                return filter.field === field;
            });
            if (filter) {
                console.warn('TermsFilter with `field` of `' + field + '` already exists, used `updateRange` instead.');
                return;
            }
            this._params.terms_filter = this._params.terms_filter || [];
            this._params.terms_filter.push({
                field: field,
                terms: normalizeTerms(terms)
            });
            this.clearExtrema();
        }
        return this;
    };

    var updateTermsFilter = function(field, terms) {
        var filter = _.find(this._params.terms_filter, function(filter) {
            return filter.field === field;
        });
        if (!filter) {
            console.warn('Range with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        if (terms !== undefined) {
            filter.terms = normalizeTerms(terms);
            this.clearExtrema();
        }
        return this;
    };

    var removeTermsFilter = function(field) {
        var filter = _.find(this._params.terms_filter, function(filter) {
            return filter.field === field;
        });
        if (!filter) {
            console.warn('Range with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        this._params.terms_filter = _.filter(this._params.terms_filter, function(filter) {
            return filter.field !== field;
        });
        this.clearExtrema();
        return this;
    };

    var getTermsFilter = function(field) {
        return this._params.terms_filter[field];
    };

    module.exports = {
        addTermsFilter: addTermsFilter,
        updateTermsFilter: updateTermsFilter,
        removeTermsFilter: removeTermsFilter,
        getTermsFilter: getTermsFilter
    };

}());

},{}],39:[function(require,module,exports){
(function() {

    'use strict';

    var DEFAULT_X_FIELD = 'pixel.x';
    var DEFAULT_Y_FIELD = 'pixel.y';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.extrema) {
                return true;
            } else {
                console.warn('Field `' + field + '` is not ordinal in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var setXField = function(field) {
        if (field !== this._params.binning.x) {
            if (field === DEFAULT_X_FIELD) {
                // reset if default
                this._params.binning.x = undefined;
                this._params.binning.left = undefined;
                this._params.binning.right = undefined;
                this.clearExtrema();
            } else {
                var meta = this._meta[field];
                if (checkField(meta, field)) {
                    this._params.binning.x = field;
                    this._params.binning.left = meta.extrema.min;
                    this._params.binning.right = meta.extrema.max;
                    this.clearExtrema();
                }
            }
        }
        return this;
    };

    var getXField = function() {
        return this._params.binning.x;
    };

    var setYField = function(field) {
        if (field !== this._params.binning.y) {
            if (field === DEFAULT_Y_FIELD) {
                // reset if default
                this._params.binning.y = undefined;
                this._params.binning.bottom = undefined;
                this._params.binning.top = undefined;
                this.clearExtrema();
            } else {
                var meta = this._meta[field];
                if (checkField(meta, field)) {
                    this._params.binning.y = field;
                    this._params.binning.bottom = meta.extrema.min;
                    this._params.binning.top = meta.extrema.max;
                    this.clearExtrema();
                }
            }
        }
        return this;
    };

    var getYField = function() {
        return this._params.binning.y;
    };

    module.exports = {
        setXField: setXField,
        getXField: getXField,
        setYField: setYField,
        getYField: getYField,
        DEFAULT_X_FIELD: DEFAULT_X_FIELD,
        DEFAULT_Y_FIELD: DEFAULT_Y_FIELD
    };

}());

},{}],40:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type === 'string') {
                return true;
            } else {
                console.warn('Field `' + field + '` is not of type `string` in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var setTopTerms = function(field, size) {
        if (!field) {
            console.warn('TopTerms `field` is missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            this._params.top_terms = {
                field: field,
                size: size
            };
            this.clearExtrema();
        }
        return this;
    };

    var getTopTerms = function() {
        return this._params.top_terms;
    };

    module.exports = {
        setTopTerms: setTopTerms,
        getTopTerms: getTopTerms
    };

}());

},{}],41:[function(require,module,exports){
(function() {

    'use strict';

    var Live = require('../core/Live');
    var Binning = require('../params/Binning');
    var MetricAgg = require('../params/MetricAgg');
    var TermsFilter = require('../params/TermsFilter');
    var BoolQuery = require('../params/BoolQuery');
    var PrefixFilter = require('../params/PrefixFilter');
    var Range = require('../params/Range');
    var QueryString = require('../params/QueryString');
    var ColorRamp = require('../mixins/ColorRamp');
    var ValueTransform = require('../mixins/ValueTransform');

    var Heatmap = Live.extend({

        includes: [
            // params
            Binning,
            MetricAgg,
            TermsFilter,
            BoolQuery,
            PrefixFilter,
            Range,
            QueryString,
            // mixins
            ColorRamp,
            ValueTransform
        ],

        type: 'heatmap',

        initialize: function() {
            ColorRamp.initialize.apply(this, arguments);
            ValueTransform.initialize.apply(this, arguments);
            // base
            Live.prototype.initialize.apply(this, arguments);
        },

        extractExtrema: function(data) {
            var bins = new Float64Array(data);
            return {
                min: _.min(bins),
                max: _.max(bins)
            };
        }

    });

    module.exports = Heatmap;

}());

},{"../core/Live":24,"../mixins/ColorRamp":27,"../mixins/ValueTransform":28,"../params/Binning":29,"../params/BoolQuery":30,"../params/MetricAgg":33,"../params/PrefixFilter":34,"../params/QueryString":35,"../params/Range":36,"../params/TermsFilter":38}],42:[function(require,module,exports){
(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../params/Tiling');
    var TermsFilter = require('../params/TermsFilter');
    var PrefixFilter = require('../params/PrefixFilter');
    var TopTerms = require('../params/TopTerms');
    var Range = require('../params/Range');
    var Histogram = require('../params/Histogram');
    var ValueTransform = require('../mixins/ValueTransform');

    var TopCount = Live.extend({

        includes: [
            // params
            Tiling,
            TopTerms,
            TermsFilter,
            PrefixFilter,
            Range,
            Histogram,
            // mixins
            ValueTransform
        ],

        type: 'top_count',

        initialize: function() {
            ValueTransform.initialize.apply(this, arguments);
            // base
            Live.prototype.initialize.apply(this, arguments);
        },

    });

    module.exports = TopCount;

}());

},{"../core/Live":24,"../mixins/ValueTransform":28,"../params/Histogram":32,"../params/PrefixFilter":34,"../params/Range":36,"../params/TermsFilter":38,"../params/Tiling":39,"../params/TopTerms":40}],43:[function(require,module,exports){
(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../params/Tiling');
    var TopTerms = require('../params/TopTerms');
    var TermsFilter = require('../params/TermsFilter');
    var PrefixFilter = require('../params/PrefixFilter');
    var Range = require('../params/Range');
    var DateHistogram = require('../params/DateHistogram');
    var Histogram = require('../params/Histogram');
    var ValueTransform = require('../mixins/ValueTransform');

    var TopFrequency = Live.extend({

        includes: [
            // params
            Tiling,
            TopTerms,
            TermsFilter,
            PrefixFilter,
            Range,
            DateHistogram,
            Histogram,
            // mixins
            ValueTransform
        ],

        type: 'top_frequency',

        initialize: function() {
            ValueTransform.initialize.apply(this, arguments);
            // base
            Live.prototype.initialize.apply(this, arguments);
        },

    });

    module.exports = TopFrequency;

}());

},{"../core/Live":24,"../mixins/ValueTransform":28,"../params/DateHistogram":31,"../params/Histogram":32,"../params/PrefixFilter":34,"../params/Range":36,"../params/TermsFilter":38,"../params/Tiling":39,"../params/TopTerms":40}],44:[function(require,module,exports){
(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../params/Tiling');
    var TermsAgg = require('../params/TermsAgg');
    var Range = require('../params/Range');
    var Histogram = require('../params/Histogram');
    var ValueTransform = require('../mixins/ValueTransform');

    var TopicCount = Live.extend({

        includes: [
            // params
            Tiling,
            TermsAgg,
            Range,
            Histogram,
            // mixins
            ValueTransform
        ],

        type: 'topic_count',

        initialize: function() {
            ValueTransform.initialize.apply(this, arguments);
            // base
            Live.prototype.initialize.apply(this, arguments);
        },

    });

    module.exports = TopicCount;

}());

},{"../core/Live":24,"../mixins/ValueTransform":28,"../params/Histogram":32,"../params/Range":36,"../params/TermsAgg":37,"../params/Tiling":39}],45:[function(require,module,exports){
(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../params/Tiling');
    var TermsAgg = require('../params/TermsAgg');
    var Range = require('../params/Range');
    var DateHistogram = require('../params/DateHistogram');
    var Histogram = require('../params/Histogram');
    var ValueTransform = require('../mixins/ValueTransform');

    var TopicFrequency = Live.extend({

        includes: [
            // params
            Tiling,
            TermsAgg,
            Range,
            DateHistogram,
            Histogram,
            // mixins
            ValueTransform
        ],

        type: 'topic_frequency',

        initialize: function() {
            ValueTransform.initialize.apply(this, arguments);
            // base
            Live.prototype.initialize.apply(this, arguments);
        },

    });

    module.exports = TopicFrequency;

}());

},{"../core/Live":24,"../mixins/ValueTransform":28,"../params/DateHistogram":31,"../params/Histogram":32,"../params/Range":36,"../params/TermsAgg":37,"../params/Tiling":39}],46:[function(require,module,exports){
(function() {

    'use strict';

    var DOM = require('./DOM');

    var Canvas = DOM.extend({

        _createTile: function() {
            var tile = L.DomUtil.create('canvas', 'leaflet-tile');
            tile.width = tile.height = this.options.tileSize;
            tile.onselectstart = tile.onmousemove = L.Util.falseFn;
            return tile;
        }

    });

    module.exports = Canvas;

}());

},{"./DOM":47}],47:[function(require,module,exports){
(function() {

    'use strict';

    var Image = require('../../layer/core/Image');

    var DOM = Image.extend({

        onAdd: function(map) {
            L.TileLayer.prototype.onAdd.call(this, map);
            map.on('zoomstart', this.clearExtrema, this);
        },

        onRemove: function(map) {
            map.off('zoomstart', this.clearExtrema, this);
            L.TileLayer.prototype.onRemove.call(this, map);
        },

        redraw: function() {
            if (this._map) {
                this._reset({
                    hard: true
                });
                this._update();
            }
            return this;
        },

        _createTile: function() {
            // override
        },

        _loadTile: function(tile, tilePoint) {
            tile._layer = this;
            tile._tilePoint = tilePoint;
            tile._unadjustedTilePoint = {
                x: tilePoint.x,
                y: tilePoint.y
            };
            tile.dataset.x = tilePoint.x;
            tile.dataset.y = tilePoint.y;
            this._adjustTilePoint(tilePoint);
            this._redrawTile(tile);
        },

        _adjustTileKey: function(key) {
            // when dealing with wrapped tiles, internally leafet will use
            // coordinates n < 0 and n > (2^z) to position them correctly.
            // this function converts that to the modulos key used to cache them
            // data.
            // Ex. '-1:3' at z = 2 becomes '3:3'
            var kArr = key.split(':');
            var x = parseInt(kArr[0], 10);
            var y = parseInt(kArr[1], 10);
            var tilePoint = {
                x: x,
                y: y
            };
            this._adjustTilePoint(tilePoint);
            return tilePoint.x + ':' + tilePoint.y + ':' + tilePoint.z;
        },

        _removeTile: function(key) {
            var adjustedKey = this._adjustTileKey(key);
            var cached = this._cache[adjustedKey];
            // remove the tile from the cache
            delete cached.tiles[key];
            if (_.keys(cached.tiles).length === 0) {
                // no more tiles use this cached data, so delete it
                delete this._cache[adjustedKey];
            }
            // call parent method
            L.TileLayer.prototype._removeTile.call(this, key);
        },

        _redrawTile: function(tile) {
            var self = this;
            var cache = this._cache;
            var coord = {
                x: tile._tilePoint.x,
                y: tile._tilePoint.y,
                z: this._map._zoom
            };
            // use the adjusted coordinates to hash the the cache values, this
            // is because we want to only have one copy of the data
            var hash = coord.x + ':' + coord.y + ':' + coord.z;
            // use the unadjsuted coordinates to track which 'wrapped' tiles
            // used the cached data
            var unadjustedHash = tile._unadjustedTilePoint.x + ':' + tile._unadjustedTilePoint.y;
            // check cache
            var cached = cache[hash];
            if (cached) {
                if (cached.isPending) {
                    // currently pending
                    // store the tile in the cache to draw to later
                    cached.tiles[unadjustedHash] = tile;
                } else {
                    // already requested
                    // store the tile in the cache
                    cached.tiles[unadjustedHash] = tile;
                    // draw the tile
                    self.renderTile(tile, cached.data);
                    self.tileDrawn(tile);
                }
            } else {
                // create a cache entry
                cache[hash] = {
                    isPending: true,
                    tiles: {},
                    data: null
                };
                // add tile to the cache entry
                cache[hash].tiles[unadjustedHash] = tile;
                // request the tile
                this.requestTile(coord, function(data) {
                    var cached = cache[hash];
                    if (!cached) {
                        // tile is no longer being tracked, ignore
                        return;
                    }
                    cached.isPending = false;
                    cached.data = data;
                    // update the extrema
                    if (data && self.updateExtrema(data)) {
                        // extrema changed, redraw all tiles
                        self.redraw();
                    } else {
                        // same extrema, we are good to render the tiles. In
                        // the case of a map with wraparound, we may have
                        // multiple tiles dependent on the response, so iterate
                        // over each tile and draw it.
                        _.forIn(cached.tiles, function(tile) {
                            self.renderTile(tile, data);
                            self.tileDrawn(tile);
                        });
                    }
                });
            }
        },

        tileDrawn: function(tile) {
            this._tileOnLoad.call(tile);
        },

        requestTile: function() {
            // override
        },

        renderTile: function() {
            // override
        },

    });

    module.exports = DOM;

}());

},{"../../layer/core/Image":23}],48:[function(require,module,exports){
(function() {

    'use strict';

    var DOM = require('./DOM');

    var HTML = DOM.extend({

        options: {
            handlers: {}
        },

        onAdd: function(map) {
            var self = this;
            DOM.prototype.onAdd.call(this, map);
            map.on('click', this.onClick, this);
            $(this._container).on('mouseover', function(e) {
                self.onMouseOver(e);
            });
            $(this._container).on('mouseout', function(e) {
                self.onMouseOut(e);
            });
        },

        onRemove: function(map) {
            map.off('click', this.onClick, this);
            $(this._container).off('mouseover');
            $(this._container).off('mouseout');
            DOM.prototype.onRemove.call(this, map);
        },

        _createTile: function() {
            var tile = L.DomUtil.create('div', 'leaflet-tile leaflet-html-tile');
            tile.width = this.options.tileSize;
            tile.height = this.options.tileSize;
            tile.onselectstart = L.Util.falseFn;
            tile.onmousemove = L.Util.falseFn;
            return tile;
        },

        onMouseOver: function() {
            // override
        },

        onMouseOut: function() {
            // override
        },


        onClick: function() {
            // override
        }

    });

    module.exports = HTML;

}());

},{"./DOM":47}],49:[function(require,module,exports){
(function() {

    'use strict';

    var esper = require('esper');

    function translationMatrix(translation) {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            translation[0], translation[1], translation[2], 1
        ]);
    }

    function orthoMatrix(left, right, bottom, top, near, far) {
        var mat = new Float32Array(16);
        mat[0] = 2 / ( right - left );
        mat[1] = 0;
        mat[2] = 0;
        mat[3] = 0;
        mat[4] = 0;
        mat[5] = 2 / ( top - bottom );
        mat[6] = 0;
        mat[7] = 0;
        mat[8] = 0;
        mat[9] = 0;
        mat[10] = -2 / ( far - near );
        mat[11] = 0;
        mat[12] = -( ( right + left ) / ( right - left ) );
        mat[13] = -( ( top + bottom ) / ( top - bottom ) );
        mat[14] = -( ( far + near ) / ( far - near ) );
        mat[15] = 1;
        return mat;
    }

    // TODO:
    //     - fix zoom transition animation bug
    //     - fix show / hide bug

    var WebGL = L.Class.extend({

        includes: [
            L.Mixin.Events
        ],

        options: {
            minZoom: 0,
            maxZoom: 18,
            zoomOffset: 0,
            opacity: 1,
            shaders: {
                vert: null,
                frag: null
            },
            unloadInvisibleTiles: L.Browser.mobile,
            updateWhenIdle: L.Browser.mobile
        },

        initialize: function(meta, options) {
            options = L.setOptions(this, options);
            if (options.bounds) {
                options.bounds = L.latLngBounds(options.bounds);
            }
        },

        getOpacity: function() {
            return this.options.opacity;
        },

        show: function() {
            this._hidden = false;
            this._prevMap.addLayer(this);
        },

        hide: function() {
            this._hidden = true;
            this._prevMap = this._map;
            this._map.removeLayer(this);
        },

        isHidden: function() {
            return this._hidden;
        },

        onAdd: function(map) {
            this._map = map;
            this._animated = map._zoomAnimated;
            if (!this._canvas) {
                // create canvas
                this._initCanvas();
                map._panes.tilePane.appendChild(this._canvas);
                // initialize the webgl context
                this._initGL();
            } else {
                map._panes.tilePane.appendChild(this._canvas);
            }
            // set up events
            map.on({
                'resize': this._resize,
                'viewreset': this._reset,
                'moveend': this._update,
                'zoomstart': this.clearExtrema
            }, this);
            if (map.options.zoomAnimation && L.Browser.any3d) {
                map.on({
                    'zoomstart': this._enableZooming,
                    'zoomanim': this._animateZoom,
                    'zoomend': this._disableZooming,
                }, this);
            }
            if (!this.options.updateWhenIdle) {
                this._limitedUpdate = L.Util.limitExecByInterval(this._update, 150, this);
                map.on('move', this._limitedUpdate, this);
            }
            this._reset();
            this._update();
        },

        addTo: function(map) {
            map.addLayer(this);
            return this;
        },

        onRemove: function(map) {
            // clear the current buffer
            this._clearBackBuffer();
            map.getPanes().tilePane.removeChild(this._canvas);
            map.off({
                'resize': this._resize,
                'viewreset': this._reset,
                'moveend': this._update,
                'zoomstart': this.clearExtrema
            }, this);
            if (map.options.zoomAnimation) {
                map.off({
                    'zoomstart': this._enableZooming,
                    'zoomanim': this._animateZoom,
                    'zoomend': this._disableZooming
                }, this);
            }
            if (!this.options.updateWhenIdle) {
                map.off('move', this._limitedUpdate, this);
            }
            this._map = null;
            this._animated = null;
            this._isZooming = false;
            this._cache = {};
        },

        _enableZooming: function() {
            this._isZooming = true;
        },

        _disableZooming: function() {
            this._isZooming = false;
            this._clearBackBuffer();
        },

        bringToFront: function() {
            var pane = this._map._panes.tilePane;
            if (this._canvas) {
                pane.appendChild(this._canvas);
                this._setAutoZIndex(pane, Math.max);
            }
            return this;
        },

        bringToBack: function() {
            var pane = this._map._panes.tilePane;
            if (this._canvas) {
                pane.insertBefore(this._canvas, pane.firstChild);
                this._setAutoZIndex(pane, Math.min);
            }
            return this;
        },

        _setAutoZIndex: function(pane, compare) {
            var layers = pane.children;
            var edgeZIndex = -compare(Infinity, -Infinity); // -Infinity for max, Infinity for min
            var zIndex;
            var i;
            var len;
            for (i = 0, len = layers.length; i < len; i++) {
                if (layers[i] !== this._canvas) {
                    zIndex = parseInt(layers[i].style.zIndex, 10);
                    if (!isNaN(zIndex)) {
                        edgeZIndex = compare(edgeZIndex, zIndex);
                    }
                }
            }
            this.options.zIndex = this._canvas.style.zIndex = (isFinite(edgeZIndex) ? edgeZIndex : 0) + compare(1, -1);
        },

        setOpacity: function(opacity) {
            this.options.opacity = opacity;
            return this;
        },

        setZIndex: function(zIndex) {
            this.options.zIndex = zIndex;
            this._updateZIndex();
            return this;
        },

        _updateZIndex: function() {
            if (this._canvas && this.options.zIndex !== undefined) {
                this._canvas.style.zIndex = this.options.zIndex;
            }
        },

        _reset: function(e) {
            var self = this;
            _.forIn(this._tiles, function(tile) {
                self.fire('tileunload', {
                    tile: tile
                });
            });
            this._tiles = {};
            this._tilesToLoad = 0;
            if (this._animated && e && e.hard) {
                this._clearBackBuffer();
            }
        },

        _update: function() {
            if (!this._map) {
                return;
            }
            var map = this._map;
            var bounds = map.getPixelBounds();
            var zoom = map.getZoom();
            var tileSize = this._getTileSize();
            if (zoom > this.options.maxZoom ||
                zoom < this.options.minZoom) {
                return;
            }
            var tileBounds = L.bounds(
                bounds.min.divideBy(tileSize)._floor(),
                bounds.max.divideBy(tileSize)._floor());
            this._addTilesFromCenterOut(tileBounds);
            if (this.options.unloadInvisibleTiles) {
                this._removeOtherTiles(tileBounds);
            }
        },

        _addTilesFromCenterOut: function(bounds) {
            var queue = [];
            var center = bounds.getCenter();
            var j;
            var i;
            var point;
            for (j = bounds.min.y; j <= bounds.max.y; j++) {
                for (i = bounds.min.x; i <= bounds.max.x; i++) {
                    point = new L.Point(i, j);
                    if (this._tileShouldBeLoaded(point)) {
                        queue.push(point);
                    }
                }
            }
            var tilesToLoad = queue.length;
            if (tilesToLoad === 0) {
                return;
            }
            // load tiles in order of their distance to center
            queue.sort(function(a, b) {
                return a.distanceTo(center) - b.distanceTo(center);
            });
            // if its the first batch of tiles to load
            if (!this._tilesToLoad) {
                this.fire('loading');
            }
            this._tilesToLoad += tilesToLoad;
            for (i = 0; i < tilesToLoad; i++) {
                this._addTile(queue[i]);
            }
        },

        _tileShouldBeLoaded: function(tilePoint) {
            if ((tilePoint.x + ':' + tilePoint.y) in this._tiles) {
                return false; // already loaded
            }
            var options = this.options;
            if (!options.continuousWorld) {
                var limit = this._getWrapTileNum();
                // don't load if exceeds world bounds
                if ((options.noWrap && (tilePoint.x < 0 || tilePoint.x >= limit.x)) ||
                    tilePoint.y < 0 || tilePoint.y >= limit.y) {
                    return false;
                }
            }
            if (options.bounds) {
                var tileSize = this._getTileSize();
                var nwPoint = tilePoint.multiplyBy(tileSize);
                var sePoint = nwPoint.add([tileSize, tileSize]);
                var nw = this._map.unproject(nwPoint);
                var se = this._map.unproject(sePoint);
                // TODO temporary hack, will be removed after refactoring projections
                // https://github.com/Leaflet/Leaflet/issues/1618
                if (!options.continuousWorld && !options.noWrap) {
                    nw = nw.wrap();
                    se = se.wrap();
                }
                if (!options.bounds.intersects([nw, se])) {
                    return false;
                }
            }
            return true;
        },

        _removeOtherTiles: function(bounds) {
            var self = this;
            _.forIn(this._tiles, function(tile, key) {
                var kArr = key.split(':');
                var x = parseInt(kArr[0], 10);
                var y = parseInt(kArr[1], 10);
                // remove tile if it's out of bounds
                if (x < bounds.min.x ||
                    x > bounds.max.x ||
                    y < bounds.min.y ||
                    y > bounds.max.y) {
                    self._removeTile(key);
                }
            });
        },

        _getTileSize: function() {
            var map = this._map;
            var zoom = map.getZoom() + this.options.zoomOffset;
            var zoomN = this.options.maxNativeZoom;
            var tileSize = 256;
            if (zoomN && zoom > zoomN) {
                tileSize = Math.round(map.getZoomScale(zoom) / map.getZoomScale(zoomN) * tileSize);
            }
            return tileSize;
        },

        redraw: function() {
            if (this._map) {
                this._reset({
                    hard: true
                });
                this._update();
            }
            return this;
        },

        _createTile: function() {
            return {};
        },

        _addTile: function(tilePoint) {
            // create a new tile
            var tile = this._createTile();
            this._tiles[tilePoint.x + ':' + tilePoint.y] = tile;
            this._loadTile(tile, tilePoint);
        },

        _loadTile: function(tile, tilePoint) {
            tile._layer = this;
            tile._tilePoint = tilePoint;
            tile._unadjustedTilePoint = {
                x: tilePoint.x,
                y: tilePoint.y
            };
            this._adjustTilePoint(tilePoint);
            this._redrawTile(tile);
        },

        _adjustTileKey: function(key) {
            // when dealing with wrapped tiles, internally leafet will use
            // coordinates n < 0 and n > (2^z) to position them correctly.
            // this function converts that to the modulos key used to cache them
            // data.
            // Ex. '-1:3' at z = 2 becomes '3:3'
            var kArr = key.split(':');
            var x = parseInt(kArr[0], 10);
            var y = parseInt(kArr[1], 10);
            var tilePoint = {
                x: x,
                y: y
            };
            this._adjustTilePoint(tilePoint);
            return tilePoint.x + ':' + tilePoint.y + ':' + tilePoint.z;
        },

        _getZoomForUrl: function() {
            var options = this.options;
            var zoom = this._map.getZoom();
            if (options.zoomReverse) {
                zoom = options.maxZoom - zoom;
            }
            zoom += options.zoomOffset;
            return options.maxNativeZoom ? Math.min(zoom, options.maxNativeZoom) : zoom;
        },

        _getTilePos: function(tilePoint) {
            var origin = this._map.getPixelOrigin();
            var tileSize = this._getTileSize();
            return tilePoint.multiplyBy(tileSize).subtract(origin);
        },

        _getWrapTileNum: function() {
            var crs = this._map.options.crs;
            var size = crs.getSize(this._map.getZoom());
            return size.divideBy(this._getTileSize())._floor();
        },

        _adjustTilePoint: function(tilePoint) {
            var limit = this._getWrapTileNum();
            // wrap tile coordinates
            if (!this.options.continuousWorld && !this.options.noWrap) {
                tilePoint.x = ((tilePoint.x % limit.x) + limit.x) % limit.x;
            }
            if (this.options.tms) {
                tilePoint.y = limit.y - tilePoint.y - 1;
            }
            tilePoint.z = this._getZoomForUrl();
        },

        _removeTile: function(key) {
            var adjustedKey = this._adjustTileKey(key);
            var cached = this._cache[adjustedKey];
            // remove the tile from the cache
            delete cached.tiles[key];
            if (_.keys(cached.tiles).length === 0) {
                // no more tiles use this cached data, so delete it
                delete this._cache[adjustedKey];
            }
            // unload the tile
            var tile = this._tiles[key];
            this.fire('tileunload', {
                tile: tile
            });
            delete this._tiles[key];
        },

        _tileLoaded: function() {
            this._tilesToLoad--;
            if (this._animated) {
                L.DomUtil.addClass(this._canvas, 'leaflet-zoom-animated');
            }
            if (!this._tilesToLoad) {
                this.fire('load');
                if (this._animated) {
                    // clear scaled tiles after all new tiles are loaded (for performance)
                    clearTimeout(this._clearBufferTimer);
                    this._clearBufferTimer = setTimeout(L.bind(this._clearBackBuffer, this), 500);
                }
            }
        },

        _tileOnLoad: function() {
            var layer = this._layer;
            L.DomUtil.addClass(this, 'leaflet-tile-loaded');
            layer.fire('tileload', {
                tile: this
            });
            layer._tileLoaded();
        },

        _tileOnError: function() {
            var layer = this._layer;
            layer.fire('tileerror', {
                tile: this
            });
            layer._tileLoaded();
        },

        _encodeFloatAsUint8: function(num) {
            return new Uint8Array([
                (num & 0xff000000) >> 24,
                (num & 0x00ff0000) >> 16,
                (num & 0x0000ff00) >> 8,
                (num & 0x000000ff)
            ]);
        },

        _createDataTexture: function(data) {
            var doubles = new Float64Array(data);
            var resolution = Math.sqrt(doubles.length);
            var buffer = new ArrayBuffer(resolution * resolution * 4);
            var encodedBins = new Uint8Array(buffer);
            for (var i = 0; i < resolution * resolution; i++) {
                // cast from float64 to float32
                var enc = this._encodeFloatAsUint8(doubles[i]);
                encodedBins[i * 4] = enc[0];
                encodedBins[i * 4 + 1] = enc[1];
                encodedBins[i * 4 + 2] = enc[2];
                encodedBins[i * 4 + 3] = enc[3];
            }
            return new esper.Texture2D({
                height: resolution,
                width: resolution,
                data: encodedBins,
                format: 'RGBA',
                type: 'UNSIGNED_BYTE',
                wrap: 'CLAMP_TO_EDGE',
                filter: 'NEAREST',
                invertY: true
            });
        },

        _redrawTile: function(tile) {
            var self = this;
            var cache = this._cache;
            var coord = {
                x: tile._tilePoint.x,
                y: tile._tilePoint.y,
                z: this._map._zoom
            };
            // use the adjusted coordinates to hash the the cache values, this
            // is because we want to only have one copy of the data
            var hash = coord.x + ':' + coord.y + ':' + coord.z;
            // use the unadjsuted coordinates to track which 'wrapped' tiles
            // used the cached data
            var unadjustedHash = tile._unadjustedTilePoint.x + ':' + tile._unadjustedTilePoint.y;
            // check cache
            var cached = cache[hash];
            if (cached) {
                // store the tile in the cache to draw to later
                cached.tiles[unadjustedHash] = tile;
            } else {
                // create a cache entry
                cache[hash] = {
                    isPending: true,
                    tiles: {},
                    data: null
                };
                // add tile to the cache entry
                cache[hash].tiles[unadjustedHash] = tile;
                // request the tile
                this.requestTile(coord, function(data) {
                    var cached = cache[hash];
                    if (!cached) {
                        // tile is no longer being tracked, ignore
                        return;
                    }
                    cached.isPending = false;
                    // if data is null, exit early
                    if (data === null) {
                        return;
                    }
                    // update the extrema
                    self.updateExtrema(data);
                    cached.data = self._createDataTexture(data);
                });
            }
        },

        _initGL: function() {
            var self = this;
            var gl = this._gl = esper.WebGLContext.get(this._canvas);
            // handle missing context
            if (!gl) {
                console.error('Unable to acquire a WebGL context.');
                return;
            }
            // init the webgl state
            gl.clearColor(0, 0, 0, 0);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.disable(gl.DEPTH_TEST);
            // create tile renderable
            self._renderable = new esper.Renderable({
                vertices: {
                    0: [
                        [0, -256],
                        [256, -256],
                        [256, 0],
                        [0, 0]
                    ],
                    1: [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1]
                    ]
                },
                indices: [
                    0, 1, 2,
                    0, 2, 3
                ]
            });
            // load shaders
            this._shader = new esper.Shader({
                vert: this.options.shaders.vert,
                frag: this.options.shaders.frag
            }, function() {
                // execute callback
                var width = self._canvas.width;
                var height = self._canvas.height;
                self._viewport = new esper.Viewport({
                    width: width,
                    height: height
                });
                self._initialized = true;
                self._draw();
            });
        },

        _initCanvas: function() {
            this._canvas = L.DomUtil.create('canvas', 'leaflet-webgl-layer leaflet-layer');
            var size = this._map.getSize();
            this._canvas.width = size.x;
            this._canvas.height = size.y;
            var animated = this._map.options.zoomAnimation && L.Browser.any3d;
            L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));
        },

        _getProjection: function() {
            var bounds = this._map.getPixelBounds();
            var dim = Math.pow(2, this._map.getZoom()) * 256;
            return orthoMatrix(
                bounds.min.x,
                bounds.max.x,
                (dim - bounds.max.y),
                (dim - bounds.min.y),
                -1, 1);
        },

        _clearBackBuffer: function() {
            if (!this._gl) {
                return;
            }
            var gl = this._gl;
            gl.clear(gl.COLOR_BUFFER_BIT);
        },

        _animateZoom: function(e) {
            var scale = this._map.getZoomScale(e.zoom);
            var offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());
            this._canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ')';
        },

        _resize: function(resizeEvent) {
            var width = resizeEvent.newSize.x;
            var height = resizeEvent.newSize.y;
            if (this._initialized) {
                this._viewport.resize(width, height);
            }
        },

        _draw: function() {
            if (this._initialized && this._gl) {
                if (!this.isHidden()) {
                    // re-position canvas
                    if (!this._isZooming) {
                        var topLeft = this._map.containerPointToLayerPoint([0, 0]);
                        L.DomUtil.setPosition(this._canvas, topLeft);
                    }
                    this._beforeDraw();
                    this.beforeDraw();
                    this.draw();
                    this.afterDraw();
                    this._afterDraw();
                }
                requestAnimationFrame(this._draw.bind(this));
            }
        },

        beforeDraw: function() {
            // override
        },

        _beforeDraw: function() {
            this._viewport.push();
            this._shader.push();
            this._shader.setUniform('uProjectionMatrix', this._getProjection());
            this._shader.setUniform('uOpacity', this.getOpacity());
            this._shader.setUniform('uTextureSampler', 0);
        },

        afterDraw: function() {
            // override
        },

        _afterDraw: function() {
            this._shader.pop();
            this._viewport.pop();
        },

        draw: function() {
            var self = this;
            var dim = Math.pow(2, this._map.getZoom()) * 256;
            // for each tile
            _.forIn(this._cache, function(cached) {
                if (cached.isPending || !cached.data) {
                    return;
                }
                // bind tile texture to texture unit 0
                cached.data.push(0);
                _.forIn(cached.tiles, function(tile, key) {
                    // find the tiles position from its key
                    var kArr = key.split(':');
                    var x = parseInt(kArr[0], 10);
                    var y = parseInt(kArr[1], 10);
                    // create model matrix
                    var model = new translationMatrix([
                        256 * x,
                        dim - (256 * y),
                        0
                    ]);
                    self._shader.setUniform('uModelMatrix', model);
                    // draw the tile
                    self._renderable.draw();
                });
            // no need to unbind texture
            });
        },

        requestTile: function() {
            // override
        }

    });

    module.exports = WebGL;

}());

},{"esper":12}],50:[function(require,module,exports){
(function() {

    'use strict';

    // canvas renderers
    var Canvas = {
        Heatmap: require('./types/canvas/Heatmap')
    };

    // html renderers
    var HTML = {
        Heatmap: require('./types/html/Heatmap'),
        Ring: require('./types/html/Ring'),
        WordCloud: require('./types/html/WordCloud'),
        WordHistogram: require('./types/html/WordHistogram')
    };

    // webgl renderers
    var WebGL = {
        Heatmap: require('./types/webgl/Heatmap')
    };

    // pending layer renderers
    var Pending = {
        Blink: require('./types/pending/Blink'),
        Spin: require('./types/pending/Spin'),
        BlinkSpin: require('./types/pending/BlinkSpin'),
    };

    // pending layer renderers
    var Debug = {
        Coord: require('./types/debug/Coord')
    };

    module.exports = {
        HTML: HTML,
        Canvas: Canvas,
        WebGL: WebGL,
        Debug: Debug,
        Pending: Pending
    };

}());

},{"./types/canvas/Heatmap":52,"./types/debug/Coord":53,"./types/html/Heatmap":54,"./types/html/Ring":55,"./types/html/WordCloud":56,"./types/html/WordHistogram":57,"./types/pending/Blink":58,"./types/pending/BlinkSpin":59,"./types/pending/Spin":60,"./types/webgl/Heatmap":61}],51:[function(require,module,exports){
(function() {

    'use strict';

    var POSITIVE = '1';
    var NEUTRAL = '0';
    var NEGATIVE = '-1';

    function getClassFunc(min, max) {
        min = min !== undefined ? min : -1;
        max = max !== undefined ? max : 1;
        var positive = [0.25 * max, 0.5 * max, 0.75 * max];
        var negative = [-0.25 * min, -0.5 * min, -0.75 * min];
        return function(sentiment) {
            var prefix;
            var range;
            if (sentiment < 0) {
                prefix = 'neg-';
                range = negative;
            } else {
                prefix = 'pos-';
                range = positive;
            }
            var abs = Math.abs(sentiment);
            if (abs > range[2]) {
                return prefix + '4';
            } else if (abs > range[1]) {
                return prefix + '3';
            } else if (abs > range[0]) {
                return prefix + '2';
            }
            return prefix + '1';
        };
    }

    function getTotal(count) {
        if (!count) {
            return 0;
        }
        var pos = count[POSITIVE] ? count[POSITIVE] : 0;
        var neu = count[NEUTRAL] ? count[NEUTRAL] : 0;
        var neg = count[NEGATIVE] ? count[NEGATIVE] : 0;
        return pos + neu + neg;
    }

    function getAvg(count) {
        if (!count) {
            return 0;
        }
        var pos = count[POSITIVE] ? count[POSITIVE] : 0;
        var neu = count[NEUTRAL] ? count[NEUTRAL] : 0;
        var neg = count[NEGATIVE] ? count[NEGATIVE] : 0;
        var total = pos + neu + neg;
        return (total !== 0) ? (pos - neg) / total : 0;
    }

    module.exports = {
        getClassFunc: getClassFunc,
        getTotal: getTotal,
        getAvg: getAvg
    };

}());

},{}],52:[function(require,module,exports){
(function() {

    'use strict';

    var Canvas = require('../../core/Canvas');

    var Heatmap = Canvas.extend({

        renderCanvas: function(bins, resolution, rampFunc) {
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
                    rampFunc(rval, color);
                }
                data[i * 4] = color[0];
                data[i * 4 + 1] = color[1];
                data[i * 4 + 2] = color[2];
                data[i * 4 + 3] = color[3];
            }
            ctx.putImageData(imageData, 0, 0);
            return canvas;
        },

        renderTile: function(canvas, data) {
            if (!data) {
                return;
            }
            var bins = new Float64Array(data);
            var resolution = Math.sqrt(bins.length);
            var ramp = this.getColorRamp();
            var tileCanvas = this.renderCanvas(bins, resolution, ramp);
            var ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                tileCanvas,
                0, 0,
                resolution, resolution,
                0, 0,
                canvas.width, canvas.height);
        }

    });

    module.exports = Heatmap;

}());

},{"../../core/Canvas":46}],53:[function(require,module,exports){
(function() {

    'use strict';

    module.exports = {

        renderTile: function(elem, coord) {
            $(elem).empty();
            $(elem).append('<div style="top:0; left:0;">' + coord.z + ', ' + coord.x + ', ' + coord.y + '</div>');
        }

    };

}());

},{}],54:[function(require,module,exports){
(function() {

    'use strict';

    var HTML = require('../../core/HTML');

    var TILE_SIZE = 256;

    var Heatmap = HTML.extend({

        isTargetLayer: function( elem ) {
            return this._container && $.contains(this._container, elem );
        },

        clearSelection: function() {
            $(this._container).removeClass('highlight');
            this.highlight = null;
        },

        onMouseOver: function(e) {
            var target = $(e.originalEvent.target);
            var value = target.attr('data-value');
            if (value) {
                if (this.options.handlers.mouseover) {
                    var $parent = target.parents('.leaflet-html-tile');
                    this.options.handlers.mouseover(target, {
                        value: parseInt(value, 10),
                        x: parseInt($parent.attr('data-x'), 10),
                        y: parseInt($parent.attr('data-y'), 10),
                        z: this._map.getZoom(),
                        bx: parseInt(target.attr('data-bx'), 10),
                        by: parseInt(target.attr('data-by'), 10),
                        type: 'heatmap',
                        layer: this
                    });
                }
            }
        },

        onMouseOut: function(e) {
            var target = $(e.originalEvent.target);
            var value = target.attr('data-value');
            if (value) {
                if (this.options.handlers.mouseout) {
                    var $parent = target.parents('.leaflet-html-tile');
                    this.options.handlers.mouseout(target, {
                        value: value,
                        x: parseInt($parent.attr('data-x'), 10),
                        y: parseInt($parent.attr('data-y'), 10),
                        z: this._map.getZoom(),
                        bx: parseInt(target.attr('data-bx'), 10),
                        by: parseInt(target.attr('data-by'), 10),
                        type: 'heatmap',
                        layer: this
                    });
                }
            }
        },

        onClick: function(e) {
            // un-select any prev selected pixel
            $('.heatmap-pixel').removeClass('highlight');
            // get target
            var target = $(e.originalEvent.target);
            if (!this.isTargetLayer(e.originalEvent.target)) {
                // this layer is not the target
                return;
            }
            if ( target.hasClass('heatmap-pixel') ) {
                target.addClass('highlight');
            }
            var value = target.attr('data-value');
            if (value) {
                if (this.options.handlers.click) {
                    var $parent = target.parents('.leaflet-html-tile');
                    this.options.handlers.click(target, {
                        value: value,
                        x: parseInt($parent.attr('data-x'), 10),
                        y: parseInt($parent.attr('data-y'), 10),
                        z: this._map.getZoom(),
                        bx: parseInt(target.attr('data-bx'), 10),
                        by: parseInt(target.attr('data-by'), 10),
                        type: 'heatmap',
                        layer: this
                    });
                }
            }
        },

        renderTile: function(container, data) {
            if (!data) {
                return;
            }
            var bins = new Float64Array(data);
            var resolution = Math.sqrt(bins.length);
            var rampFunc = this.getColorRamp();
            var pixelSize = TILE_SIZE / resolution;
            var self = this;
            var color = [0, 0, 0, 0];
            var html = '';
            var nval, rval, bin;
            var left, top;
            var i;
            for (i=0; i<bins.length; i++) {
                bin = bins[i];
                if (bin === 0) {
                    continue;
                } else {
                    left = (i % resolution);
                    top = Math.floor(i / resolution);
                    nval = self.transformValue(bin);
                    rval = self.interpolateToRange(nval);
                    rampFunc(rval, color);
                }
                var rgba = 'rgba(' +
                    color[0] + ',' +
                    color[1] + ',' +
                    color[2] + ',' +
                    (color[3] / 255) + ')';
                html += '<div class="heatmap-pixel" ' +
                    'data-value="' + bin + '" ' +
                    'data-bx="' + left + '" ' +
                    'data-by="' + top + '" ' +
                    'style="' +
                    'height:' + pixelSize + 'px;' +
                    'width:' + pixelSize + 'px;' +
                    'left:' + (left * pixelSize) + 'px;' +
                    'top:' + (top * pixelSize) + 'px;' +
                    'background-color:' + rgba + ';"></div>';
            }
            container.innerHTML = html;
        }

    });

    module.exports = Heatmap;

}());

},{"../../core/HTML":48}],55:[function(require,module,exports){
(function() {

    'use strict';

    var HTML = require('../../core/HTML');

    var TILE_SIZE = 256;

    var Heatmap = HTML.extend({

        onClick: function(e) {
            var target = $(e.originalEvent.target);
            $('.heatmap-ring').removeClass('highlight');
            if ( target.hasClass('heatmap-ring') ) {
                target.addClass('highlight');
            }
        },

        renderTile: function(container, data) {
            if (!data) {
                return;
            }
            var self = this;
            var bins = new Float64Array(data);
            var resolution = Math.sqrt(bins.length);
            var binSize = (TILE_SIZE / resolution);
            var html = '';
            bins.forEach(function(bin, index) {
                if (!bin) {
                    return;
                }
                var percent = self.transformValue(bin);
                var radius = percent * binSize;
                var offset = (binSize - radius) / 2;
                var left = (index % resolution) * binSize;
                var top = Math.floor(index / resolution) * binSize;
                html += '<div class="heatmap-ring" style="' +
                    'left:' + (left + offset) + 'px;' +
                    'top:' + (top + offset) + 'px;' +
                    'width:' + radius + 'px;' +
                    'height:' + radius + 'px;' +
                    '"></div>';
            });
            container.innerHTML = html;
        }

    });

    module.exports = Heatmap;

}());

},{"../../core/HTML":48}],56:[function(require,module,exports){
(function() {

    'use strict';

    var HTML = require('../../core/HTML');
    var sentiment = require('../../sentiment/Sentiment');
    var sentimentFunc = sentiment.getClassFunc(-1, 1);

    var TILE_SIZE = 256;
    var HALF_SIZE = TILE_SIZE / 2;
    var VERTICAL_OFFSET = 24;
    var HORIZONTAL_OFFSET = 10;
    var MAX_NUM_WORDS = 15;
    var MIN_FONT_SIZE = 10;
    var MAX_FONT_SIZE = 20;
    var NUM_ATTEMPTS = 1;

    /**
     * Given an initial position, return a new position, incrementally spiralled
     * outwards.
     */
    var spiralPosition = function(pos) {
        var pi2 = 2 * Math.PI;
        var circ = pi2 * pos.radius;
        var inc = (pos.arcLength > circ / 10) ? circ / 10 : pos.arcLength;
        var da = inc / pos.radius;
        var nt = (pos.t + da);
        if (nt > pi2) {
            nt = nt % pi2;
            pos.radius = pos.radius + pos.radiusInc;
        }
        pos.t = nt;
        pos.x = pos.radius * Math.cos(nt);
        pos.y = pos.radius * Math.sin(nt);
        return pos;
    };

    /**
     *  Returns true if bounding box a intersects bounding box b
     */
    var intersectTest = function(a, b) {
        return (Math.abs(a.x - b.x) * 2 < (a.width + b.width)) &&
            (Math.abs(a.y - b.y) * 2 < (a.height + b.height));
    };

    /**
     *  Returns true if bounding box a is not fully contained inside bounding box b
     */
    var overlapTest = function(a, b) {
        return (a.x + a.width / 2 > b.x + b.width / 2 ||
            a.x - a.width / 2 < b.x - b.width / 2 ||
            a.y + a.height / 2 > b.y + b.height / 2 ||
            a.y - a.height / 2 < b.y - b.height / 2);
    };

    /**
     * Check if a word intersects another word, or is not fully contained in the
     * tile bounding box
     */
    var intersectWord = function(position, word, cloud, bb) {
        var box = {
            x: position.x,
            y: position.y,
            height: word.height,
            width: word.width
        };
        var i;
        for (i = 0; i < cloud.length; i++) {
            if (intersectTest(box, cloud[i])) {
                return true;
            }
        }
        // make sure it doesn't intersect the border;
        if (overlapTest(box, bb)) {
            // if it hits a border, increment collision count
            // and extend arc length
            position.collisions++;
            position.arcLength = position.radius;
            return true;
        }
        return false;
    };

    var WordCloud = HTML.extend({

        isTargetLayer: function( elem ) {
            return this._container && $.contains(this._container, elem );
        },

        clearSelection: function() {
            $(this._container).removeClass('highlight');
            this.highlight = null;
        },

        onMouseOver: function(e) {
            var target = $(e.originalEvent.target);
            $('.word-cloud-label').removeClass('hover');
            var word = target.attr('data-word');
            if (word) {
                $('.word-cloud-label[data-word=' + word + ']').addClass('hover');
                if (this.options.handlers.mouseover) {
                    var $parent = target.parents('.leaflet-html-tile');
                    this.options.handlers.mouseover(target, {
                        value: word,
                        x: parseInt($parent.attr('data-x'), 10),
                        y: parseInt($parent.attr('data-y'), 10),
                        z: this._map.getZoom(),
                        type: 'word-cloud',
                        layer: this
                    });
                }
            }
        },

        onMouseOut: function(e) {
            var target = $(e.originalEvent.target);
            $('.word-cloud-label').removeClass('hover');
            var word = target.attr('data-word');
            if (word) {
                if (this.options.handlers.mouseout) {
                    var $parent = target.parents('.leaflet-html-tile');
                    this.options.handlers.mouseout(target, {
                        value: word,
                        x: parseInt($parent.attr('data-x'), 10),
                        y: parseInt($parent.attr('data-y'), 10),
                        z: this._map.getZoom(),
                        type: 'word-cloud',
                        layer: this
                    });
                }
            }
        },

        onClick: function(e) {
            // un-select any prev selected words
            $('.word-cloud-label').removeClass('highlight');
            $(this._container).removeClass('highlight');
            // get target
            var target = $(e.originalEvent.target);
            if (!this.isTargetLayer(e.originalEvent.target)) {
                // this layer is not the target
                return;
            }
            var word = target.attr('data-word');
            if (word) {
                $(this._container).addClass('highlight');
                $('.word-cloud-label[data-word=' + word + ']').addClass('highlight');
                this.highlight = word;
                if (this.options.handlers.click) {
                    var $parent = target.parents('.leaflet-html-tile');
                    this.options.handlers.click(target, {
                        value: word,
                        x: parseInt($parent.attr('data-x'), 10),
                        y: parseInt($parent.attr('data-y'), 10),
                        z: this._map.getZoom(),
                        type: 'word-cloud',
                        layer: this
                    });
                }
            } else {
                this.clearSelection();
            }
        },

        _measureWords: function(wordCounts) {
            // sort words by frequency
            wordCounts = wordCounts.sort(function(a, b) {
                return b.count - a.count;
            }).slice(0, MAX_NUM_WORDS);
            // build measurement html
            var html = '<div style="height:256px; width:256px;">';
            var self = this;
            wordCounts.forEach(function(word) {
                word.percent = self.transformValue(word.count);
                word.fontSize = MIN_FONT_SIZE + word.percent * (MAX_FONT_SIZE - MIN_FONT_SIZE);
                html += '<div class="word-cloud-label" style="' +
                    'visibility:hidden;' +
                    'font-size:' + word.fontSize + 'px;">' + word.text + '</div>';
            });
            html += '</div>';
            // append measurements
            var $temp = $(html);
            $('body').append($temp);
            $temp.children().each(function(index) {
                wordCounts[index].width = this.offsetWidth;
                wordCounts[index].height = this.offsetHeight;
            });
            $temp.remove();
            return wordCounts;
        },

        _createWordCloud: function(wordCounts) {
            var boundingBox = {
                width: TILE_SIZE - HORIZONTAL_OFFSET * 2,
                height: TILE_SIZE - VERTICAL_OFFSET * 2,
                x: 0,
                y: 0
            };
            var cloud = [];
            // sort words by frequency
            wordCounts = this._measureWords(wordCounts);
            // assemble word cloud
            wordCounts.forEach(function(wordCount) {
                // starting spiral position
                var pos = {
                    radius: 1,
                    radiusInc: 5,
                    arcLength: 10,
                    x: 0,
                    y: 0,
                    t: 0,
                    collisions: 0
                };
                // spiral outwards to find position
                while (pos.collisions < NUM_ATTEMPTS) {
                    // increment position in a spiral
                    pos = spiralPosition(pos);
                    // test for intersection
                    if (!intersectWord(pos, wordCount, cloud, boundingBox)) {
                        cloud.push({
                            text: wordCount.text,
                            fontSize: wordCount.fontSize,
                            percent: Math.round((wordCount.percent * 100) / 10) * 10, // round to nearest 10
                            x: pos.x,
                            y: pos.y,
                            width: wordCount.width,
                            height: wordCount.height,
                            sentiment: wordCount.sentiment,
                            avg: wordCount.avg
                        });
                        break;
                    }
                }
            });
            return cloud;
        },

        extractExtrema: function(data) {
            var sums = _.map(data, function(count) {
                if (_.isNumber(count)) {
                    return count;
                }
                return sentiment.getTotal(count);
            });
            return {
                min: _.min(sums),
                max: _.max(sums),
            };
        },

        renderTile: function(container, data) {
            if (!data || _.isEmpty(data)) {
                return;
            }
            var highlight = this.highlight;
            var wordCounts = _.map(data, function(count, key) {
                if (_.isNumber(count)) {
                    return {
                        count: count,
                        text: key
                    };
                }
                var total = sentiment.getTotal(count);
                var avg = sentiment.getAvg(count);
                return {
                    count: total,
                    text: key,
                    avg: avg,
                    sentiment: sentimentFunc(avg)
                };
            });
            // exit early if no words
            if (wordCounts.length === 0) {
                return;
            }
            // genereate the cloud
            var cloud = this._createWordCloud(wordCounts);
            // build html elements
            var html = '';
            cloud.forEach(function(word) {
                // create classes
                var classNames = [
                    'word-cloud-label',
                    'word-cloud-label-' + word.percent,
                    word.text === highlight ? 'highlight' : '',
                    word.sentiment ? word.sentiment : ''
                ].join(' ');
                // create styles
                var styles = [
                    'font-size:' + word.fontSize + 'px',
                    'left:' + (HALF_SIZE + word.x - (word.width / 2)) + 'px',
                    'top:' + (HALF_SIZE + word.y - (word.height / 2)) + 'px',
                    'width:' + word.width + 'px',
                    'height:' + word.height + 'px',
                ].join(';');
                // create html for entry
                html += '<div class="' + classNames + '"' +
                    'style="' + styles + '"' +
                    'data-sentiment="' + word.avg + '"' +
                    'data-word="' + word.text + '">' +
                    word.text +
                    '</div>';
            });
            container.innerHTML = html;
        }

    });

    module.exports = WordCloud;

}());

},{"../../core/HTML":48,"../../sentiment/Sentiment":51}],57:[function(require,module,exports){
(function() {

    'use strict';

    var HTML = require('../../core/HTML');
    var sentiment = require('../../sentiment/Sentiment');
    var sentimentFunc = sentiment.getClassFunc(-1, 1);

    var TILE_SIZE = 256;
    var HALF_SIZE = TILE_SIZE / 2;
    var MAX_NUM_WORDS = 8;
    var MIN_FONT_SIZE = 16;
    var MAX_FONT_SIZE = 22;

    var isSingleValue = function(count) {
        // single values are never null, and always numbers
        return count !== null && _.isNumber(count);
    };

    var extractCount = function(count) {
        if (isSingleValue(count)) {
            return count;
        }
        return sentiment.getTotal(count);
    };

    var extractSentimentClass = function(avg) {
        if (avg !== undefined) {
            return sentimentFunc(avg);
        }
        return '';
    };

    var extractFrequency = function(count) {
        if (isSingleValue(count)) {
            return {
                count: count
            };
        }
        return {
            count: sentiment.getTotal(count),
            avg: sentiment.getAvg(count)
        };
    };

    var extractAvg = function(frequencies) {
        if (frequencies[0].avg === undefined) {
            return;
        }
        var sum = _.sumBy(frequencies, function(frequency) {
            return frequency.avg;
        });
        return sum / frequencies.length;
    };

    var extractValues = function(data, key) {
        var frequencies = _.map(data, extractFrequency);
        var avg = extractAvg(frequencies);
        var max = _.maxBy(frequencies, function(val) {
            return val.count;
        }).count;
        var total = _.sumBy(frequencies, function(val) {
            return val.count;
        });
        return {
            topic: key,
            frequencies: frequencies,
            max: max,
            total: total,
            avg: avg
        };
    };

    var WordHistogram = HTML.extend({

        isTargetLayer: function( elem ) {
            return this._container && $.contains(this._container, elem );
        },

        clearSelection: function() {
            $(this._container).removeClass('highlight');
            this.highlight = null;
        },

        onMouseOver: function(e) {
            var target = $(e.originalEvent.target);
            $('.word-histogram-entry').removeClass('hover');
            var word = target.attr('data-word');
            if (word) {
                $('.word-histogram-entry[data-word=' + word + ']').addClass('hover');
                if (this.options.handlers.mouseover) {
                    var $parent = target.parents('.leaflet-html-tile');
                    this.options.handlers.mouseover(target, {
                        value: word,
                        x: parseInt($parent.attr('data-x'), 10),
                        y: parseInt($parent.attr('data-y'), 10),
                        z: this._map.getZoom(),
                        type: 'word-histogram',
                        layer: this
                    });
                }
            }
        },

        onMouseOut: function(e) {
            var target = $(e.originalEvent.target);
            $('.word-histogram-entry').removeClass('hover');
            var word = target.attr('data-word');
            if (word) {
                if (this.options.handlers.mouseout) {
                    var $parent = target.parents('.leaflet-html-tile');
                    this.options.handlers.mouseout(target, {
                        value: word,
                        x: parseInt($parent.attr('data-x'), 10),
                        y: parseInt($parent.attr('data-y'), 10),
                        z: this._map.getZoom(),
                        type: 'word-histogram',
                        layer: this
                    });
                }
            }
        },

        onClick: function(e) {
            // un-select and prev selected histogram
            $('.word-histogram-entry').removeClass('highlight');
            $(this._container).removeClass('highlight');
            // get target
            var target = $(e.originalEvent.target);
            if (!this.isTargetLayer(e.originalEvent.target)) {
                // this layer is not the target
                return;
            }
            var word = target.attr('data-word');
            if (word) {
                $(this._container).addClass('highlight');
                $('.word-histogram-entry[data-word=' + word + ']').addClass('highlight');
                this.highlight = word;
                if (this.options.handlers.click) {
                    var $parent = target.parents('.leaflet-html-tile');
                    this.options.handlers.click(target, {
                        value: word,
                        x: parseInt($parent.attr('data-x'), 10),
                        y: parseInt($parent.attr('data-y'), 10),
                        z: this._map.getZoom(),
                        type: 'word-histogram',
                        layer: this
                    });
                }
            } else {
                this.clearSelection();
            }
        },

        extractExtrema: function(data) {
            var sums = _.map(data, function(counts) {
                return _.sumBy(counts, extractCount);
            });
            return {
                min: _.min(sums),
                max: _.max(sums),
            };
        },

        renderTile: function(container, data) {
            if (!data || _.isEmpty(data)) {
                return;
            }
            var highlight = this.highlight;
            // convert object to array
            var values = _.map(data, extractValues).sort(function(a, b) {
                return b.total - a.total;
            });
            // get number of entries
            var numEntries = Math.min(values.length, MAX_NUM_WORDS);
            var $html = $('<div class="word-histograms" style="display:inline-block;"></div>');
            var totalHeight = 0;
            var self = this;
            values.slice(0, numEntries).forEach(function(value) {
                var topic = value.topic;
                var frequencies = value.frequencies;
                var max = value.max;
                var total = value.total;
                var avg = value.avg;
                var sentimentClass = extractSentimentClass(avg);
                var highlightClass = (topic === highlight) ? 'highlight' : '';
                // scale the height based on level min / max
                var percent = self.transformValue(total);
                var percentLabel = Math.round((percent * 100) / 10) * 10;
                var height = MIN_FONT_SIZE + percent * (MAX_FONT_SIZE - MIN_FONT_SIZE);
                totalHeight += height;
                // create container 'entry' for chart and hashtag
                var $entry = $('<div class="word-histogram-entry ' + highlightClass + '" ' +
                    'data-sentiment="' + avg + '"' +
                    'data-word="' + topic + '"' +
                    'style="' +
                    'height:' + height + 'px;"></div>');
                // create chart
                var $chart = $('<div class="word-histogram-left"' +
                    'data-sentiment="' + avg + '"' +
                    'data-word="' + topic + '"' +
                    '></div>');
                var barWidth = 'calc(' + (100 / frequencies.length) + '%)';
                // create bars
                frequencies.forEach(function(frequency) {
                    var count = frequency.count;
                    var avg = frequency.avg;
                    var sentimentClass = extractSentimentClass(avg);
                    // get the percent relative to the highest count in the tile
                    var relativePercent = (max !== 0) ? (count / max) * 100 : 0;
                    // make invisible if zero count
                    var visibility = relativePercent === 0 ? 'hidden' : '';
                    // Get the style class of the bar
                    var percentLabel = Math.round(relativePercent / 10) * 10;
                    var barClasses = [
                        'word-histogram-bar',
                        'word-histogram-bar-' + percentLabel,
                        sentimentClass + '-fill'
                    ].join(' ');
                    var barHeight;
                    var barTop;
                    // ensure there is at least a single pixel of color
                    if ((relativePercent / 100) * height < 3) {
                        barHeight = '3px';
                        barTop = 'calc(100% - 3px)';
                    } else {
                        barHeight = relativePercent + '%';
                        barTop = (100 - relativePercent) + '%';
                    }
                    // create bar
                    $chart.append('<div class="' + barClasses + '"' +
                        'data-word="' + topic + '"' +
                        'style="' +
                        'visibility:' + visibility + ';' +
                        'width:' + barWidth + ';' +
                        'height:' + barHeight + ';' +
                        'top:' + barTop + ';"></div>');
                });
                $entry.append($chart);
                var topicClasses = [
                    'word-histogram-label',
                    'word-histogram-label-' + percentLabel,
                    sentimentClass
                ].join(' ');
                // create tag label
                var $topic = $('<div class="word-histogram-right">' +
                    '<div class="' + topicClasses + '"' +
                    'data-sentiment="' + avg + '"' +
                    'data-word="' + topic + '"' +
                    'style="' +
                    'font-size:' + height + 'px;' +
                    'line-height:' + height + 'px;' +
                    'height:' + height + 'px">' + topic + '</div>' +
                    '</div>');
                $entry.append($topic);
                $html.append($entry);
            });
            $html.css('top', HALF_SIZE - (totalHeight / 2));
            container.innerHTML = $html[0].outerHTML;
        }
    });

    module.exports = WordHistogram;

}());

},{"../../core/HTML":48,"../../sentiment/Sentiment":51}],58:[function(require,module,exports){
(function() {

    'use strict';

    module.exports = {

        renderTile: function(elem) {
            elem.innerHtml = '<div class="blinking blinking-tile" style="animation-delay:' + -(Math.random() * 1200) + 'ms;"></div>';
        }

    };

}());

},{}],59:[function(require,module,exports){
(function() {

    'use strict';

    var DELAY = 1200;

    module.exports = {

        renderTile: function(elem) {
            var delay = -(Math.random() * DELAY) + 'ms';
            elem.innerHTML =
                '<div class="vertical-centered-box blinking" style="animation-delay:' + delay + '">' +
                    '<div class="content">' +
                        '<div class="loader-circle"></div>' +
                        '<div class="loader-line-mask" style="animation-delay:' + delay + '">' +
                            '<div class="loader-line"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }

    };

}());

},{}],60:[function(require,module,exports){
(function() {

    'use strict';

    var DELAY = 1200;

    module.exports = {

        renderTile: function(elem) {
            var delay = -(Math.random() * DELAY) + 'ms';
            elem.innerHTML =
                '<div class="vertical-centered-box" style="animation-delay:' + delay + '">' +
                    '<div class="content">' +
                        '<div class="loader-circle"></div>' +
                        '<div class="loader-line-mask" style="animation-delay:' + delay + '">' +
                            '<div class="loader-line"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }

    };

}());

},{}],61:[function(require,module,exports){
(function() {

    'use strict';

    var WebGL = require('../../core/WebGL');

    // TODO:
    //     - update to preceptual color ramps (layer is currently broken)

    var Heatmap = WebGL.extend({

        options: {
            shaders: {
                vert: '../../shaders/heatmap.vert',
                frag: '../../shaders/heatmap.frag',
            }
        },

        beforeDraw: function() {
            var ramp = this.getColorRamp();
            var color = [0, 0, 0, 0];
            this._shader.setUniform('uMin', this.getExtrema().min);
            this._shader.setUniform('uMax', this.getExtrema().max);
            this._shader.setUniform('uColorRampFrom', ramp(0.0, color));
            this._shader.setUniform('uColorRampTo', ramp(1.0, color));
        }

    });

    module.exports = Heatmap;

}());

},{"../../core/WebGL":49}],62:[function(require,module,exports){
(function() {

    'use strict';

    var Requestor = require('./Requestor');

    function MetaRequestor() {
        Requestor.apply(this, arguments);
    }

    MetaRequestor.prototype = Object.create(Requestor.prototype);

    MetaRequestor.prototype.getHash = function(req) {
        return req.type + '-' +
            req.index + '-' +
            req.store;
    };

    MetaRequestor.prototype.getURL = function(res) {
        return 'meta/' +
            res.type + '/' +
            res.endpoint + '/' +
            res.index + '/' +
            res.store;
    };

    module.exports = MetaRequestor;

}());

},{"./Requestor":63}],63:[function(require,module,exports){
(function() {

    'use strict';

    var retryInterval = 5000;

    function getHost() {
        var loc = window.location;
        var new_uri;
        if (loc.protocol === 'https:') {
            new_uri = 'wss:';
        } else {
            new_uri = 'ws:';
        }
        return new_uri + '//' + loc.host + loc.pathname;
    }

    function establishConnection(requestor, callback) {
        requestor.socket = new WebSocket(getHost() + requestor.url);
        // on open
        requestor.socket.onopen = function() {
            requestor.isOpen = true;
            console.log('Websocket connection established');
            callback.apply(this, arguments);
        };
        // on message
        requestor.socket.onmessage = function(event) {
            var res = JSON.parse(event.data);
            var hash = requestor.getHash(res);
            var request = requestor.requests[hash];
            delete requestor.requests[hash];
            if (res.success) {
                request.resolve(requestor.getURL(res), res);
            } else {
                request.reject(res);
            }
        };
        // on close
        requestor.socket.onclose = function() {
            // log close only if connection was ever open
            if (requestor.isOpen) {
                console.warn('Websocket connection closed');
            }
            requestor.socket = null;
            requestor.isOpen = false;
            // reject all pending requests
            Object.keys(requestor.requests).forEach(function(key) {
                requestor.requests[key].reject();
            });
            // clear request map
            requestor.requests = {};
            // attempt to re-establish connection
            setTimeout(function() {
                establishConnection(requestor, function() {
                    // once connection is re-established, send pending requests
                    requestor.pending.forEach(function(req) {
                        requestor.get(req);
                    });
                    requestor.pending = [];
                });
            }, retryInterval);
        };
    }

    function Requestor(url, callback) {
        this.url = url;
        this.requests = {};
        this.pending = [];
        this.isOpen = false;
        establishConnection(this, callback);
    }

    Requestor.prototype.getHash = function( /*req*/ ) {
        // override
    };

    Requestor.prototype.getURL = function( /*res*/ ) {
        // override
    };

    Requestor.prototype.get = function(req) {
        if (!this.isOpen) {
            // if no connection, add request to pending queue
            this.pending.push(req);
            return;
        }
        var hash = this.getHash(req);
        var request = this.requests[hash];
        if (request) {
            return request.promise();
        }
        request = this.requests[hash] = $.Deferred();
        this.socket.send(JSON.stringify(req));
        return request.promise();
    };

    Requestor.prototype.close = function() {
        this.socket.onclose = null;
        this.socket.close();
        this.socket = null;
    };

    module.exports = Requestor;

}());

},{}],64:[function(require,module,exports){
(function() {

    'use strict';

    var stringify = require('json-stable-stringify');
    var Requestor = require('./Requestor');

    function pruneEmpty(obj) {
        return function prune(current) {
            _.forOwn(current, function(value, key) {
              if (_.isUndefined(value) || _.isNull(value) || _.isNaN(value) ||
                (_.isString(value) && _.isEmpty(value)) ||
                (_.isObject(value) && _.isEmpty(prune(value)))) {
                delete current[key];
              }
            });
            // remove any leftover undefined values from the delete
            // operation on an array
            if (_.isArray(current)) {
                _.pull(current, undefined);
            }
            return current;
        }(_.cloneDeep(obj)); // do not modify the original object, create a clone instead
    }

    function TileRequestor() {
        Requestor.apply(this, arguments);
    }

    TileRequestor.prototype = Object.create(Requestor.prototype);

    TileRequestor.prototype.getHash = function(req) {
        var coord = req.coord;
        var hash = stringify(pruneEmpty(req.params));
        return req.type + '-' +
            req.index + '-' +
            req.store + '-' +
            coord.x + '-' +
            coord.y + '-' +
            coord.z + '-' +
            hash;
    };

    TileRequestor.prototype.getURL = function(res) {
        var coord = res.coord;
        return 'tile/' +
            res.type + '/' +
            res.index + '/' +
            res.store + '/' +
            coord.z + '/' +
            coord.x + '/' +
            coord.y;
    };

    module.exports = TileRequestor;

}());

},{"./Requestor":63,"json-stable-stringify":16}]},{},[21])(21)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvSW5kZXhCdWZmZXIuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvUmVuZGVyVGFyZ2V0LmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy9jb3JlL1JlbmRlcmFibGUuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvU2hhZGVyLmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy9jb3JlL1NoYWRlclBhcnNlci5qcyIsIm5vZGVfbW9kdWxlcy9lc3Blci9zcmMvY29yZS9UZXh0dXJlMkQuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvVGV4dHVyZUN1YmVNYXAuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvVmVydGV4QnVmZmVyLmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy9jb3JlL1ZlcnRleFBhY2thZ2UuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvVmlld3BvcnQuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvV2ViR0xDb250ZXh0LmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy9leHBvcnRzLmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy91dGlsL1N0YWNrLmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy91dGlsL1V0aWwuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL3V0aWwvWEhSTG9hZGVyLmpzIiwibm9kZV9tb2R1bGVzL2pzb24tc3RhYmxlLXN0cmluZ2lmeS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9qc29uaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2pzb25pZnkvbGliL3BhcnNlLmpzIiwibm9kZV9tb2R1bGVzL2pzb25pZnkvbGliL3N0cmluZ2lmeS5qcyIsIm5vZGVfbW9kdWxlcy9zaW1wbHktZGVmZXJyZWQvZGVmZXJyZWQuanMiLCJzY3JpcHRzL2V4cG9ydHMuanMiLCJzY3JpcHRzL2xheWVyL2NvcmUvRGVidWcuanMiLCJzY3JpcHRzL2xheWVyL2NvcmUvSW1hZ2UuanMiLCJzY3JpcHRzL2xheWVyL2NvcmUvTGl2ZS5qcyIsInNjcmlwdHMvbGF5ZXIvY29yZS9QZW5kaW5nLmpzIiwic2NyaXB0cy9sYXllci9leHBvcnRzLmpzIiwic2NyaXB0cy9sYXllci9taXhpbnMvQ29sb3JSYW1wLmpzIiwic2NyaXB0cy9sYXllci9taXhpbnMvVmFsdWVUcmFuc2Zvcm0uanMiLCJzY3JpcHRzL2xheWVyL3BhcmFtcy9CaW5uaW5nLmpzIiwic2NyaXB0cy9sYXllci9wYXJhbXMvQm9vbFF1ZXJ5LmpzIiwic2NyaXB0cy9sYXllci9wYXJhbXMvRGF0ZUhpc3RvZ3JhbS5qcyIsInNjcmlwdHMvbGF5ZXIvcGFyYW1zL0hpc3RvZ3JhbS5qcyIsInNjcmlwdHMvbGF5ZXIvcGFyYW1zL01ldHJpY0FnZy5qcyIsInNjcmlwdHMvbGF5ZXIvcGFyYW1zL1ByZWZpeEZpbHRlci5qcyIsInNjcmlwdHMvbGF5ZXIvcGFyYW1zL1F1ZXJ5U3RyaW5nLmpzIiwic2NyaXB0cy9sYXllci9wYXJhbXMvUmFuZ2UuanMiLCJzY3JpcHRzL2xheWVyL3BhcmFtcy9UZXJtc0FnZy5qcyIsInNjcmlwdHMvbGF5ZXIvcGFyYW1zL1Rlcm1zRmlsdGVyLmpzIiwic2NyaXB0cy9sYXllci9wYXJhbXMvVGlsaW5nLmpzIiwic2NyaXB0cy9sYXllci9wYXJhbXMvVG9wVGVybXMuanMiLCJzY3JpcHRzL2xheWVyL3R5cGVzL0hlYXRtYXAuanMiLCJzY3JpcHRzL2xheWVyL3R5cGVzL1RvcENvdW50LmpzIiwic2NyaXB0cy9sYXllci90eXBlcy9Ub3BGcmVxdWVuY3kuanMiLCJzY3JpcHRzL2xheWVyL3R5cGVzL1RvcGljQ291bnQuanMiLCJzY3JpcHRzL2xheWVyL3R5cGVzL1RvcGljRnJlcXVlbmN5LmpzIiwic2NyaXB0cy9yZW5kZXJlci9jb3JlL0NhbnZhcy5qcyIsInNjcmlwdHMvcmVuZGVyZXIvY29yZS9ET00uanMiLCJzY3JpcHRzL3JlbmRlcmVyL2NvcmUvSFRNTC5qcyIsInNjcmlwdHMvcmVuZGVyZXIvY29yZS9XZWJHTC5qcyIsInNjcmlwdHMvcmVuZGVyZXIvZXhwb3J0cy5qcyIsInNjcmlwdHMvcmVuZGVyZXIvc2VudGltZW50L1NlbnRpbWVudC5qcyIsInNjcmlwdHMvcmVuZGVyZXIvdHlwZXMvY2FudmFzL0hlYXRtYXAuanMiLCJzY3JpcHRzL3JlbmRlcmVyL3R5cGVzL2RlYnVnL0Nvb3JkLmpzIiwic2NyaXB0cy9yZW5kZXJlci90eXBlcy9odG1sL0hlYXRtYXAuanMiLCJzY3JpcHRzL3JlbmRlcmVyL3R5cGVzL2h0bWwvUmluZy5qcyIsInNjcmlwdHMvcmVuZGVyZXIvdHlwZXMvaHRtbC9Xb3JkQ2xvdWQuanMiLCJzY3JpcHRzL3JlbmRlcmVyL3R5cGVzL2h0bWwvV29yZEhpc3RvZ3JhbS5qcyIsInNjcmlwdHMvcmVuZGVyZXIvdHlwZXMvcGVuZGluZy9CbGluay5qcyIsInNjcmlwdHMvcmVuZGVyZXIvdHlwZXMvcGVuZGluZy9CbGlua1NwaW4uanMiLCJzY3JpcHRzL3JlbmRlcmVyL3R5cGVzL3BlbmRpbmcvU3Bpbi5qcyIsInNjcmlwdHMvcmVuZGVyZXIvdHlwZXMvd2ViZ2wvSGVhdG1hcC5qcyIsInNjcmlwdHMvcmVxdWVzdC9NZXRhUmVxdWVzdG9yLmpzIiwic2NyaXB0cy9yZXF1ZXN0L1JlcXVlc3Rvci5qcyIsInNjcmlwdHMvcmVxdWVzdC9UaWxlUmVxdWVzdG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9UQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNodEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIFdlYkdMQ29udGV4dCA9IHJlcXVpcmUoJy4vV2ViR0xDb250ZXh0JyksXHJcbiAgICAgICAgX2JvdW5kQnVmZmVyID0gbnVsbDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEluc3RhbnRpYXRlcyBhbiBJbmRleEJ1ZmZlciBvYmplY3QuXHJcbiAgICAgKiBAY2xhc3MgSW5kZXhCdWZmZXJcclxuICAgICAqIEBjbGFzc2Rlc2MgQW4gaW5kZXggYnVmZmVyIG9iamVjdC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gSW5kZXhCdWZmZXIoIGFyZywgb3B0aW9ucyApIHtcclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgICAgICB0aGlzLmdsID0gV2ViR0xDb250ZXh0LmdldCgpO1xyXG4gICAgICAgIHRoaXMuYnVmZmVyID0gMDtcclxuICAgICAgICBpZiAoIGFyZyApIHtcclxuICAgICAgICAgICAgaWYgKCBhcmcgaW5zdGFuY2VvZiBXZWJHTEJ1ZmZlciApIHtcclxuICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBhcmd1bWVudCBpcyBhbHJlYWR5IGEgd2ViZ2xidWZmZXIsIHNpbXBseSB3cmFwIGl0XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1ZmZlciA9IGFyZztcclxuICAgICAgICAgICAgICAgIHRoaXMudHlwZSA9IG9wdGlvbnMudHlwZSB8fCAnVU5TSUdORURfU0hPUlQnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudCA9ICggb3B0aW9ucy5jb3VudCAhPT0gdW5kZWZpbmVkICkgPyBvcHRpb25zLmNvdW50IDogMDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgYnVmZmVyIGl0XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1ZmZlckRhdGEoIGFyZyApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMub2Zmc2V0ID0gKCBvcHRpb25zLm9mZnNldCAhPT0gdW5kZWZpbmVkICkgPyBvcHRpb25zLm9mZnNldCA6IDA7XHJcbiAgICAgICAgdGhpcy5tb2RlID0gKCBvcHRpb25zLm1vZGUgIT09IHVuZGVmaW5lZCApID8gb3B0aW9ucy5tb2RlIDogJ1RSSUFOR0xFUyc7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVcGxvYWQgaW5kZXggZGF0YSB0byB0aGUgR1BVLlxyXG4gICAgICogQG1lbWJlcm9mIEluZGV4QnVmZmVyXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtBcnJheXxVaW50MTZBcnJheXxVaW50MzJBcnJheX0gYXJnIC0gVGhlIGFycmF5IG9mIGRhdGEgdG8gYnVmZmVyLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtJbmRleEJ1ZmZlcn0gVGhlIGluZGV4IGJ1ZmZlciBvYmplY3QgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBJbmRleEJ1ZmZlci5wcm90b3R5cGUuYnVmZmVyRGF0YSA9IGZ1bmN0aW9uKCBhcmcgKSB7XHJcbiAgICAgICAgdmFyIGdsID0gdGhpcy5nbDtcclxuICAgICAgICAvLyBjaGVjayBmb3IgdHlwZSBzdXBwb3J0XHJcbiAgICAgICAgdmFyIHVpbnQzMnN1cHBvcnQgPSBXZWJHTENvbnRleHQuY2hlY2tFeHRlbnNpb24oICdPRVNfZWxlbWVudF9pbmRleF91aW50JyApO1xyXG4gICAgICAgIGlmKCAhdWludDMyc3VwcG9ydCApIHtcclxuICAgICAgICAgICAgLy8gbm8gc3VwcG9ydCBmb3IgdWludDMyXHJcbiAgICAgICAgICAgIGlmICggYXJnIGluc3RhbmNlb2YgQXJyYXkgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiBhcnJheSwgYnVmZmVyIHRvIHVpbnQxNlxyXG4gICAgICAgICAgICAgICAgYXJnID0gbmV3IFVpbnQxNkFycmF5KCBhcmcgKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICggYXJnIGluc3RhbmNlb2YgVWludDMyQXJyYXkgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiB1aW50MzIsIGRvd25ncmFkZSB0byB1aW50MTZcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ0Nhbm5vdCBjcmVhdGUgSW5kZXhCdWZmZXIgb2YgZm9ybWF0ICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICdnbC5VTlNJR05FRF9JTlQgYXMgT0VTX2VsZW1lbnRfaW5kZXhfdWludCBpcyBub3QgJyArXHJcbiAgICAgICAgICAgICAgICAgICAgJ3N1cHBvcnRlZCwgZGVmYXVsdGluZyB0byBnbC5VTlNJR05FRF9TSE9SVC4nICk7XHJcbiAgICAgICAgICAgICAgICBhcmcgPSBuZXcgVWludDE2QXJyYXkoIGFyZyApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gdWludDMyIGlzIHN1cHBvcnRlZFxyXG4gICAgICAgICAgICBpZiAoIGFyZyBpbnN0YW5jZW9mIEFycmF5ICkge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgYXJyYXksIGJ1ZmZlciB0byB1aW50MzJcclxuICAgICAgICAgICAgICAgIGFyZyA9IG5ldyBVaW50MzJBcnJheSggYXJnICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gc2V0IGRhdGEgdHlwZSBiYXNlZCBvbiBhcnJheVxyXG4gICAgICAgIGlmICggYXJnIGluc3RhbmNlb2YgVWludDE2QXJyYXkgKSB7XHJcbiAgICAgICAgICAgIHRoaXMudHlwZSA9ICdVTlNJR05FRF9TSE9SVCc7XHJcbiAgICAgICAgfSBlbHNlIGlmICggYXJnIGluc3RhbmNlb2YgVWludDMyQXJyYXkgKSB7XHJcbiAgICAgICAgICAgIHRoaXMudHlwZSA9ICdVTlNJR05FRF9JTlQnO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdJbmRleEJ1ZmZlciByZXF1aXJlcyBhbiBBcnJheSBvciAnICtcclxuICAgICAgICAgICAgICAgICdBcnJheUJ1ZmZlciBhcmd1bWVudCwgY29tbWFuZCBpZ25vcmVkLicgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBjcmVhdGUgYnVmZmVyLCBzdG9yZSBjb3VudFxyXG4gICAgICAgIGlmICggIXRoaXMuYnVmZmVyICkge1xyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNvdW50ID0gYXJnLmxlbmd0aDtcclxuICAgICAgICBnbC5iaW5kQnVmZmVyKCBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgdGhpcy5idWZmZXIgKTtcclxuICAgICAgICBnbC5idWZmZXJEYXRhKCBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgYXJnLCBnbC5TVEFUSUNfRFJBVyApO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEJpbmRzIHRoZSBpbmRleCBidWZmZXIgb2JqZWN0LlxyXG4gICAgICogQG1lbWJlcm9mIEluZGV4QnVmZmVyXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge0luZGV4QnVmZmVyfSBSZXR1cm5zIHRoZSBpbmRleCBidWZmZXIgb2JqZWN0IGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgSW5kZXhCdWZmZXIucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBpZiB0aGlzIGJ1ZmZlciBpcyBhbHJlYWR5IGJvdW5kLCBleGl0IGVhcmx5XHJcbiAgICAgICAgaWYgKCBfYm91bmRCdWZmZXIgPT09IHRoaXMgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGdsID0gdGhpcy5nbDtcclxuICAgICAgICBnbC5iaW5kQnVmZmVyKCBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgdGhpcy5idWZmZXIgKTtcclxuICAgICAgICBfYm91bmRCdWZmZXIgPSB0aGlzO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVuYmluZHMgdGhlIGluZGV4IGJ1ZmZlciBvYmplY3QuXHJcbiAgICAgKiBAbWVtYmVyb2YgSW5kZXhCdWZmZXJcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7SW5kZXhCdWZmZXJ9IFJldHVybnMgdGhlIGluZGV4IGJ1ZmZlciBvYmplY3QgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBJbmRleEJ1ZmZlci5wcm90b3R5cGUudW5iaW5kID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gYnVmZmVyIGJvdW5kLCBleGl0IGVhcmx5XHJcbiAgICAgICAgaWYgKCBfYm91bmRCdWZmZXIgPT09IG51bGwgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGdsID0gdGhpcy5nbDtcclxuICAgICAgICBnbC5iaW5kQnVmZmVyKCBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbnVsbCApO1xyXG4gICAgICAgIF9ib3VuZEJ1ZmZlciA9IG51bGw7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRXhlY3V0ZSB0aGUgZHJhdyBjb21tYW5kIGZvciB0aGUgYm91bmQgYnVmZmVyLlxyXG4gICAgICogQG1lbWJlcm9mIEluZGV4QnVmZmVyXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBUaGUgb3B0aW9ucyB0byBwYXNzIHRvICdkcmF3RWxlbWVudHMnLiBPcHRpb25hbC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7SW5kZXhCdWZmZXJ9IFJldHVybnMgdGhlIGluZGV4IGJ1ZmZlciBvYmplY3QgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBJbmRleEJ1ZmZlci5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCBvcHRpb25zICkge1xyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgICAgIGlmICggX2JvdW5kQnVmZmVyID09PSBudWxsICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oICdObyBJbmRleEJ1ZmZlciBpcyBib3VuZCwgY29tbWFuZCBpZ25vcmVkLicgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgIHZhciBtb2RlID0gZ2xbIG9wdGlvbnMubW9kZSB8fCB0aGlzLm1vZGUgfHwgJ1RSSUFOR0xFUycgXTtcclxuICAgICAgICB2YXIgb2Zmc2V0ID0gKCBvcHRpb25zLm9mZnNldCAhPT0gdW5kZWZpbmVkICkgPyBvcHRpb25zLm9mZnNldCA6IHRoaXMub2Zmc2V0O1xyXG4gICAgICAgIHZhciBjb3VudCA9ICggb3B0aW9ucy5jb3VudCAhPT0gdW5kZWZpbmVkICkgPyBvcHRpb25zLmNvdW50IDogdGhpcy5jb3VudDtcclxuICAgICAgICBnbC5kcmF3RWxlbWVudHMoXHJcbiAgICAgICAgICAgIG1vZGUsXHJcbiAgICAgICAgICAgIGNvdW50LFxyXG4gICAgICAgICAgICBnbFsgdGhpcy50eXBlIF0sXHJcbiAgICAgICAgICAgIG9mZnNldCApO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IEluZGV4QnVmZmVyO1xyXG5cclxufSgpKTtcclxuIiwiKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIFdlYkdMQ29udGV4dCA9IHJlcXVpcmUoJy4vV2ViR0xDb250ZXh0JyksXHJcbiAgICAgICAgU3RhY2sgPSByZXF1aXJlKCcuLi91dGlsL1N0YWNrJyksXHJcbiAgICAgICAgX3N0YWNrID0gbmV3IFN0YWNrKCksXHJcbiAgICAgICAgX2JvdW5kQnVmZmVyID0gbnVsbDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEJpbmRzIHRoZSByZW5kZXJUYXJnZXQgb2JqZWN0LCBjYWNoaW5nIGl0IHRvIHByZXZlbnQgdW5uZWNlc3NhcnkgcmViaW5kcy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1JlbmRlclRhcmdldH0gcmVuZGVyVGFyZ2V0IC0gVGhlIFJlbmRlclRhcmdldCBvYmplY3QgdG8gYmluZC5cclxuICAgICAqL1xyXG4gICAgIGZ1bmN0aW9uIGJpbmQoIHJlbmRlclRhcmdldCApIHtcclxuICAgICAgICAvLyBpZiB0aGlzIGJ1ZmZlciBpcyBhbHJlYWR5IGJvdW5kLCBleGl0IGVhcmx5XHJcbiAgICAgICAgaWYgKCBfYm91bmRCdWZmZXIgPT09IHJlbmRlclRhcmdldCApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZ2wgPSByZW5kZXJUYXJnZXQuZ2w7XHJcbiAgICAgICAgZ2wuYmluZEZyYW1lYnVmZmVyKCBnbC5GUkFNRUJVRkZFUiwgcmVuZGVyVGFyZ2V0LmZyYW1lYnVmZmVyICk7XHJcbiAgICAgICAgX2JvdW5kQnVmZmVyID0gcmVuZGVyVGFyZ2V0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVW5iaW5kcyB0aGUgcmVuZGVyVGFyZ2V0IG9iamVjdC4gUHJldmVudHMgdW5uZWNlc3NhcnkgdW5iaW5kaW5nLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7UmVuZGVyVGFyZ2V0fSByZW5kZXJUYXJnZXQgLSBUaGUgUmVuZGVyVGFyZ2V0IG9iamVjdCB0byB1bmJpbmQuXHJcbiAgICAgKi9cclxuICAgICBmdW5jdGlvbiB1bmJpbmQoIHJlbmRlclRhcmdldCApIHtcclxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyBidWZmZXIgYm91bmQsIGV4aXQgZWFybHlcclxuICAgICAgICBpZiAoIF9ib3VuZEJ1ZmZlciA9PT0gbnVsbCApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZ2wgPSByZW5kZXJUYXJnZXQuZ2w7XHJcbiAgICAgICAgZ2wuYmluZEZyYW1lYnVmZmVyKCBnbC5GUkFNRUJVRkZFUiwgbnVsbCApO1xyXG4gICAgICAgIF9ib3VuZEJ1ZmZlciA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnN0YW50aWF0ZXMgYSBSZW5kZXJUYXJnZXQgb2JqZWN0LlxyXG4gICAgICogQGNsYXNzIFJlbmRlclRhcmdldFxyXG4gICAgICogQGNsYXNzZGVzYyBBIHJlbmRlclRhcmdldCBjbGFzcyB0byBhbGxvdyByZW5kZXJpbmcgdG8gdGV4dHVyZXMuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIFJlbmRlclRhcmdldCgpIHtcclxuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsID0gV2ViR0xDb250ZXh0LmdldCgpO1xyXG4gICAgICAgIHRoaXMuZnJhbWVidWZmZXIgPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xyXG4gICAgICAgIHRoaXMudGV4dHVyZXMgPSB7fTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEJpbmRzIHRoZSByZW5kZXJUYXJnZXQgb2JqZWN0IGFuZCBwdXNoZXMgaXQgdG8gdGhlIGZyb250IG9mIHRoZSBzdGFjay5cclxuICAgICAqIEBtZW1iZXJvZiBSZW5kZXJUYXJnZXRcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UmVuZGVyVGFyZ2V0fSBUaGUgcmVuZGVyVGFyZ2V0IG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBSZW5kZXJUYXJnZXQucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBfc3RhY2sucHVzaCggdGhpcyApO1xyXG4gICAgICAgIGJpbmQoIHRoaXMgKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVbmJpbmRzIHRoZSByZW5kZXJUYXJnZXQgb2JqZWN0IGFuZCBiaW5kcyB0aGUgcmVuZGVyVGFyZ2V0IGJlbmVhdGggaXQgb25cclxuICAgICAqIHRoaXMgc3RhY2suIElmIHRoZXJlIGlzIG5vIHVuZGVybHlpbmcgcmVuZGVyVGFyZ2V0LCBiaW5kIHRoZSBiYWNrYnVmZmVyLlxyXG4gICAgICogQG1lbWJlcm9mIFJlbmRlclRhcmdldFxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtSZW5kZXJUYXJnZXR9IFRoZSByZW5kZXJUYXJnZXQgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIFJlbmRlclRhcmdldC5wcm90b3R5cGUucG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHRvcDtcclxuICAgICAgICBfc3RhY2sucG9wKCk7XHJcbiAgICAgICAgdG9wID0gX3N0YWNrLnRvcCgpO1xyXG4gICAgICAgIGlmICggdG9wICkge1xyXG4gICAgICAgICAgICBiaW5kKCB0b3AgKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB1bmJpbmQoIHRoaXMgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXR0YWNoZXMgdGhlIHByb3ZpZGVkIHRleHR1cmUgdG8gdGhlIHByb3ZpZGVkIGF0dGFjaG1lbnQgbG9jYXRpb24uXHJcbiAgICAgKiBAbWVtYmVyb2YgUmVuZGVyVGFyZ2V0XHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtUZXh0dXJlMkR9IHRleHR1cmUgLSBUaGUgdGV4dHVyZSB0byBhdHRhY2guXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggLSBUaGUgYXR0YWNobWVudCBpbmRleC4gKG9wdGlvbmFsKVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRhcmdldCAtIFRoZSB0ZXh0dXJlIHRhcmdldCB0eXBlLiAob3B0aW9uYWwpXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1JlbmRlclRhcmdldH0gVGhlIHJlbmRlclRhcmdldCBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgUmVuZGVyVGFyZ2V0LnByb3RvdHlwZS5zZXRDb2xvclRhcmdldCA9IGZ1bmN0aW9uKCB0ZXh0dXJlLCBpbmRleCwgdGFyZ2V0ICkge1xyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgaWYgKCB0eXBlb2YgaW5kZXggPT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgICAgICB0YXJnZXQgPSBpbmRleDtcclxuICAgICAgICAgICAgaW5kZXggPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGluZGV4ID0gKCBpbmRleCAhPT0gdW5kZWZpbmVkICkgPyBpbmRleCA6IDA7XHJcbiAgICAgICAgdGhpcy50ZXh0dXJlc1sgJ2NvbG9yJyArIGluZGV4IF0gPSB0ZXh0dXJlO1xyXG4gICAgICAgIHRoaXMucHVzaCgpO1xyXG4gICAgICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKFxyXG4gICAgICAgICAgICBnbC5GUkFNRUJVRkZFUixcclxuICAgICAgICAgICAgZ2xbICdDT0xPUl9BVFRBQ0hNRU5UJyArIGluZGV4IF0sXHJcbiAgICAgICAgICAgIGdsWyB0YXJnZXQgfHwgJ1RFWFRVUkVfMkQnIF0sXHJcbiAgICAgICAgICAgIHRleHR1cmUudGV4dHVyZSxcclxuICAgICAgICAgICAgMCApO1xyXG4gICAgICAgIHRoaXMucG9wKCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXR0YWNoZXMgdGhlIHByb3ZpZGVkIHRleHR1cmUgdG8gdGhlIHByb3ZpZGVkIGF0dGFjaG1lbnQgbG9jYXRpb24uXHJcbiAgICAgKiBAbWVtYmVyb2YgUmVuZGVyVGFyZ2V0XHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtUZXh0dXJlMkR9IHRleHR1cmUgLSBUaGUgdGV4dHVyZSB0byBhdHRhY2guXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1JlbmRlclRhcmdldH0gVGhlIHJlbmRlclRhcmdldCBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgUmVuZGVyVGFyZ2V0LnByb3RvdHlwZS5zZXREZXB0aFRhcmdldCA9IGZ1bmN0aW9uKCB0ZXh0dXJlICkge1xyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgdGhpcy50ZXh0dXJlcy5kZXB0aCA9IHRleHR1cmU7XHJcbiAgICAgICAgdGhpcy5wdXNoKCk7XHJcbiAgICAgICAgZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQoXHJcbiAgICAgICAgICAgIGdsLkZSQU1FQlVGRkVSLFxyXG4gICAgICAgICAgICBnbC5ERVBUSF9BVFRBQ0hNRU5ULFxyXG4gICAgICAgICAgICBnbC5URVhUVVJFXzJELFxyXG4gICAgICAgICAgICB0ZXh0dXJlLnRleHR1cmUsXHJcbiAgICAgICAgICAgIDAgKTtcclxuICAgICAgICB0aGlzLnBvcCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENsZWFycyB0aGUgY29sb3IgYml0cyBvZiB0aGUgcmVuZGVyVGFyZ2V0LlxyXG4gICAgICogQG1lbWJlcm9mIFJlbmRlclRhcmdldFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSByIC0gVGhlIHJlZCB2YWx1ZS5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBnIC0gVGhlIGdyZWVuIHZhbHVlLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGIgLSBUaGUgYmx1ZSB2YWx1ZS5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBhIC0gVGhlIGFscGhhIHZhbHVlLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtSZW5kZXJUYXJnZXR9IFRoZSByZW5kZXJUYXJnZXQgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIFJlbmRlclRhcmdldC5wcm90b3R5cGUuY2xlYXJDb2xvciA9IGZ1bmN0aW9uKCByLCBnLCBiLCBhICkge1xyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgciA9ICggciAhPT0gdW5kZWZpbmVkICkgPyByIDogMDtcclxuICAgICAgICBnID0gKCBnICE9PSB1bmRlZmluZWQgKSA/IGcgOiAwO1xyXG4gICAgICAgIGIgPSAoIGIgIT09IHVuZGVmaW5lZCApID8gYiA6IDA7XHJcbiAgICAgICAgYSA9ICggYSAhPT0gdW5kZWZpbmVkICkgPyBhIDogMDtcclxuICAgICAgICB0aGlzLnB1c2goKTtcclxuICAgICAgICBnbC5jbGVhckNvbG9yKCByLCBnLCBiLCBhICk7XHJcbiAgICAgICAgZ2wuY2xlYXIoIGdsLkNPTE9SX0JVRkZFUl9CSVQgKTtcclxuICAgICAgICB0aGlzLnBvcCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENsZWFycyB0aGUgZGVwdGggYml0cyBvZiB0aGUgcmVuZGVyVGFyZ2V0LlxyXG4gICAgICogQG1lbWJlcm9mIFJlbmRlclRhcmdldFxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtSZW5kZXJUYXJnZXR9IFRoZSByZW5kZXJUYXJnZXQgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIFJlbmRlclRhcmdldC5wcm90b3R5cGUuY2xlYXJEZXB0aCA9IGZ1bmN0aW9uKCByLCBnLCBiLCBhICkge1xyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgciA9ICggciAhPT0gdW5kZWZpbmVkICkgPyByIDogMDtcclxuICAgICAgICBnID0gKCBnICE9PSB1bmRlZmluZWQgKSA/IGcgOiAwO1xyXG4gICAgICAgIGIgPSAoIGIgIT09IHVuZGVmaW5lZCApID8gYiA6IDA7XHJcbiAgICAgICAgYSA9ICggYSAhPT0gdW5kZWZpbmVkICkgPyBhIDogMDtcclxuICAgICAgICB0aGlzLnB1c2goKTtcclxuICAgICAgICBnbC5jbGVhckNvbG9yKCByLCBnLCBiLCBhICk7XHJcbiAgICAgICAgZ2wuY2xlYXIoIGdsLkRFUFRIX0JVRkZFUl9CSVQgKTtcclxuICAgICAgICB0aGlzLnBvcCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENsZWFycyB0aGUgc3RlbmNpbCBiaXRzIG9mIHRoZSByZW5kZXJUYXJnZXQuXHJcbiAgICAgKiBAbWVtYmVyb2YgUmVuZGVyVGFyZ2V0XHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1JlbmRlclRhcmdldH0gVGhlIHJlbmRlclRhcmdldCBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgUmVuZGVyVGFyZ2V0LnByb3RvdHlwZS5jbGVhclN0ZW5jaWwgPSBmdW5jdGlvbiggciwgZywgYiwgYSApIHtcclxuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgIHIgPSAoIHIgIT09IHVuZGVmaW5lZCApID8gciA6IDA7XHJcbiAgICAgICAgZyA9ICggZyAhPT0gdW5kZWZpbmVkICkgPyBnIDogMDtcclxuICAgICAgICBiID0gKCBiICE9PSB1bmRlZmluZWQgKSA/IGIgOiAwO1xyXG4gICAgICAgIGEgPSAoIGEgIT09IHVuZGVmaW5lZCApID8gYSA6IDA7XHJcbiAgICAgICAgdGhpcy5wdXNoKCk7XHJcbiAgICAgICAgZ2wuY2xlYXJDb2xvciggciwgZywgYiwgYSApO1xyXG4gICAgICAgIGdsLmNsZWFyKCBnbC5TVEVOQ0lMX0JVRkZFUl9CSVQgKTtcclxuICAgICAgICB0aGlzLnBvcCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENsZWFycyBhbGwgdGhlIGJpdHMgb2YgdGhlIHJlbmRlclRhcmdldC5cclxuICAgICAqIEBtZW1iZXJvZiBSZW5kZXJUYXJnZXRcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UmVuZGVyVGFyZ2V0fSBUaGUgcmVuZGVyVGFyZ2V0IG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBSZW5kZXJUYXJnZXQucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oIHIsIGcsIGIsIGEgKSB7XHJcbiAgICAgICAgdmFyIGdsID0gdGhpcy5nbDtcclxuICAgICAgICByID0gKCByICE9PSB1bmRlZmluZWQgKSA/IHIgOiAwO1xyXG4gICAgICAgIGcgPSAoIGcgIT09IHVuZGVmaW5lZCApID8gZyA6IDA7XHJcbiAgICAgICAgYiA9ICggYiAhPT0gdW5kZWZpbmVkICkgPyBiIDogMDtcclxuICAgICAgICBhID0gKCBhICE9PSB1bmRlZmluZWQgKSA/IGEgOiAwO1xyXG4gICAgICAgIHRoaXMucHVzaCgpO1xyXG4gICAgICAgIGdsLmNsZWFyQ29sb3IoIHIsIGcsIGIsIGEgKTtcclxuICAgICAgICBnbC5jbGVhciggZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IGdsLkRFUFRIX0JVRkZFUl9CSVQgfCBnbC5TVEVOQ0lMX0JVRkZFUl9CSVQgKTtcclxuICAgICAgICB0aGlzLnBvcCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlc2l6ZXMgdGhlIHJlbmRlclRhcmdldCBhbmQgYWxsIGF0dGFjaGVkIHRleHR1cmVzIGJ5IHRoZSBwcm92aWRlZCBoZWlnaHRcclxuICAgICAqIGFuZCB3aWR0aC5cclxuICAgICAqIEBtZW1iZXJvZiBSZW5kZXJUYXJnZXRcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGggLSBUaGUgbmV3IHdpZHRoIG9mIHRoZSByZW5kZXJUYXJnZXQuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0IC0gVGhlIG5ldyBoZWlnaHQgb2YgdGhlIHJlbmRlclRhcmdldC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UmVuZGVyVGFyZ2V0fSBUaGUgcmVuZGVyVGFyZ2V0IG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBSZW5kZXJUYXJnZXQucHJvdG90eXBlLnJlc2l6ZSA9IGZ1bmN0aW9uKCB3aWR0aCwgaGVpZ2h0ICkge1xyXG4gICAgICAgIHZhciBrZXk7XHJcbiAgICAgICAgaWYgKCAhd2lkdGggfHwgIWhlaWdodCApIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCAnV2lkdGggb3IgaGVpZ2h0IGFyZ3VtZW50cyBtaXNzaW5nLCBjb21tYW5kIGlnbm9yZWQuJyApO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yICgga2V5IGluIHRoaXMudGV4dHVyZXMgKSB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy50ZXh0dXJlcy5oYXNPd25Qcm9wZXJ0eSgga2V5ICkgKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRleHR1cmVzWyBrZXkgXS5yZXNpemUoIHdpZHRoLCBoZWlnaHQgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJUYXJnZXQ7XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICB2YXIgVmVydGV4UGFja2FnZSA9IHJlcXVpcmUoJy4uL2NvcmUvVmVydGV4UGFja2FnZScpLFxyXG4gICAgICAgIFZlcnRleEJ1ZmZlciA9IHJlcXVpcmUoJy4uL2NvcmUvVmVydGV4QnVmZmVyJyksXHJcbiAgICAgICAgSW5kZXhCdWZmZXIgPSByZXF1aXJlKCcuLi9jb3JlL0luZGV4QnVmZmVyJyk7XHJcblxyXG4gICAgZnVuY3Rpb24gUmVuZGVyYWJsZSggc3BlYywgb3B0aW9ucyApIHtcclxuICAgICAgICBzcGVjID0gc3BlYyB8fCB7fTtcclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgICAgICBpZiAoIHNwZWMudmVydGV4QnVmZmVyIHx8IHNwZWMudmVydGV4QnVmZmVycyApIHtcclxuICAgICAgICAgICAgLy8gdXNlIGV4aXN0aW5nIHZlcnRleCBidWZmZXJcclxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhCdWZmZXJzID0gc3BlYy52ZXJ0ZXhCdWZmZXJzIHx8IFsgc3BlYy52ZXJ0ZXhCdWZmZXIgXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBjcmVhdGUgdmVydGV4IHBhY2thZ2VcclxuICAgICAgICAgICAgdmFyIHZlcnRleFBhY2thZ2UgPSBuZXcgVmVydGV4UGFja2FnZSggc3BlYy52ZXJ0aWNlcyApO1xyXG4gICAgICAgICAgICAvLyBjcmVhdGUgdmVydGV4IGJ1ZmZlclxyXG4gICAgICAgICAgICB0aGlzLnZlcnRleEJ1ZmZlcnMgPSBbIG5ldyBWZXJ0ZXhCdWZmZXIoIHZlcnRleFBhY2thZ2UgKSBdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIHNwZWMuaW5kZXhCdWZmZXIgKSB7XHJcbiAgICAgICAgICAgIC8vIHVzZSBleGlzdGluZyBpbmRleCBidWZmZXJcclxuICAgICAgICAgICAgdGhpcy5pbmRleEJ1ZmZlciA9IHNwZWMuaW5kZXhCdWZmZXI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKCBzcGVjLmluZGljZXMgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgaW5kZXggYnVmZmVyXHJcbiAgICAgICAgICAgICAgICB0aGlzLmluZGV4QnVmZmVyID0gbmV3IEluZGV4QnVmZmVyKCBzcGVjLmluZGljZXMgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBzdG9yZSByZW5kZXJpbmcgb3B0aW9uc1xyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgbW9kZTogb3B0aW9ucy5tb2RlLFxyXG4gICAgICAgICAgICBvZmZzZXQ6IG9wdGlvbnMub2Zmc2V0LFxyXG4gICAgICAgICAgICBjb3VudDogb3B0aW9ucy5jb3VudFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgUmVuZGVyYWJsZS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCBvcHRpb25zICkge1xyXG4gICAgICAgIHZhciBvdmVycmlkZXMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgICAgIC8vIG92ZXJyaWRlIG9wdGlvbnMgaWYgcHJvdmlkZWRcclxuICAgICAgICBvdmVycmlkZXMubW9kZSA9IG92ZXJyaWRlcy5tb2RlIHx8IHRoaXMub3B0aW9ucy5tb2RlO1xyXG4gICAgICAgIG92ZXJyaWRlcy5vZmZzZXQgPSAoIG92ZXJyaWRlcy5vZmZzZXQgIT09IHVuZGVmaW5lZCApID8gb3ZlcnJpZGVzLm9mZnNldCA6IHRoaXMub3B0aW9ucy5vZmZzZXQ7XHJcbiAgICAgICAgb3ZlcnJpZGVzLmNvdW50ID0gKCBvdmVycmlkZXMuY291bnQgIT09IHVuZGVmaW5lZCApID8gb3ZlcnJpZGVzLmNvdW50IDogdGhpcy5vcHRpb25zLmNvdW50O1xyXG4gICAgICAgIC8vIGRyYXcgdGhlIHJlbmRlcmFibGVcclxuICAgICAgICBpZiAoIHRoaXMuaW5kZXhCdWZmZXIgKSB7XHJcbiAgICAgICAgICAgIC8vIHVzZSBpbmRleCBidWZmZXIgdG8gZHJhdyBlbGVtZW50c1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRleEJ1ZmZlcnMuZm9yRWFjaCggZnVuY3Rpb24oIHZlcnRleEJ1ZmZlciApIHtcclxuICAgICAgICAgICAgICAgIHZlcnRleEJ1ZmZlci5iaW5kKCk7XHJcbiAgICAgICAgICAgICAgICAvLyBubyBhZHZhbnRhZ2UgdG8gdW5iaW5kaW5nIGFzIHRoZXJlIGlzIG5vIHN0YWNrIHVzZWRcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5kZXhCdWZmZXIuYmluZCgpO1xyXG4gICAgICAgICAgICB0aGlzLmluZGV4QnVmZmVyLmRyYXcoIG92ZXJyaWRlcyApO1xyXG4gICAgICAgICAgICAvLyBubyBhZHZhbnRhZ2UgdG8gdW5iaW5kaW5nIGFzIHRoZXJlIGlzIG5vIHN0YWNrIHVzZWRcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBubyBpbmRleCBidWZmZXIsIHVzZSBkcmF3IGFycmF5c1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRleEJ1ZmZlcnMuZm9yRWFjaCggZnVuY3Rpb24oIHZlcnRleEJ1ZmZlciApIHtcclxuICAgICAgICAgICAgICAgIHZlcnRleEJ1ZmZlci5iaW5kKCk7XHJcbiAgICAgICAgICAgICAgICB2ZXJ0ZXhCdWZmZXIuZHJhdyggb3ZlcnJpZGVzICk7XHJcbiAgICAgICAgICAgICAgICAvLyBubyBhZHZhbnRhZ2UgdG8gdW5iaW5kaW5nIGFzIHRoZXJlIGlzIG5vIHN0YWNrIHVzZWRcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmFibGU7XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICB2YXIgV2ViR0xDb250ZXh0ID0gcmVxdWlyZSgnLi9XZWJHTENvbnRleHQnKSxcclxuICAgICAgICBTaGFkZXJQYXJzZXIgPSByZXF1aXJlKCcuL1NoYWRlclBhcnNlcicpLFxyXG4gICAgICAgIFV0aWwgPSByZXF1aXJlKCcuLi91dGlsL1V0aWwnKSxcclxuICAgICAgICBYSFJMb2FkZXIgPSByZXF1aXJlKCcuLi91dGlsL1hIUkxvYWRlcicpLFxyXG4gICAgICAgIFN0YWNrID0gcmVxdWlyZSgnLi4vdXRpbC9TdGFjaycpLFxyXG4gICAgICAgIFVOSUZPUk1fRlVOQ1RJT05TID0ge1xyXG4gICAgICAgICAgICAnYm9vbCc6ICd1bmlmb3JtMWknLFxyXG4gICAgICAgICAgICAnYm9vbFtdJzogJ3VuaWZvcm0xaXYnLFxyXG4gICAgICAgICAgICAnZmxvYXQnOiAndW5pZm9ybTFmJyxcclxuICAgICAgICAgICAgJ2Zsb2F0W10nOiAndW5pZm9ybTFmdicsXHJcbiAgICAgICAgICAgICdpbnQnOiAndW5pZm9ybTFpJyxcclxuICAgICAgICAgICAgJ2ludFtdJzogJ3VuaWZvcm0xaXYnLFxyXG4gICAgICAgICAgICAndWludCc6ICd1bmlmb3JtMWknLFxyXG4gICAgICAgICAgICAndWludFtdJzogJ3VuaWZvcm0xaXYnLFxyXG4gICAgICAgICAgICAndmVjMic6ICd1bmlmb3JtMmZ2JyxcclxuICAgICAgICAgICAgJ3ZlYzJbXSc6ICd1bmlmb3JtMmZ2JyxcclxuICAgICAgICAgICAgJ2l2ZWMyJzogJ3VuaWZvcm0yaXYnLFxyXG4gICAgICAgICAgICAnaXZlYzJbXSc6ICd1bmlmb3JtMml2JyxcclxuICAgICAgICAgICAgJ3ZlYzMnOiAndW5pZm9ybTNmdicsXHJcbiAgICAgICAgICAgICd2ZWMzW10nOiAndW5pZm9ybTNmdicsXHJcbiAgICAgICAgICAgICdpdmVjMyc6ICd1bmlmb3JtM2l2JyxcclxuICAgICAgICAgICAgJ2l2ZWMzW10nOiAndW5pZm9ybTNpdicsXHJcbiAgICAgICAgICAgICd2ZWM0JzogJ3VuaWZvcm00ZnYnLFxyXG4gICAgICAgICAgICAndmVjNFtdJzogJ3VuaWZvcm00ZnYnLFxyXG4gICAgICAgICAgICAnaXZlYzQnOiAndW5pZm9ybTRpdicsXHJcbiAgICAgICAgICAgICdpdmVjNFtdJzogJ3VuaWZvcm00aXYnLFxyXG4gICAgICAgICAgICAnbWF0Mic6ICd1bmlmb3JtTWF0cml4MmZ2JyxcclxuICAgICAgICAgICAgJ21hdDJbXSc6ICd1bmlmb3JtTWF0cml4MmZ2JyxcclxuICAgICAgICAgICAgJ21hdDMnOiAndW5pZm9ybU1hdHJpeDNmdicsXHJcbiAgICAgICAgICAgICdtYXQzW10nOiAndW5pZm9ybU1hdHJpeDNmdicsXHJcbiAgICAgICAgICAgICdtYXQ0JzogJ3VuaWZvcm1NYXRyaXg0ZnYnLFxyXG4gICAgICAgICAgICAnbWF0NFtdJzogJ3VuaWZvcm1NYXRyaXg0ZnYnLFxyXG4gICAgICAgICAgICAnc2FtcGxlcjJEJzogJ3VuaWZvcm0xaScsXHJcbiAgICAgICAgICAgICdzYW1wbGVyQ3ViZSc6ICd1bmlmb3JtMWknXHJcbiAgICAgICAgfSxcclxuICAgICAgICBfc3RhY2sgPSBuZXcgU3RhY2soKSxcclxuICAgICAgICBfYm91bmRTaGFkZXIgPSBudWxsO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2l2ZW4gdmVydGV4IGFuZCBmcmFnbWVudCBzaGFkZXIgc291cmNlLCByZXR1cm5zIGFuIG9iamVjdCBjb250YWluaW5nXHJcbiAgICAgKiBpbmZvcm1hdGlvbiBwZXJ0YWluaW5nIHRvIHRoZSB1bmlmb3JtcyBhbmQgYXR0cmlidHVlcyBkZWNsYXJlZC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdmVydFNvdXJjZSAtIFRoZSB2ZXJ0ZXggc2hhZGVyIHNvdXJjZS5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBmcmFnU291cmNlIC0gVGhlIGZyYWdtZW50IHNoYWRlciBzb3VyY2UuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge09iamVjdH0gVGhlIGF0dHJpYnV0ZSBhbmQgdW5pZm9ybSBpbmZvcm1hdGlvbi5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZ2V0QXR0cmlidXRlc0FuZFVuaWZvcm1zRnJvbVNvdXJjZSggdmVydFNvdXJjZSwgZnJhZ1NvdXJjZSApIHtcclxuICAgICAgICB2YXIgZGVjbGFyYXRpb25zID0gU2hhZGVyUGFyc2VyLnBhcnNlRGVjbGFyYXRpb25zKFxyXG4gICAgICAgICAgICAgICAgWyB2ZXJ0U291cmNlLCBmcmFnU291cmNlIF0sXHJcbiAgICAgICAgICAgICAgICBbICd1bmlmb3JtJywgJ2F0dHJpYnV0ZScgXSksXHJcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMgPSB7fSxcclxuICAgICAgICAgICAgdW5pZm9ybXMgPSB7fSxcclxuICAgICAgICAgICAgYXR0ckNvdW50ID0gMCxcclxuICAgICAgICAgICAgZGVjbGFyYXRpb24sXHJcbiAgICAgICAgICAgIGk7XHJcbiAgICAgICAgLy8gZm9yIGVhY2ggZGVjbGFyYXRpb24gaW4gdGhlIHNoYWRlclxyXG4gICAgICAgIGZvciAoIGk9MDsgaTxkZWNsYXJhdGlvbnMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgIGRlY2xhcmF0aW9uID0gZGVjbGFyYXRpb25zW2ldO1xyXG4gICAgICAgICAgICAvLyBjaGVjayBpZiBpdHMgYW4gYXR0cmlidXRlIG9yIHVuaWZvcm1cclxuICAgICAgICAgICAgaWYgKCBkZWNsYXJhdGlvbi5xdWFsaWZpZXIgPT09ICdhdHRyaWJ1dGUnICkge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgYXR0cmlidXRlLCBzdG9yZSB0eXBlIGFuZCBpbmRleFxyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlc1sgZGVjbGFyYXRpb24ubmFtZSBdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGRlY2xhcmF0aW9uLnR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGF0dHJDb3VudCsrXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCBkZWNsYXJhdGlvbi5xdWFsaWZpZXIgPT09ICd1bmlmb3JtJyApIHtcclxuICAgICAgICAgICAgICAgIC8vIGlmIHVuaWZvcm0sIHN0b3JlIHR5cGUgYW5kIGJ1ZmZlciBmdW5jdGlvbiBuYW1lXHJcbiAgICAgICAgICAgICAgICB1bmlmb3Jtc1sgZGVjbGFyYXRpb24ubmFtZSBdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGRlY2xhcmF0aW9uLnR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgZnVuYzogVU5JRk9STV9GVU5DVElPTlNbIGRlY2xhcmF0aW9uLnR5cGUgKyAoZGVjbGFyYXRpb24uY291bnQgPiAxID8gJ1tdJyA6ICcnKSBdXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IGF0dHJpYnV0ZXMsXHJcbiAgICAgICAgICAgIHVuaWZvcm1zOiB1bmlmb3Jtc1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICAqIEdpdmVuIGEgc2hhZGVyIHNvdXJjZSBzdHJpbmcgYW5kIHNoYWRlciB0eXBlLCBjb21waWxlcyB0aGUgc2hhZGVyIGFuZFxyXG4gICAgICogcmV0dXJucyB0aGUgcmVzdWx0aW5nIFdlYkdMU2hhZGVyIG9iamVjdC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2wgLSBUaGUgd2ViZ2wgcmVuZGVyaW5nIGNvbnRleHQuXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc2hhZGVyU291cmNlIC0gVGhlIHNoYWRlciBzb3VyY2UuXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZSAtIFRoZSBzaGFkZXIgdHlwZS5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7V2ViR0xTaGFkZXJ9IFRoZSBjb21waWxlZCBzaGFkZXIgb2JqZWN0LlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBjb21waWxlU2hhZGVyKCBnbCwgc2hhZGVyU291cmNlLCB0eXBlICkge1xyXG4gICAgICAgIHZhciBzaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoIGdsWyB0eXBlIF0gKTtcclxuICAgICAgICBnbC5zaGFkZXJTb3VyY2UoIHNoYWRlciwgc2hhZGVyU291cmNlICk7XHJcbiAgICAgICAgZ2wuY29tcGlsZVNoYWRlciggc2hhZGVyICk7XHJcbiAgICAgICAgaWYgKCAhZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKCBzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTICkgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdBbiBlcnJvciBvY2N1cnJlZCBjb21waWxpbmcgdGhlIHNoYWRlcnM6ICcgK1xyXG4gICAgICAgICAgICAgICAgZ2wuZ2V0U2hhZGVySW5mb0xvZyggc2hhZGVyICkgKTtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzaGFkZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCaW5kcyB0aGUgYXR0cmlidXRlIGxvY2F0aW9ucyBmb3IgdGhlIFNoYWRlciBvYmplY3QuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTaGFkZXJ9IHNoYWRlciAtIFRoZSBTaGFkZXIgb2JqZWN0LlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBiaW5kQXR0cmlidXRlTG9jYXRpb25zKCBzaGFkZXIgKSB7XHJcbiAgICAgICAgdmFyIGdsID0gc2hhZGVyLmdsLFxyXG4gICAgICAgICAgICBhdHRyaWJ1dGVzID0gc2hhZGVyLmF0dHJpYnV0ZXMsXHJcbiAgICAgICAgICAgIG5hbWU7XHJcbiAgICAgICAgZm9yICggbmFtZSBpbiBhdHRyaWJ1dGVzICkge1xyXG4gICAgICAgICAgICBpZiAoIGF0dHJpYnV0ZXMuaGFzT3duUHJvcGVydHkoIG5hbWUgKSApIHtcclxuICAgICAgICAgICAgICAgIC8vIGJpbmQgdGhlIGF0dHJpYnV0ZSBsb2NhdGlvblxyXG4gICAgICAgICAgICAgICAgZ2wuYmluZEF0dHJpYkxvY2F0aW9uKFxyXG4gICAgICAgICAgICAgICAgICAgIHNoYWRlci5wcm9ncmFtLFxyXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXNbIG5hbWUgXS5pbmRleCxcclxuICAgICAgICAgICAgICAgICAgICBuYW1lICk7XHJcbiAgICAgICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coICdCb3VuZCB2ZXJ0ZXggYXR0cmlidXRlIFxcYCcgKyBuYW1lICtcclxuICAgICAgICAgICAgICAgICAgICAnXFwnIHRvIGxvY2F0aW9uICcgKyBhdHRyaWJ1dGVzWyBuYW1lIF0uaW5kZXggKTtcclxuICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBRdWVyaWVzIHRoZSB3ZWJnbCByZW5kZXJpbmcgY29udGV4dCBmb3IgdGhlIHVuaWZvcm0gbG9jYXRpb25zLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U2hhZGVyfSBzaGFkZXIgLSBUaGUgU2hhZGVyIG9iamVjdC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZ2V0VW5pZm9ybUxvY2F0aW9ucyggc2hhZGVyICkge1xyXG4gICAgICAgIHZhciBnbCA9IHNoYWRlci5nbCxcclxuICAgICAgICAgICAgdW5pZm9ybXMgPSBzaGFkZXIudW5pZm9ybXMsXHJcbiAgICAgICAgICAgIHVuaWZvcm0sXHJcbiAgICAgICAgICAgIG5hbWU7XHJcbiAgICAgICAgZm9yICggbmFtZSBpbiB1bmlmb3JtcyApIHtcclxuICAgICAgICAgICAgaWYgKCB1bmlmb3Jtcy5oYXNPd25Qcm9wZXJ0eSggbmFtZSApICkge1xyXG4gICAgICAgICAgICAgICAgdW5pZm9ybSA9IHVuaWZvcm1zWyBuYW1lIF07XHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIHVuaWZvcm0gbG9jYXRpb25cclxuICAgICAgICAgICAgICAgIHVuaWZvcm0ubG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oIHNoYWRlci5wcm9ncmFtLCBuYW1lICk7XHJcbiAgICAgICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coIG5hbWUgKyAnLCAnICtcclxuICAgICAgICAgICAgICAgICAgICBnbC5nZXRVbmlmb3JtTG9jYXRpb24oIHNoYWRlci5wcm9ncmFtLCBuYW1lICkgKyAnLCcgKTtcclxuICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdG8gbG9hZCBzaGFkZXIgc291cmNlIGZyb20gYSB1cmwuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHVybCAtIFRoZSB1cmwgdG8gbG9hZCB0aGUgcmVzb3VyY2UgZnJvbS5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFRoZSBmdW5jdGlvbiB0byBsb2FkIHRoZSBzaGFkZXIgc291cmNlLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBsb2FkU2hhZGVyU291cmNlKCB1cmwgKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCBkb25lICkge1xyXG4gICAgICAgICAgICBYSFJMb2FkZXIubG9hZChcclxuICAgICAgICAgICAgICAgIHVybCxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZVR5cGU6ICd0ZXh0JyxcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBkb25lLFxyXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvciggZXJyICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUoIG51bGwgKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRvIHBhc3MgdGhyb3VnaCB0aGUgc2hhZGVyIHNvdXJjZS5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc291cmNlIC0gVGhlIHNvdXJjZSBvZiB0aGUgc2hhZGVyLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gVGhlIGZ1bmN0aW9uIHRvIHBhc3MgdGhyb3VnaCB0aGUgc2hhZGVyIHNvdXJjZS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcGFzc1Rocm91Z2hTb3VyY2UoIHNvdXJjZSApIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oIGRvbmUgKSB7XHJcbiAgICAgICAgICAgIGRvbmUoIHNvdXJjZSApO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBhbiBhcnJheSBvZiBHTFNMIHNvdXJjZSBzdHJpbmdzIGFuZCBVUkxzLFxyXG4gICAgICogYW5kIHJlc29sdmVzIHRoZW0gaW50byBhbmQgYXJyYXkgb2YgR0xTTCBzb3VyY2UuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHJlc29sdmVTb3VyY2VzKCBzb3VyY2VzICkge1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiggZG9uZSApIHtcclxuICAgICAgICAgICAgdmFyIGpvYnMgPSBbXTtcclxuICAgICAgICAgICAgc291cmNlcyA9IHNvdXJjZXMgfHwgW107XHJcbiAgICAgICAgICAgIHNvdXJjZXMgPSAoICEoIHNvdXJjZXMgaW5zdGFuY2VvZiBBcnJheSApICkgPyBbIHNvdXJjZXMgXSA6IHNvdXJjZXM7XHJcbiAgICAgICAgICAgIHNvdXJjZXMuZm9yRWFjaCggZnVuY3Rpb24oIHNvdXJjZSApIHtcclxuICAgICAgICAgICAgICAgIGlmICggU2hhZGVyUGFyc2VyLmlzR0xTTCggc291cmNlICkgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgam9icy5wdXNoKCBwYXNzVGhyb3VnaFNvdXJjZSggc291cmNlICkgKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgam9icy5wdXNoKCBsb2FkU2hhZGVyU291cmNlKCBzb3VyY2UgKSApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgVXRpbC5hc3luYyggam9icywgZnVuY3Rpb24oIHJlc3VsdHMgKSB7XHJcbiAgICAgICAgICAgICAgICBkb25lKCByZXN1bHRzICk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCaW5kcyB0aGUgc2hhZGVyIG9iamVjdCwgY2FjaGluZyBpdCB0byBwcmV2ZW50IHVubmVjZXNzYXJ5IHJlYmluZHMuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTaGFkZXJ9IHNoYWRlciAtIFRoZSBTaGFkZXIgb2JqZWN0IHRvIGJpbmQuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGJpbmQoIHNoYWRlciApIHtcclxuICAgICAgICAvLyBpZiB0aGlzIHNoYWRlciBpcyBhbHJlYWR5IGJvdW5kLCBleGl0IGVhcmx5XHJcbiAgICAgICAgaWYgKCBfYm91bmRTaGFkZXIgPT09IHNoYWRlciApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzaGFkZXIuZ2wudXNlUHJvZ3JhbSggc2hhZGVyLnByb2dyYW0gKTtcclxuICAgICAgICBfYm91bmRTaGFkZXIgPSBzaGFkZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVbmJpbmRzIHRoZSBzaGFkZXIgb2JqZWN0LiBQcmV2ZW50cyB1bm5lY2Vzc2FyeSB1bmJpbmRpbmcuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTaGFkZXJ9IHNoYWRlciAtIFRoZSBTaGFkZXIgb2JqZWN0IHRvIHVuYmluZC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gdW5iaW5kKCBzaGFkZXIgKSB7XHJcbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gc2hhZGVyIGJvdW5kLCBleGl0IGVhcmx5XHJcbiAgICAgICAgaWYgKCBfYm91bmRTaGFkZXIgPT09IG51bGwgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2hhZGVyLmdsLnVzZVByb2dyYW0oIG51bGwgKTtcclxuICAgICAgICBfYm91bmRTaGFkZXIgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2xlYXJzIHRoZSBzaGFkZXIgYXR0cmlidXRlcyBkdWUgdG8gYWJvcnRpbmcgb2YgaW5pdGlhbGl6YXRpb24uXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTaGFkZXJ9IHNoYWRlciAtIFRoZSBTaGFkZXIgb2JqZWN0LlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBhYm9ydFNoYWRlciggc2hhZGVyICkge1xyXG4gICAgICAgIHNoYWRlci5wcm9ncmFtID0gbnVsbDtcclxuICAgICAgICBzaGFkZXIuYXR0cmlidXRlcyA9IG51bGw7XHJcbiAgICAgICAgc2hhZGVyLnVuaWZvcm1zID0gbnVsbDtcclxuICAgICAgICByZXR1cm4gc2hhZGVyO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5zdGFudGlhdGVzIGEgU2hhZGVyIG9iamVjdC5cclxuICAgICAqIEBjbGFzcyBTaGFkZXJcclxuICAgICAqIEBjbGFzc2Rlc2MgQSBzaGFkZXIgY2xhc3MgdG8gYXNzaXN0IGluIGNvbXBpbGluZyBhbmQgbGlua2luZyB3ZWJnbFxyXG4gICAgICogc2hhZGVycywgc3RvcmluZyBhdHRyaWJ1dGUgYW5kIHVuaWZvcm0gbG9jYXRpb25zLCBhbmQgYnVmZmVyaW5nIHVuaWZvcm1zLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBTaGFkZXIoIHNwZWMsIGNhbGxiYWNrICkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICBzcGVjID0gc3BlYyB8fCB7fTtcclxuICAgICAgICB0aGlzLnByb2dyYW0gPSAwO1xyXG4gICAgICAgIHRoaXMuZ2wgPSBXZWJHTENvbnRleHQuZ2V0KCk7XHJcbiAgICAgICAgdGhpcy52ZXJzaW9uID0gc3BlYy52ZXJzaW9uIHx8ICcxLjAwJztcclxuICAgICAgICAvLyBjaGVjayBzb3VyY2UgYXJndW1lbnRzXHJcbiAgICAgICAgaWYgKCAhc3BlYy52ZXJ0ICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCAnVmVydGV4IHNoYWRlciBhcmd1bWVudCBoYXMgbm90IGJlZW4gcHJvdmlkZWQsICcgK1xyXG4gICAgICAgICAgICAgICAgJ3NoYWRlciBpbml0aWFsaXphdGlvbiBhYm9ydGVkLicgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCAhc3BlYy5mcmFnICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCAnRnJhZ21lbnQgc2hhZGVyIGFyZ3VtZW50IGhhcyBub3QgYmVlbiBwcm92aWRlZCwgJyArXHJcbiAgICAgICAgICAgICAgICAnc2hhZGVyIGluaXRpYWxpemF0aW9uIGFib3J0ZWQuJyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBjcmVhdGUgdGhlIHNoYWRlclxyXG4gICAgICAgIFV0aWwuYXN5bmMoe1xyXG4gICAgICAgICAgICBjb21tb246IHJlc29sdmVTb3VyY2VzKCBzcGVjLmNvbW1vbiApLFxyXG4gICAgICAgICAgICB2ZXJ0OiByZXNvbHZlU291cmNlcyggc3BlYy52ZXJ0ICksXHJcbiAgICAgICAgICAgIGZyYWc6IHJlc29sdmVTb3VyY2VzKCBzcGVjLmZyYWcgKSxcclxuICAgICAgICB9LCBmdW5jdGlvbiggc2hhZGVycyApIHtcclxuICAgICAgICAgICAgdGhhdC5jcmVhdGUoIHNoYWRlcnMgKTtcclxuICAgICAgICAgICAgaWYgKCBjYWxsYmFjayApIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCB0aGF0ICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgdGhlIHNoYWRlciBvYmplY3QgZnJvbSBzb3VyY2Ugc3RyaW5ncy4gVGhpcyBpbmNsdWRlczpcclxuICAgICAqICAgIDEpIENvbXBpbGluZyBhbmQgbGlua2luZyB0aGUgc2hhZGVyIHByb2dyYW0uXHJcbiAgICAgKiAgICAyKSBQYXJzaW5nIHNoYWRlciBzb3VyY2UgZm9yIGF0dHJpYnV0ZSBhbmQgdW5pZm9ybSBpbmZvcm1hdGlvbi5cclxuICAgICAqICAgIDMpIEJpbmRpbmcgYXR0cmlidXRlIGxvY2F0aW9ucywgYnkgb3JkZXIgb2YgZGVsY2FyYXRpb24uXHJcbiAgICAgKiAgICA0KSBRdWVyeWluZyBhbmQgc3RvcmluZyB1bmlmb3JtIGxvY2F0aW9uLlxyXG4gICAgICogQG1lbWJlcm9mIFNoYWRlclxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzaGFkZXJzIC0gQSBtYXAgY29udGFpbmluZyBzb3VyY2VzIHVuZGVyICd2ZXJ0JyBhbmRcclxuICAgICAqICAgICAnZnJhZycgYXR0cmlidXRlcy5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7U2hhZGVyfSBUaGUgc2hhZGVyIG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBTaGFkZXIucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uKCBzaGFkZXJzICkge1xyXG4gICAgICAgIC8vIG9uY2UgYWxsIHNoYWRlciBzb3VyY2VzIGFyZSBsb2FkZWRcclxuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsLFxyXG4gICAgICAgICAgICBjb21tb24gPSBzaGFkZXJzLmNvbW1vbi5qb2luKCAnJyApLFxyXG4gICAgICAgICAgICB2ZXJ0ID0gc2hhZGVycy52ZXJ0LmpvaW4oICcnICksXHJcbiAgICAgICAgICAgIGZyYWcgPSBzaGFkZXJzLmZyYWcuam9pbiggJycgKSxcclxuICAgICAgICAgICAgdmVydGV4U2hhZGVyLFxyXG4gICAgICAgICAgICBmcmFnbWVudFNoYWRlcixcclxuICAgICAgICAgICAgYXR0cmlidXRlc0FuZFVuaWZvcm1zO1xyXG4gICAgICAgIC8vIGNvbXBpbGUgc2hhZGVyc1xyXG4gICAgICAgIHZlcnRleFNoYWRlciA9IGNvbXBpbGVTaGFkZXIoIGdsLCBjb21tb24gKyB2ZXJ0LCAnVkVSVEVYX1NIQURFUicgKTtcclxuICAgICAgICBmcmFnbWVudFNoYWRlciA9IGNvbXBpbGVTaGFkZXIoIGdsLCBjb21tb24gKyBmcmFnLCAnRlJBR01FTlRfU0hBREVSJyApO1xyXG4gICAgICAgIGlmICggIXZlcnRleFNoYWRlciB8fCAhZnJhZ21lbnRTaGFkZXIgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdBYm9ydGluZyBpbnN0YW50aWF0aW9uIG9mIHNoYWRlciBkdWUgdG8gY29tcGlsYXRpb24gZXJyb3JzLicgKTtcclxuICAgICAgICAgICAgcmV0dXJuIGFib3J0U2hhZGVyKCB0aGlzICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHBhcnNlIHNvdXJjZSBmb3IgYXR0cmlidXRlIGFuZCB1bmlmb3Jtc1xyXG4gICAgICAgIGF0dHJpYnV0ZXNBbmRVbmlmb3JtcyA9IGdldEF0dHJpYnV0ZXNBbmRVbmlmb3Jtc0Zyb21Tb3VyY2UoIHZlcnQsIGZyYWcgKTtcclxuICAgICAgICAvLyBzZXQgbWVtYmVyIGF0dHJpYnV0ZXNcclxuICAgICAgICB0aGlzLmF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzQW5kVW5pZm9ybXMuYXR0cmlidXRlcztcclxuICAgICAgICB0aGlzLnVuaWZvcm1zID0gYXR0cmlidXRlc0FuZFVuaWZvcm1zLnVuaWZvcm1zO1xyXG4gICAgICAgIC8vIGNyZWF0ZSB0aGUgc2hhZGVyIHByb2dyYW1cclxuICAgICAgICB0aGlzLnByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XHJcbiAgICAgICAgLy8gYXR0YWNoIHZlcnRleCBhbmQgZnJhZ21lbnQgc2hhZGVyc1xyXG4gICAgICAgIGdsLmF0dGFjaFNoYWRlciggdGhpcy5wcm9ncmFtLCB2ZXJ0ZXhTaGFkZXIgKTtcclxuICAgICAgICBnbC5hdHRhY2hTaGFkZXIoIHRoaXMucHJvZ3JhbSwgZnJhZ21lbnRTaGFkZXIgKTtcclxuICAgICAgICAvLyBiaW5kIHZlcnRleCBhdHRyaWJ1dGUgbG9jYXRpb25zIEJFRk9SRSBsaW5raW5nXHJcbiAgICAgICAgYmluZEF0dHJpYnV0ZUxvY2F0aW9ucyggdGhpcyApO1xyXG4gICAgICAgIC8vIGxpbmsgc2hhZGVyXHJcbiAgICAgICAgZ2wubGlua1Byb2dyYW0oIHRoaXMucHJvZ3JhbSApO1xyXG4gICAgICAgIC8vIElmIGNyZWF0aW5nIHRoZSBzaGFkZXIgcHJvZ3JhbSBmYWlsZWQsIGFsZXJ0XHJcbiAgICAgICAgaWYgKCAhZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlciggdGhpcy5wcm9ncmFtLCBnbC5MSU5LX1NUQVRVUyApICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCAnQW4gZXJyb3Igb2NjdXJlZCBsaW5raW5nIHRoZSBzaGFkZXI6ICcgK1xyXG4gICAgICAgICAgICAgICAgZ2wuZ2V0UHJvZ3JhbUluZm9Mb2coIHRoaXMucHJvZ3JhbSApICk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdBYm9ydGluZyBpbnN0YW50aWF0aW9uIG9mIHNoYWRlciBkdWUgdG8gbGlua2luZyBlcnJvcnMuJyApO1xyXG4gICAgICAgICAgICByZXR1cm4gYWJvcnRTaGFkZXIoIHRoaXMgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gZ2V0IHNoYWRlciB1bmlmb3JtIGxvY2F0aW9uc1xyXG4gICAgICAgIGdldFVuaWZvcm1Mb2NhdGlvbnMoIHRoaXMgKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCaW5kcyB0aGUgc2hhZGVyIG9iamVjdCBhbmQgcHVzaGVzIGl0IHRvIHRoZSBmcm9udCBvZiB0aGUgc3RhY2suXHJcbiAgICAgKiBAbWVtYmVyb2YgU2hhZGVyXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1NoYWRlcn0gVGhlIHNoYWRlciBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgU2hhZGVyLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgX3N0YWNrLnB1c2goIHRoaXMgKTtcclxuICAgICAgICBiaW5kKCB0aGlzICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVW5iaW5kcyB0aGUgc2hhZGVyIG9iamVjdCBhbmQgYmluZHMgdGhlIHNoYWRlciBiZW5lYXRoIGl0IG9uXHJcbiAgICAgKiB0aGlzIHN0YWNrLiBJZiB0aGVyZSBpcyBubyB1bmRlcmx5aW5nIHNoYWRlciwgYmluZCB0aGUgYmFja2J1ZmZlci5cclxuICAgICAqIEBtZW1iZXJvZiBTaGFkZXJcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7U2hhZGVyfSBUaGUgc2hhZGVyIG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBTaGFkZXIucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciB0b3A7XHJcbiAgICAgICAgX3N0YWNrLnBvcCgpO1xyXG4gICAgICAgIHRvcCA9IF9zdGFjay50b3AoKTtcclxuICAgICAgICBpZiAoIHRvcCApIHtcclxuICAgICAgICAgICAgYmluZCggdG9wICk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdW5iaW5kKCB0aGlzICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEJ1ZmZlciBhIHVuaWZvcm0gdmFsdWUgYnkgbmFtZS5cclxuICAgICAqIEBtZW1iZXJvZiBTaGFkZXJcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdW5pZm9ybU5hbWUgLSBUaGUgdW5pZm9ybSBuYW1lIGluIHRoZSBzaGFkZXIgc291cmNlLlxyXG4gICAgICogQHBhcmFtIHsqfSB1bmlmb3JtIC0gVGhlIHVuaWZvcm0gdmFsdWUgdG8gYnVmZmVyLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtTaGFkZXJ9IFRoZSBzaGFkZXIgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIFNoYWRlci5wcm90b3R5cGUuc2V0VW5pZm9ybSA9IGZ1bmN0aW9uKCB1bmlmb3JtTmFtZSwgdW5pZm9ybSApIHtcclxuICAgICAgICBpZiAoICF0aGlzLnByb2dyYW0gKSB7XHJcbiAgICAgICAgICAgIGlmICggIXRoaXMuaGFzTG9nZ2VkRXJyb3IgKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oICdBdHRlbXB0aW5nIHRvIHVzZSBhbiBpbmNvbXBsZXRlIHNoYWRlciwgY29tbWFuZCBpZ25vcmVkLicgKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFzTG9nZ2VkRXJyb3IgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCB0aGlzICE9PSBfYm91bmRTaGFkZXIgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ0F0dGVtcHRpbmcgdG8gc2V0IHVuaWZvcm0gYCcgKyB1bmlmb3JtTmFtZSArXHJcbiAgICAgICAgICAgICAgICAnYCBmb3IgYW4gdW5ib3VuZCBzaGFkZXIsIGNvbW1hbmQgaWdub3JlZC4nICk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHVuaWZvcm1TcGVjID0gdGhpcy51bmlmb3Jtc1sgdW5pZm9ybU5hbWUgXSxcclxuICAgICAgICAgICAgZnVuYyxcclxuICAgICAgICAgICAgdHlwZSxcclxuICAgICAgICAgICAgbG9jYXRpb24sXHJcbiAgICAgICAgICAgIHZhbHVlO1xyXG4gICAgICAgIC8vIGVuc3VyZSB0aGF0IHRoZSB1bmlmb3JtIHNwZWMgZXhpc3RzIGZvciB0aGUgbmFtZVxyXG4gICAgICAgIGlmICggIXVuaWZvcm1TcGVjICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oICdObyB1bmlmb3JtIGZvdW5kIHVuZGVyIG5hbWUgYCcgKyB1bmlmb3JtTmFtZSArXHJcbiAgICAgICAgICAgICAgICAnYCwgY29tbWFuZCBpZ25vcmVkLicgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBlbnN1cmUgdGhhdCB0aGUgdW5pZm9ybSBhcmd1bWVudCBpcyBkZWZpbmVkXHJcbiAgICAgICAgaWYgKCB1bmlmb3JtID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ0FyZ3VtZW50IHBhc3NlZCBmb3IgdW5pZm9ybSBgJyArIHVuaWZvcm1OYW1lICtcclxuICAgICAgICAgICAgICAgICdgIGlzIHVuZGVmaW5lZCwgY29tbWFuZCBpZ25vcmVkLicgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBnZXQgdGhlIHVuaWZvcm0gbG9jYXRpb24sIHR5cGUsIGFuZCBidWZmZXIgZnVuY3Rpb25cclxuICAgICAgICBmdW5jID0gdW5pZm9ybVNwZWMuZnVuYztcclxuICAgICAgICB0eXBlID0gdW5pZm9ybVNwZWMudHlwZTtcclxuICAgICAgICBsb2NhdGlvbiA9IHVuaWZvcm1TcGVjLmxvY2F0aW9uO1xyXG4gICAgICAgIHZhbHVlID0gdW5pZm9ybS50b0FycmF5ID8gdW5pZm9ybS50b0FycmF5KCkgOiB1bmlmb3JtO1xyXG4gICAgICAgIHZhbHVlID0gKCB2YWx1ZSBpbnN0YW5jZW9mIEFycmF5ICkgPyBuZXcgRmxvYXQzMkFycmF5KCB2YWx1ZSApIDogdmFsdWU7XHJcbiAgICAgICAgLy8gY29udmVydCBib29sZWFuJ3MgdG8gMCBvciAxXHJcbiAgICAgICAgdmFsdWUgPSAoIHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nICkgPyAoIHZhbHVlID8gMSA6IDAgKSA6IHZhbHVlO1xyXG4gICAgICAgIC8vIHBhc3MgdGhlIGFyZ3VtZW50cyBkZXBlbmRpbmcgb24gdGhlIHR5cGVcclxuICAgICAgICBzd2l0Y2ggKCB0eXBlICkge1xyXG4gICAgICAgICAgICBjYXNlICdtYXQyJzpcclxuICAgICAgICAgICAgY2FzZSAnbWF0Myc6XHJcbiAgICAgICAgICAgIGNhc2UgJ21hdDQnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5nbFsgZnVuYyBdKCBsb2NhdGlvbiwgZmFsc2UsIHZhbHVlICk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHRoaXMuZ2xbIGZ1bmMgXSggbG9jYXRpb24sIHZhbHVlICk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gU2hhZGVyO1xyXG5cclxufSgpKTtcclxuIiwiKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIFBSRUNJU0lPTl9RVUFMSUZJRVJTID0ge1xyXG4gICAgICAgIGhpZ2hwOiB0cnVlLFxyXG4gICAgICAgIG1lZGl1bXA6IHRydWUsXHJcbiAgICAgICAgbG93cDogdHJ1ZVxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgUFJFQ0lTSU9OX1RZUEVTID0ge1xyXG4gICAgICAgIGZsb2F0OiAnZmxvYXQnLFxyXG4gICAgICAgIHZlYzI6ICdmbG9hdCcsXHJcbiAgICAgICAgdmVjMzogJ2Zsb2F0JyxcclxuICAgICAgICB2ZWM0OiAnZmxvYXQnLFxyXG4gICAgICAgIGl2ZWMyOiAnaW50JyxcclxuICAgICAgICBpdmVjMzogJ2ludCcsXHJcbiAgICAgICAgaXZlYzQ6ICdpbnQnLFxyXG4gICAgICAgIGludDogJ2ludCcsXHJcbiAgICAgICAgdWludDogJ2ludCcsXHJcbiAgICAgICAgc2FtcGxlcjJEOiAnc2FtcGxlcjJEJyxcclxuICAgICAgICBzYW1wbGVyQ3ViZTogJ3NhbXBsZXJDdWJlJyxcclxuICAgIH07XHJcblxyXG4gICAgdmFyIENPTU1FTlRTX1JFR0VYUCA9IC8oXFwvXFwqKFtcXHNcXFNdKj8pXFwqXFwvKXwoXFwvXFwvKC4qKSQpL2dtO1xyXG4gICAgdmFyIEVORExJTkVfUkVHRVhQID0gLyhcXHJcXG58XFxufFxccikvZ207XHJcbiAgICB2YXIgV0hJVEVTUEFDRV9SRUdFWFAgPSAvXFxzezIsfS9nO1xyXG4gICAgdmFyIEJSQUNLRVRfV0hJVEVTUEFDRV9SRUdFWFAgPSAvKFxccyopKFxcWykoXFxzKikoXFxkKykoXFxzKikoXFxdKShcXHMqKS9nO1xyXG4gICAgdmFyIE5BTUVfQ09VTlRfUkVHRVhQID0gLyhbYS16QS1aX11bYS16QS1aMC05X10qKSg/OlxcWyhcXGQrKVxcXSk/LztcclxuICAgIHZhciBQUkVDSVNJT05fUkVHRVggPSAvXFxiKHByZWNpc2lvbilcXHMrKFxcdyspXFxzKyhcXHcrKS87XHJcbiAgICB2YXIgR0xTTF9SRUdFWFAgPSAgL3ZvaWRcXHMrbWFpblxccypcXChcXHMqXFwpXFxzKi9taTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZXMgc3RhbmRhcmQgY29tbWVudHMgZnJvbSB0aGUgcHJvdmlkZWQgc3RyaW5nLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgLSBUaGUgc3RyaW5nIHRvIHN0cmlwIGNvbW1lbnRzIGZyb20uXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgY29tbWVudGxlc3Mgc3RyaW5nLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBzdHJpcENvbW1lbnRzKCBzdHIgKSB7XHJcbiAgICAgICAgLy8gcmVnZXggc291cmNlOiBodHRwczovL2dpdGh1Yi5jb20vbW9hZ3JpdXMvc3RyaXBjb21tZW50c1xyXG4gICAgICAgIHJldHVybiBzdHIucmVwbGFjZSggQ09NTUVOVFNfUkVHRVhQLCAnJyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29udmVydHMgYWxsIHdoaXRlc3BhY2UgaW50byBhIHNpbmdsZSAnICcgc3BhY2UgY2hhcmFjdGVyLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgLSBUaGUgc3RyaW5nIHRvIG5vcm1hbGl6ZSB3aGl0ZXNwYWNlIGZyb20uXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBUaGUgbm9ybWFsaXplZCBzdHJpbmcuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZVdoaXRlc3BhY2UoIHN0ciApIHtcclxuICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UoIEVORExJTkVfUkVHRVhQLCAnICcgKSAvLyByZW1vdmUgbGluZSBlbmRpbmdzXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKCBXSElURVNQQUNFX1JFR0VYUCwgJyAnICkgLy8gbm9ybWFsaXplIHdoaXRlc3BhY2UgdG8gc2luZ2xlICcgJ1xyXG4gICAgICAgICAgICAucmVwbGFjZSggQlJBQ0tFVF9XSElURVNQQUNFX1JFR0VYUCwgJyQyJDQkNicgKTsgLy8gcmVtb3ZlIHdoaXRlc3BhY2UgaW4gYnJhY2tldHNcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFBhcnNlcyB0aGUgbmFtZSBhbmQgY291bnQgb3V0IG9mIGEgbmFtZSBzdGF0ZW1lbnQsIHJldHVybmluZyB0aGVcclxuICAgICAqIGRlY2xhcmF0aW9uIG9iamVjdC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcXVhbGlmaWVyIC0gVGhlIHF1YWxpZmllciBzdHJpbmcuXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcHJlY2lzaW9uIC0gVGhlIHByZWNpc2lvbiBzdHJpbmcuXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZSAtIFRoZSB0eXBlIHN0cmluZy5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBlbnRyeSAtIFRoZSB2YXJpYWJsZSBkZWNsYXJhdGlvbiBzdHJpbmcuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHBhcnNlTmFtZUFuZENvdW50KCBxdWFsaWZpZXIsIHByZWNpc2lvbiwgdHlwZSwgZW50cnkgKSB7XHJcbiAgICAgICAgLy8gZGV0ZXJtaW5lIG5hbWUgYW5kIHNpemUgb2YgdmFyaWFibGVcclxuICAgICAgICB2YXIgbWF0Y2hlcyA9IGVudHJ5Lm1hdGNoKCBOQU1FX0NPVU5UX1JFR0VYUCApO1xyXG4gICAgICAgIHZhciBuYW1lID0gbWF0Y2hlc1sxXTtcclxuICAgICAgICB2YXIgY291bnQgPSAoIG1hdGNoZXNbMl0gPT09IHVuZGVmaW5lZCApID8gMSA6IHBhcnNlSW50KCBtYXRjaGVzWzJdLCAxMCApO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHF1YWxpZmllcjogcXVhbGlmaWVyLFxyXG4gICAgICAgICAgICBwcmVjaXNpb246IHByZWNpc2lvbixcclxuICAgICAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICAgICAgbmFtZTogbmFtZSxcclxuICAgICAgICAgICAgY291bnQ6IGNvdW50XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFBhcnNlcyBhIHNpbmdsZSAnc3RhdGVtZW50Jy4gQSAnc3RhdGVtZW50JyBpcyBjb25zaWRlcmVkIGFueSBzZXF1ZW5jZSBvZlxyXG4gICAgICogY2hhcmFjdGVycyBmb2xsb3dlZCBieSBhIHNlbWktY29sb24uIFRoZXJlZm9yZSwgYSBzaW5nbGUgJ3N0YXRlbWVudCcgaW5cclxuICAgICAqIHRoaXMgc2Vuc2UgY291bGQgY29udGFpbiBzZXZlcmFsIGNvbW1hIHNlcGFyYXRlZCBkZWNsYXJhdGlvbnMuIFJldHVybnNcclxuICAgICAqIGFsbCByZXN1bHRpbmcgZGVjbGFyYXRpb25zLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdGF0ZW1lbnQgLSBUaGUgc3RhdGVtZW50IHRvIHBhcnNlLlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHByZWNpc2lvbnMgLSBUaGUgY3VycmVudCBzdGF0ZSBvZiBnbG9iYWwgcHJlY2lzaW9ucy5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFRoZSBhcnJheSBvZiBwYXJzZWQgZGVjbGFyYXRpb24gb2JqZWN0cy5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcGFyc2VTdGF0ZW1lbnQoIHN0YXRlbWVudCwgcHJlY2lzaW9ucyApIHtcclxuICAgICAgICAvLyBzcGxpdCBzdGF0ZW1lbnQgb24gY29tbWFzXHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyBbICd1bmlmb3JtIGhpZ2hwIG1hdDQgQVsxMF0nLCAnQicsICdDWzJdJyBdXHJcbiAgICAgICAgLy9cclxuICAgICAgICB2YXIgY29tbWFTcGxpdCA9IHN0YXRlbWVudC5zcGxpdCgnLCcpLm1hcCggZnVuY3Rpb24oIGVsZW0gKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtLnRyaW0oKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gc3BsaXQgZGVjbGFyYXRpb24gaGVhZGVyIGZyb20gc3RhdGVtZW50XHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyBbICd1bmlmb3JtJywgJ2hpZ2hwJywgJ21hdDQnLCAnQVsxMF0nIF1cclxuICAgICAgICAvL1xyXG4gICAgICAgIHZhciBoZWFkZXIgPSBjb21tYVNwbGl0LnNoaWZ0KCkuc3BsaXQoJyAnKTtcclxuXHJcbiAgICAgICAgLy8gcXVhbGlmaWVyIGlzIGFsd2F5cyBmaXJzdCBlbGVtZW50XHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyAndW5pZm9ybSdcclxuICAgICAgICAvL1xyXG4gICAgICAgIHZhciBxdWFsaWZpZXIgPSBoZWFkZXIuc2hpZnQoKTtcclxuXHJcbiAgICAgICAgLy8gcHJlY2lzaW9uIG1heSBvciBtYXkgbm90IGJlIGRlY2xhcmVkXHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyAnaGlnaHAnIHx8IChpZiBpdCB3YXMgb21pdGVkKSAnbWF0NCdcclxuICAgICAgICAvL1xyXG4gICAgICAgIHZhciBwcmVjaXNpb24gPSBoZWFkZXIuc2hpZnQoKTtcclxuICAgICAgICB2YXIgdHlwZTtcclxuICAgICAgICAvLyBpZiBub3QgYSBwcmVjaXNpb24ga2V5d29yZCBpdCBpcyB0aGUgdHlwZSBpbnN0ZWFkXHJcbiAgICAgICAgaWYgKCAhUFJFQ0lTSU9OX1FVQUxJRklFUlNbIHByZWNpc2lvbiBdICkge1xyXG4gICAgICAgICAgICB0eXBlID0gcHJlY2lzaW9uO1xyXG4gICAgICAgICAgICBwcmVjaXNpb24gPSBwcmVjaXNpb25zWyBQUkVDSVNJT05fVFlQRVNbIHR5cGUgXSBdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHR5cGUgPSBoZWFkZXIuc2hpZnQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGxhc3QgcGFydCBvZiBoZWFkZXIgd2lsbCBiZSB0aGUgZmlyc3QsIGFuZCBwb3NzaWJsZSBvbmx5IHZhcmlhYmxlIG5hbWVcclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vIFsgJ0FbMTBdJywgJ0InLCAnQ1syXScgXVxyXG4gICAgICAgIC8vXHJcbiAgICAgICAgdmFyIG5hbWVzID0gaGVhZGVyLmNvbmNhdCggY29tbWFTcGxpdCApO1xyXG4gICAgICAgIC8vIGlmIHRoZXJlIGFyZSBvdGhlciBuYW1lcyBhZnRlciBhICcsJyBhZGQgdGhlbSBhcyB3ZWxsXHJcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcclxuICAgICAgICBuYW1lcy5mb3JFYWNoKCBmdW5jdGlvbiggbmFtZSApIHtcclxuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKCBwYXJzZU5hbWVBbmRDb3VudCggcXVhbGlmaWVyLCBwcmVjaXNpb24sIHR5cGUsIG5hbWUgKSApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3BsaXRzIHRoZSBzb3VyY2Ugc3RyaW5nIGJ5IHNlbWktY29sb25zIGFuZCBjb25zdHJ1Y3RzIGFuIGFycmF5IG9mXHJcbiAgICAgKiBkZWNsYXJhdGlvbiBvYmplY3RzIGJhc2VkIG9uIHRoZSBwcm92aWRlZCBxdWFsaWZpZXIga2V5d29yZHMuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZSAtIFRoZSBzaGFkZXIgc291cmNlIHN0cmluZy5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBrZXl3b3JkcyAtIFRoZSBxdWFsaWZpZXIgZGVjbGFyYXRpb24ga2V5d29yZHMuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge0FycmF5fSBUaGUgYXJyYXkgb2YgcXVhbGlmaWVyIGRlY2xhcmF0aW9uIG9iamVjdHMuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHBhcnNlU291cmNlKCBzb3VyY2UsIGtleXdvcmRzICkge1xyXG4gICAgICAgIC8vIHJlbW92ZSBhbGwgY29tbWVudHMgZnJvbSBzb3VyY2VcclxuICAgICAgICB2YXIgY29tbWVudGxlc3NTb3VyY2UgPSBzdHJpcENvbW1lbnRzKCBzb3VyY2UgKTtcclxuICAgICAgICAvLyBub3JtYWxpemUgYWxsIHdoaXRlc3BhY2UgaW4gdGhlIHNvdXJjZVxyXG4gICAgICAgIHZhciBub3JtYWxpemVkID0gbm9ybWFsaXplV2hpdGVzcGFjZSggY29tbWVudGxlc3NTb3VyY2UgKTtcclxuICAgICAgICAvLyBnZXQgaW5kaXZpZHVhbCBzdGF0ZW1lbnRzICggYW55IHNlcXVlbmNlIGVuZGluZyBpbiA7IClcclxuICAgICAgICB2YXIgc3RhdGVtZW50cyA9IG5vcm1hbGl6ZWQuc3BsaXQoJzsnKTtcclxuICAgICAgICAvLyBidWlsZCByZWdleCBmb3IgcGFyc2luZyBzdGF0ZW1lbnRzIHdpdGggdGFyZ2V0dGVkIGtleXdvcmRzXHJcbiAgICAgICAgdmFyIGtleXdvcmRTdHIgPSBrZXl3b3Jkcy5qb2luKCd8Jyk7XHJcbiAgICAgICAgdmFyIGtleXdvcmRSZWdleCA9IG5ldyBSZWdFeHAoICcuKlxcXFxiKCcgKyBrZXl3b3JkU3RyICsgJylcXFxcYi4qJyApO1xyXG4gICAgICAgIC8vIHBhcnNlIGFuZCBzdG9yZSBnbG9iYWwgcHJlY2lzaW9uIHN0YXRlbWVudHMgYW5kIGFueSBkZWNsYXJhdGlvbnNcclxuICAgICAgICB2YXIgcHJlY2lzaW9ucyA9IHt9O1xyXG4gICAgICAgIHZhciBtYXRjaGVkID0gW107XHJcbiAgICAgICAgLy8gZm9yIGVhY2ggc3RhdGVtZW50XHJcbiAgICAgICAgc3RhdGVtZW50cy5mb3JFYWNoKCBmdW5jdGlvbiggc3RhdGVtZW50ICkge1xyXG4gICAgICAgICAgICAvLyBjaGVjayBpZiBwcmVjaXNpb24gc3RhdGVtZW50XHJcbiAgICAgICAgICAgIC8vXHJcbiAgICAgICAgICAgIC8vIFsgJ3ByZWNpc2lvbiBoaWdocCBmbG9hdCcsICdwcmVjaXNpb24nLCAnaGlnaHAnLCAnZmxvYXQnIF1cclxuICAgICAgICAgICAgLy9cclxuICAgICAgICAgICAgdmFyIHBtYXRjaCA9IHN0YXRlbWVudC5tYXRjaCggUFJFQ0lTSU9OX1JFR0VYICk7XHJcbiAgICAgICAgICAgIGlmICggcG1hdGNoICkge1xyXG4gICAgICAgICAgICAgICAgcHJlY2lzaW9uc1sgcG1hdGNoWzNdIF0gPSBwbWF0Y2hbMl07XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gY2hlY2sgZm9yIGtleXdvcmRzXHJcbiAgICAgICAgICAgIC8vXHJcbiAgICAgICAgICAgIC8vIFsgJ3VuaWZvcm0gZmxvYXQgdGltZScgXVxyXG4gICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICB2YXIga21hdGNoID0gc3RhdGVtZW50Lm1hdGNoKCBrZXl3b3JkUmVnZXggKTtcclxuICAgICAgICAgICAgaWYgKCBrbWF0Y2ggKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBwYXJzZSBzdGF0ZW1lbnQgYW5kIGFkZCB0byBhcnJheVxyXG4gICAgICAgICAgICAgICAgbWF0Y2hlZCA9IG1hdGNoZWQuY29uY2F0KCBwYXJzZVN0YXRlbWVudCgga21hdGNoWzBdLCBwcmVjaXNpb25zICkgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBtYXRjaGVkO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlsdGVycyBvdXQgZHVwbGljYXRlIGRlY2xhcmF0aW9ucyBwcmVzZW50IGJldHdlZW4gc2hhZGVycy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBkZWNsYXJhdGlvbnMgLSBUaGUgYXJyYXkgb2YgZGVjbGFyYXRpb25zLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gVGhlIGZpbHRlcmVkIGFycmF5IG9mIGRlY2xhcmF0aW9ucy5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZmlsdGVyRHVwbGljYXRlc0J5TmFtZSggZGVjbGFyYXRpb25zICkge1xyXG4gICAgICAgIC8vIGluIGNhc2VzIHdoZXJlIHRoZSBzYW1lIGRlY2xhcmF0aW9ucyBhcmUgcHJlc2VudCBpbiBtdWx0aXBsZVxyXG4gICAgICAgIC8vIHNvdXJjZXMsIHRoaXMgZnVuY3Rpb24gd2lsbCByZW1vdmUgZHVwbGljYXRlcyBmcm9tIHRoZSByZXN1bHRzXHJcbiAgICAgICAgdmFyIHNlZW4gPSB7fTtcclxuICAgICAgICByZXR1cm4gZGVjbGFyYXRpb25zLmZpbHRlciggZnVuY3Rpb24oIGRlY2xhcmF0aW9uICkge1xyXG4gICAgICAgICAgICBpZiAoIHNlZW5bIGRlY2xhcmF0aW9uLm5hbWUgXSApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzZWVuWyBkZWNsYXJhdGlvbi5uYW1lIF0gPSB0cnVlO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUGFyc2VzIHRoZSBwcm92aWRlZCBHTFNMIHNvdXJjZSwgYW5kIHJldHVybnMgYWxsIGRlY2xhcmF0aW9uIHN0YXRlbWVudHNcclxuICAgICAgICAgKiB0aGF0IGNvbnRhaW4gdGhlIHByb3ZpZGVkIHF1YWxpZmllciB0eXBlLiBUaGlzIGNhbiBiZSB1c2VkIHRvIGV4dHJhY3RcclxuICAgICAgICAgKiBhbGwgYXR0cmlidXRlcyBhbmQgdW5pZm9ybSBuYW1lcyBhbmQgdHlwZXMgZnJvbSBhIHNoYWRlci5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEZvciBleGFtcGxlLCB3aGVuIHByb3ZpZGVkIGEgJ3VuaWZvcm0nIHF1YWxpZmllcnMsIHRoZSBkZWNsYXJhdGlvbjpcclxuICAgICAgICAgKiA8cHJlPlxyXG4gICAgICAgICAqICAgICAndW5pZm9ybSBoaWdocCB2ZWMzIHVTcGVjdWxhckNvbG9yOydcclxuICAgICAgICAgKiA8L3ByZT5cclxuICAgICAgICAgKiBXb3VsZCBiZSBwYXJzZWQgdG86XHJcbiAgICAgICAgICogPHByZT5cclxuICAgICAgICAgKiAgICAge1xyXG4gICAgICAgICAqICAgICAgICAgcXVhbGlmaWVyOiAndW5pZm9ybScsXHJcbiAgICAgICAgICogICAgICAgICB0eXBlOiAndmVjMycsXHJcbiAgICAgICAgICogICAgICAgICBuYW1lOiAndVNwZWN1bGFyQ29sb3InLFxyXG4gICAgICAgICAqICAgICAgICAgY291bnQ6IDFcclxuICAgICAgICAgKiAgICAgfVxyXG4gICAgICAgICAqIDwvcHJlPlxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBzb3VyY2VzIC0gVGhlIHNoYWRlciBzb3VyY2VzLlxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBxdWFsaWZpZXJzIC0gVGhlIHF1YWxpZmllcnMgdG8gZXh0cmFjdC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheX0gVGhlIGFycmF5IG9mIHF1YWxpZmllciBkZWNsYXJhdGlvbiBzdGF0ZW1lbnRzLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHBhcnNlRGVjbGFyYXRpb25zOiBmdW5jdGlvbiggc291cmNlcywgcXVhbGlmaWVycyApIHtcclxuICAgICAgICAgICAgLy8gaWYgbm8gc291cmNlcyBvciBxdWFsaWZpZXJzIGFyZSBwcm92aWRlZCwgcmV0dXJuIGVtcHR5IGFycmF5XHJcbiAgICAgICAgICAgIGlmICggIXF1YWxpZmllcnMgfHwgcXVhbGlmaWVycy5sZW5ndGggPT09IDAgfHxcclxuICAgICAgICAgICAgICAgICFzb3VyY2VzIHx8IHNvdXJjZXMubGVuZ3RoID09PSAwICkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNvdXJjZXMgPSAoIHNvdXJjZXMgaW5zdGFuY2VvZiBBcnJheSApID8gc291cmNlcyA6IFsgc291cmNlcyBdO1xyXG4gICAgICAgICAgICBxdWFsaWZpZXJzID0gKCBxdWFsaWZpZXJzIGluc3RhbmNlb2YgQXJyYXkgKSA/IHF1YWxpZmllcnMgOiBbIHF1YWxpZmllcnMgXTtcclxuICAgICAgICAgICAgLy8gcGFyc2Ugb3V0IHRhcmdldHRlZCBkZWNsYXJhdGlvbnNcclxuICAgICAgICAgICAgdmFyIGRlY2xhcmF0aW9ucyA9IFtdO1xyXG4gICAgICAgICAgICBzb3VyY2VzLmZvckVhY2goIGZ1bmN0aW9uKCBzb3VyY2UgKSB7XHJcbiAgICAgICAgICAgICAgICBkZWNsYXJhdGlvbnMgPSBkZWNsYXJhdGlvbnMuY29uY2F0KCBwYXJzZVNvdXJjZSggc291cmNlLCBxdWFsaWZpZXJzICkgKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIHJlbW92ZSBkdXBsaWNhdGVzIGFuZCByZXR1cm5cclxuICAgICAgICAgICAgcmV0dXJuIGZpbHRlckR1cGxpY2F0ZXNCeU5hbWUoIGRlY2xhcmF0aW9ucyApO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIERldGVjdHMgYmFzZWQgb24gdGhlIGV4aXN0ZW5jZSBvZiBhICd2b2lkIG1haW4oKSB7JyBzdGF0ZW1lbnQsIGlmXHJcbiAgICAgICAgICogdGhlIHN0cmluZyBpcyBnbHNsIHNvdXJjZSBjb2RlLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHN0ciAtIFRoZSBpbnB1dCBzdHJpbmcgdG8gdGVzdC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufSAtIFRydWUgaWYgdGhlIHN0cmluZyBpcyBnbHNsIGNvZGUuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgaXNHTFNMOiBmdW5jdGlvbiggc3RyICkge1xyXG4gICAgICAgICAgICByZXR1cm4gR0xTTF9SRUdFWFAudGVzdCggc3RyICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICB2YXIgV2ViR0xDb250ZXh0ID0gcmVxdWlyZSgnLi9XZWJHTENvbnRleHQnKSxcclxuICAgICAgICBVdGlsID0gcmVxdWlyZSgnLi4vdXRpbC9VdGlsJyksXHJcbiAgICAgICAgU3RhY2sgPSByZXF1aXJlKCcuLi91dGlsL1N0YWNrJyksXHJcbiAgICAgICAgX3N0YWNrID0ge30sXHJcbiAgICAgICAgX2JvdW5kVGV4dHVyZSA9IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJZiB0aGUgcHJvdmlkZWQgaW1hZ2UgZGltZW5zaW9ucyBhcmUgbm90IHBvd2VycyBvZiB0d28sIGl0IHdpbGwgcmVkcmF3XHJcbiAgICAgKiB0aGUgaW1hZ2UgdG8gdGhlIG5leHQgaGlnaGVzdCBwb3dlciBvZiB0d28uXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtIVE1MSW1hZ2VFbGVtZW50fSBpbWFnZSAtIFRoZSBpbWFnZSBvYmplY3QuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge0hUTUxJbWFnZUVsZW1lbnR9IFRoZSBuZXcgaW1hZ2Ugb2JqZWN0LlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBlbnN1cmVQb3dlck9mVHdvKCBpbWFnZSApIHtcclxuICAgICAgICBpZiAoICFVdGlsLmlzUG93ZXJPZlR3byggaW1hZ2Uud2lkdGggKSB8fFxyXG4gICAgICAgICAgICAhVXRpbC5pc1Bvd2VyT2ZUd28oIGltYWdlLmhlaWdodCApICkge1xyXG4gICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcclxuICAgICAgICAgICAgY2FudmFzLndpZHRoID0gVXRpbC5uZXh0SGlnaGVzdFBvd2VyT2ZUd28oIGltYWdlLndpZHRoICk7XHJcbiAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBVdGlsLm5leHRIaWdoZXN0UG93ZXJPZlR3byggaW1hZ2UuaGVpZ2h0ICk7XHJcbiAgICAgICAgICAgIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShcclxuICAgICAgICAgICAgICAgIGltYWdlLFxyXG4gICAgICAgICAgICAgICAgMCwgMCxcclxuICAgICAgICAgICAgICAgIGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAwLCAwLFxyXG4gICAgICAgICAgICAgICAgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0ICk7XHJcbiAgICAgICAgICAgIHJldHVybiBjYW52YXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBpbWFnZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEJpbmRzIHRoZSB0ZXh0dXJlIG9iamVjdCB0byBhIGxvY2F0aW9uIGFuZCBhY3RpdmF0ZXMgdGhlIHRleHR1cmUgdW5pdFxyXG4gICAgICogd2hpbGUgY2FjaGluZyBpdCB0byBwcmV2ZW50IHVubmVjZXNzYXJ5IHJlYmluZHMuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtUZXh0dXJlMkR9IHRleHR1cmUgLSBUaGUgVGV4dHVyZTJEIG9iamVjdCB0byBiaW5kLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxvY2F0aW9uIC0gVGhlIHRleHR1cmUgdW5pdCBsb2NhdGlvbiBpbmRleC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gYmluZCggdGV4dHVyZSwgbG9jYXRpb24gKSB7XHJcbiAgICAgICAgLy8gaWYgdGhpcyBidWZmZXIgaXMgYWxyZWFkeSBib3VuZCwgZXhpdCBlYXJseVxyXG4gICAgICAgIGlmICggX2JvdW5kVGV4dHVyZSA9PT0gdGV4dHVyZSApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZ2wgPSB0ZXh0dXJlLmdsO1xyXG4gICAgICAgIGxvY2F0aW9uID0gZ2xbICdURVhUVVJFJyArIGxvY2F0aW9uIF0gfHwgZ2wuVEVYVFVSRTA7XHJcbiAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZSggbG9jYXRpb24gKTtcclxuICAgICAgICBnbC5iaW5kVGV4dHVyZSggZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZS50ZXh0dXJlICk7XHJcbiAgICAgICAgX2JvdW5kVGV4dHVyZSA9IHRleHR1cmU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVbmJpbmRzIHRoZSB0ZXh0dXJlIG9iamVjdC4gUHJldmVudHMgdW5uZWNlc3NhcnkgdW5iaW5kaW5nLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7VGV4dHVyZTJEfSB0ZXh0dXJlIC0gVGhlIFRleHR1cmUyRCBvYmplY3QgdG8gdW5iaW5kLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiB1bmJpbmQoIHRleHR1cmUgKSB7XHJcbiAgICAgICAgLy8gaWYgbm8gYnVmZmVyIGlzIGJvdW5kLCBleGl0IGVhcmx5XHJcbiAgICAgICAgaWYgKCBfYm91bmRUZXh0dXJlID09PSBudWxsICkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBnbCA9IHRleHR1cmUuZ2w7XHJcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoIGdsLlRFWFRVUkVfMkQsIG51bGwgKTtcclxuICAgICAgICBfYm91bmRUZXh0dXJlID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEluc3RhbnRpYXRlcyBhIFRleHR1cmUyRCBvYmplY3QuXHJcbiAgICAgKiBAY2xhc3MgVGV4dHVyZTJEXHJcbiAgICAgKiBAY2xhc3NkZXNjIEEgdGV4dHVyZSBjbGFzcyB0byByZXByZXNlbnQgYSAyRCB0ZXh0dXJlLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBUZXh0dXJlMkQoIHNwZWMsIGNhbGxiYWNrICkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICAvLyBkZWZhdWx0XHJcbiAgICAgICAgc3BlYyA9IHNwZWMgfHwge307XHJcbiAgICAgICAgdGhpcy5nbCA9IFdlYkdMQ29udGV4dC5nZXQoKTtcclxuICAgICAgICAvLyBjcmVhdGUgdGV4dHVyZSBvYmplY3RcclxuICAgICAgICB0aGlzLnRleHR1cmUgPSB0aGlzLmdsLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgICAgICB0aGlzLndyYXAgPSBzcGVjLndyYXAgfHwgJ1JFUEVBVCc7XHJcbiAgICAgICAgdGhpcy5maWx0ZXIgPSBzcGVjLmZpbHRlciB8fCAnTElORUFSJztcclxuICAgICAgICB0aGlzLmludmVydFkgPSBzcGVjLmludmVydFkgIT09IHVuZGVmaW5lZCA/IHNwZWMuaW52ZXJ0WSA6IHRydWU7XHJcbiAgICAgICAgdGhpcy5taXBNYXAgPSBzcGVjLm1pcE1hcCAhPT0gdW5kZWZpbmVkID8gc3BlYy5taXBNYXAgOiB0cnVlO1xyXG4gICAgICAgIHRoaXMucHJlTXVsdGlwbHlBbHBoYSA9IHNwZWMucHJlTXVsdGlwbHlBbHBoYSAhPT0gdW5kZWZpbmVkID8gc3BlYy5wcmVNdWx0aXBseUFscGhhIDogdHJ1ZTtcclxuICAgICAgICAvLyBidWZmZXIgdGhlIHRleHR1cmUgYmFzZWQgb24gYXJndW1lbnRzXHJcbiAgICAgICAgaWYgKCBzcGVjLmltYWdlICkge1xyXG4gICAgICAgICAgICAvLyB1c2UgZXhpc3RpbmcgSW1hZ2Ugb2JqZWN0XHJcbiAgICAgICAgICAgIHRoaXMuYnVmZmVyRGF0YSggc3BlYy5pbWFnZSApO1xyXG4gICAgICAgICAgICB0aGlzLnNldFBhcmFtZXRlcnMoIHRoaXMgKTtcclxuICAgICAgICB9IGVsc2UgaWYgKCBzcGVjLnVybCApIHtcclxuICAgICAgICAgICAgLy8gcmVxdWVzdCBpbWFnZSBzb3VyY2UgZnJvbSB1cmxcclxuICAgICAgICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XHJcbiAgICAgICAgICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5idWZmZXJEYXRhKCBpbWFnZSApO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5zZXRQYXJhbWV0ZXJzKCB0aGF0ICk7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayggdGhhdCApO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpbWFnZS5zcmMgPSBzcGVjLnVybDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBhc3N1bWUgdGhpcyB0ZXh0dXJlIHdpbGwgYmUgIHJlbmRlcmVkIHRvLiBJbiB0aGlzIGNhc2UgZGlzYWJsZVxyXG4gICAgICAgICAgICAvLyBtaXBtYXBwaW5nLCB0aGVyZSBpcyBubyBuZWVkIGFuZCBpdCB3aWxsIG9ubHkgaW50cm9kdWNlIHZlcnlcclxuICAgICAgICAgICAgLy8gcGVjdWxpYXIgcmVuZGVyaW5nIGJ1Z3MgaW4gd2hpY2ggdGhlIHRleHR1cmUgJ3RyYW5zZm9ybXMnIGF0XHJcbiAgICAgICAgICAgIC8vIGNlcnRhaW4gYW5nbGVzIC8gZGlzdGFuY2VzIHRvIHRoZSBtaXBtYXBwZWQgKGVtcHR5KSBwb3J0aW9ucy5cclxuICAgICAgICAgICAgdGhpcy5taXBNYXAgPSBmYWxzZTtcclxuICAgICAgICAgICAgLy8gYnVmZmVyIGRhdGFcclxuICAgICAgICAgICAgaWYgKCBzcGVjLmZvcm1hdCA9PT0gJ0RFUFRIX0NPTVBPTkVOVCcgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBkZXB0aCB0ZXh0dXJlXHJcbiAgICAgICAgICAgICAgICB2YXIgZGVwdGhUZXh0dXJlRXh0ID0gV2ViR0xDb250ZXh0LmNoZWNrRXh0ZW5zaW9uKCAnV0VCR0xfZGVwdGhfdGV4dHVyZScgKTtcclxuICAgICAgICAgICAgICAgIGlmKCAhZGVwdGhUZXh0dXJlRXh0ICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ0Nhbm5vdCBjcmVhdGUgVGV4dHVyZTJEIG9mIGZvcm1hdCAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ2dsLkRFUFRIX0NPTVBPTkVOVCBhcyBXRUJHTF9kZXB0aF90ZXh0dXJlIGlzICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAndW5zdXBwb3J0ZWQgYnkgdGhpcyBicm93c2VyLCBjb21tYW5kIGlnbm9yZWQnICk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gc2V0IGZvcm1hdFxyXG4gICAgICAgICAgICAgICAgdGhpcy5mb3JtYXQgPSBzcGVjLmZvcm1hdDtcclxuICAgICAgICAgICAgICAgIC8vIHNldCB0eXBlXHJcbiAgICAgICAgICAgICAgICBpZiAoICFzcGVjLnR5cGUgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZGVmYXVsdCB0byB1bnNpZ25lZCBpbnQgZm9yIGhpZ2hlciBwcmVjaXNpb25cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnR5cGUgPSAnVU5TSUdORURfSU5UJztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHNwZWMudHlwZSA9PT0gJ1VOU0lHTkVEX1NIT1JUJyB8fCBzcGVjLnR5cGUgPT09ICdVTlNJR05FRF9JTlQnICkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHNldCB0byBhY2NlcHQgdHlwZXNcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnR5cGUgPSBzcGVjLnR5cGU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGVycm9yXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCAnRGVwdGggdGV4dHVyZXMgZG8gbm90IHN1cHBvcnQgdHlwZWAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3BlYy50eXBlICsgJ2AsIGRlZmF1bHRpbmcgdG8gYFVOU0lHTkVEX0lOVGAuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZGVmYXVsdFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHlwZSA9ICdVTlNJR05FRF9JTlQnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gYWx3YXlzIGRpc2FibGUgbWlwIG1hcHBpbmcgZm9yIGRlcHRoIHRleHR1cmVcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIG90aGVyXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZvcm1hdCA9IHNwZWMuZm9ybWF0IHx8ICdSR0JBJztcclxuICAgICAgICAgICAgICAgIHRoaXMudHlwZSA9IHNwZWMudHlwZSB8fCAnVU5TSUdORURfQllURSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5pbnRlcm5hbEZvcm1hdCA9IHRoaXMuZm9ybWF0OyAvLyB3ZWJnbCByZXF1aXJlcyBmb3JtYXQgPT09IGludGVybmFsRm9ybWF0XHJcbiAgICAgICAgICAgIHRoaXMuYnVmZmVyRGF0YSggc3BlYy5kYXRhIHx8IG51bGwsIHNwZWMud2lkdGgsIHNwZWMuaGVpZ2h0ICk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0UGFyYW1ldGVycyggdGhpcyApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEJpbmRzIHRoZSB0ZXh0dXJlIG9iamVjdCBhbmQgcHVzaGVzIGl0IHRvIHRoZSBmcm9udCBvZiB0aGUgc3RhY2suXHJcbiAgICAgKiBAbWVtYmVyb2YgVGV4dHVyZTJEXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxvY2F0aW9uIC0gVGhlIHRleHR1cmUgdW5pdCBsb2NhdGlvbiBpbmRleC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7VGV4dHVyZTJEfSBUaGUgdGV4dHVyZSBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgVGV4dHVyZTJELnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24oIGxvY2F0aW9uICkge1xyXG4gICAgICAgIF9zdGFja1sgbG9jYXRpb24gXSA9IF9zdGFja1sgbG9jYXRpb24gXSB8fCBuZXcgU3RhY2soKTtcclxuICAgICAgICBfc3RhY2tbIGxvY2F0aW9uIF0ucHVzaCggdGhpcyApO1xyXG4gICAgICAgIGJpbmQoIHRoaXMsIGxvY2F0aW9uICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVW5iaW5kcyB0aGUgdGV4dHVyZSBvYmplY3QgYW5kIGJpbmRzIHRoZSB0ZXh0dXJlIGJlbmVhdGggaXQgb25cclxuICAgICAqIHRoaXMgc3RhY2suIElmIHRoZXJlIGlzIG5vIHVuZGVybHlpbmcgdGV4dHVyZSwgdW5iaW5kcyB0aGUgdW5pdC5cclxuICAgICAqIEBtZW1iZXJvZiBUZXh0dXJlMkRcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbG9jYXRpb24gLSBUaGUgdGV4dHVyZSB1bml0IGxvY2F0aW9uIGluZGV4LlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtUZXh0dXJlMkR9IFRoZSB0ZXh0dXJlIG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBUZXh0dXJlMkQucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uKCBsb2NhdGlvbiApIHtcclxuICAgICAgICB2YXIgdG9wO1xyXG4gICAgICAgIGlmICggIV9zdGFja1sgbG9jYXRpb24gXSApIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCAnTm8gdGV4dHVyZSB3YXMgYm91bmQgdG8gdGV4dHVyZSB1bml0IGAnICsgbG9jYXRpb24gK1xyXG4gICAgICAgICAgICAgICAgJ2AsIGNvbW1hbmQgaWdub3JlZC4nICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF9zdGFja1sgbG9jYXRpb24gXS5wb3AoKTtcclxuICAgICAgICB0b3AgPSBfc3RhY2tbIGxvY2F0aW9uIF0udG9wKCk7XHJcbiAgICAgICAgaWYgKCB0b3AgKSB7XHJcbiAgICAgICAgICAgIGJpbmQoIHRvcCwgbG9jYXRpb24gKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB1bmJpbmQoIHRoaXMgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQnVmZmVyIGRhdGEgaW50byB0aGUgdGV4dHVyZS5cclxuICAgICAqIEBtZW1iZXJvZiBUZXh0dXJlMkRcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge0ltYWdlRGF0YXxBcnJheUJ1ZmZlclZpZXd8SFRNTEltYWdlRWxlbWVudH0gZGF0YSAtIFRoZSBkYXRhLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoIC0gVGhlIHdpZHRoIG9mIHRoZSBkYXRhLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIFRoZSBoZWlnaHQgb2YgdGhlIGRhdGEuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1RleHR1cmUyRH0gVGhlIHRleHR1cmUgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIFRleHR1cmUyRC5wcm90b3R5cGUuYnVmZmVyRGF0YSA9IGZ1bmN0aW9uKCBkYXRhLCB3aWR0aCwgaGVpZ2h0ICkge1xyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgdGhpcy5wdXNoKCk7XHJcbiAgICAgICAgLy8gaW52ZXJ0IHkgaWYgc3BlY2lmaWVkXHJcbiAgICAgICAgZ2wucGl4ZWxTdG9yZWkoIGdsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRoaXMuaW52ZXJ0WSApO1xyXG4gICAgICAgIC8vIHByZW11bHRpcGxlIGFscGhhIGlmIHNwZWNpZmllZFxyXG4gICAgICAgIGdsLnBpeGVsU3RvcmVpKCBnbC5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsIHRoaXMucHJlTXVsdGlwbHlBbHBoYSApO1xyXG4gICAgICAgIC8vIGJ1ZmZlciB0ZXh0dXJlIGJhc2VkIG9uIHR5cGUgb2YgZGF0YVxyXG4gICAgICAgIGlmICggZGF0YSBpbnN0YW5jZW9mIEhUTUxJbWFnZUVsZW1lbnQgKSB7XHJcbiAgICAgICAgICAgIC8vIHNldCBkaW1lbnNpb25zIG9mIG9yaWdpbmFsIGltYWdlIGJlZm9yZSByZXNpemluZ1xyXG4gICAgICAgICAgICB0aGlzLndpZHRoID0gZGF0YS53aWR0aDtcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBkYXRhLmhlaWdodDtcclxuICAgICAgICAgICAgZGF0YSA9IGVuc3VyZVBvd2VyT2ZUd28oIGRhdGEgKTtcclxuICAgICAgICAgICAgdGhpcy5pbWFnZSA9IGRhdGE7XHJcbiAgICAgICAgICAgIGdsLnRleEltYWdlMkQoXHJcbiAgICAgICAgICAgICAgICBnbC5URVhUVVJFXzJELFxyXG4gICAgICAgICAgICAgICAgMCwgLy8gbGV2ZWxcclxuICAgICAgICAgICAgICAgIGdsLlJHQkEsXHJcbiAgICAgICAgICAgICAgICBnbC5SR0JBLFxyXG4gICAgICAgICAgICAgICAgZ2wuVU5TSUdORURfQllURSxcclxuICAgICAgICAgICAgICAgIGRhdGEgKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xyXG4gICAgICAgICAgICB0aGlzLndpZHRoID0gd2lkdGggfHwgdGhpcy53aWR0aDtcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQgfHwgdGhpcy5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGdsLnRleEltYWdlMkQoXHJcbiAgICAgICAgICAgICAgICBnbC5URVhUVVJFXzJELFxyXG4gICAgICAgICAgICAgICAgMCwgLy8gbGV2ZWxcclxuICAgICAgICAgICAgICAgIGdsWyB0aGlzLmludGVybmFsRm9ybWF0IF0sXHJcbiAgICAgICAgICAgICAgICB0aGlzLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAwLCAvLyBib3JkZXIsIG11c3QgYmUgMFxyXG4gICAgICAgICAgICAgICAgZ2xbIHRoaXMuZm9ybWF0IF0sXHJcbiAgICAgICAgICAgICAgICBnbFsgdGhpcy50eXBlIF0sXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCB0aGlzLm1pcE1hcCApIHtcclxuICAgICAgICAgICAgZ2wuZ2VuZXJhdGVNaXBtYXAoIGdsLlRFWFRVUkVfMkQgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wb3AoKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgdGhlIHRleHR1cmUgcGFyYW1ldGVycy5cclxuICAgICAqIEBtZW1iZXJvZiBUZXh0dXJlMkRcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyAtIFRoZSBwYXJhbWV0ZXJzIGJ5IG5hbWUuXHJcbiAgICAgKiA8cHJlPlxyXG4gICAgICogICAgIHdyYXAgfCB3cmFwLnMgfCB3cmFwLnQgLSBUaGUgd3JhcHBpbmcgdHlwZS5cclxuICAgICAqICAgICBmaWx0ZXIgfCBmaWx0ZXIubWluIHwgZmlsdGVyLm1hZyAtIFRoZSBmaWx0ZXIgdHlwZS5cclxuICAgICAqIDwvcHJlPlxyXG4gICAgICogQHJldHVybnMge1RleHR1cmUyRH0gVGhlIHRleHR1cmUgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIFRleHR1cmUyRC5wcm90b3R5cGUuc2V0UGFyYW1ldGVycyA9IGZ1bmN0aW9uKCBwYXJhbWV0ZXJzICkge1xyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgdGhpcy5wdXNoKCk7XHJcbiAgICAgICAgaWYgKCBwYXJhbWV0ZXJzLndyYXAgKSB7XHJcbiAgICAgICAgICAgIC8vIHNldCB3cmFwIHBhcmFtZXRlcnNcclxuICAgICAgICAgICAgdGhpcy53cmFwID0gcGFyYW1ldGVycy53cmFwO1xyXG4gICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKFxyXG4gICAgICAgICAgICAgICAgZ2wuVEVYVFVSRV8yRCxcclxuICAgICAgICAgICAgICAgIGdsLlRFWFRVUkVfV1JBUF9TLFxyXG4gICAgICAgICAgICAgICAgZ2xbIHRoaXMud3JhcC5zIHx8IHRoaXMud3JhcCBdICk7XHJcbiAgICAgICAgICAgIGdsLnRleFBhcmFtZXRlcmkoXHJcbiAgICAgICAgICAgICAgICBnbC5URVhUVVJFXzJELFxyXG4gICAgICAgICAgICAgICAgZ2wuVEVYVFVSRV9XUkFQX1QsXHJcbiAgICAgICAgICAgICAgICBnbFsgdGhpcy53cmFwLnQgfHwgdGhpcy53cmFwIF0gKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBwYXJhbWV0ZXJzLmZpbHRlciApIHtcclxuICAgICAgICAgICAgLy8gc2V0IGZpbHRlciBwYXJhbWV0ZXJzXHJcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyID0gcGFyYW1ldGVycy5maWx0ZXI7XHJcbiAgICAgICAgICAgIHZhciBtaW5GaWx0ZXIgPSB0aGlzLmZpbHRlci5taW4gfHwgdGhpcy5maWx0ZXI7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5taXBNYXAgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBhcHBlbmQgbWlwbWFwIHN1ZmZpeCB0byBtaW4gZmlsdGVyXHJcbiAgICAgICAgICAgICAgICBtaW5GaWx0ZXIgKz0gJ19NSVBNQVBfTElORUFSJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKFxyXG4gICAgICAgICAgICAgICAgZ2wuVEVYVFVSRV8yRCxcclxuICAgICAgICAgICAgICAgIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUixcclxuICAgICAgICAgICAgICAgIGdsWyB0aGlzLmZpbHRlci5tYWcgfHwgdGhpcy5maWx0ZXIgXSApO1xyXG4gICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKFxyXG4gICAgICAgICAgICAgICAgZ2wuVEVYVFVSRV8yRCxcclxuICAgICAgICAgICAgICAgIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUixcclxuICAgICAgICAgICAgICAgIGdsWyBtaW5GaWx0ZXJdICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucG9wKCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVzaXplIHRoZSB0ZXh0dXJlLlxyXG4gICAgICogQG1lbWJlcm9mIFRleHR1cmUyRFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aCAtIFRoZSBuZXcgd2lkdGggb2YgdGhlIHRleHR1cmUuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0IC0gVGhlIG5ldyBoZWlnaHQgb2YgdGhlIHRleHR1cmUuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1RleHR1cmUyRH0gVGhlIHRleHR1cmUgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIFRleHR1cmUyRC5wcm90b3R5cGUucmVzaXplID0gZnVuY3Rpb24oIHdpZHRoLCBoZWlnaHQgKSB7XHJcbiAgICAgICAgaWYgKCB0aGlzLmltYWdlICkge1xyXG4gICAgICAgICAgICAvLyB0aGVyZSBpcyBubyBuZWVkIHRvIGV2ZXIgcmVzaXplIGEgdGV4dHVyZSB0aGF0IGlzIGJhc2VkXHJcbiAgICAgICAgICAgIC8vIG9mIGFuIGFjdHVhbCBpbWFnZS4gVGhhdCBpcyB3aGF0IHNhbXBsaW5nIGlzIGZvci5cclxuICAgICAgICAgICAgY29uc29sZS5lcnJvciggJ0Nhbm5vdCByZXNpemUgaW1hZ2UgYmFzZWQgVGV4dHVyZTJEJyApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggIXdpZHRoIHx8ICFoZWlnaHQgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ1dpZHRoIG9yIGhlaWdodCBhcmd1bWVudHMgbWlzc2luZywgY29tbWFuZCBpZ25vcmVkLicgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmJ1ZmZlckRhdGEoIHRoaXMuZGF0YSwgd2lkdGgsIGhlaWdodCApO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRleHR1cmUyRDtcclxuXHJcbn0oKSk7XHJcbiIsIihmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIHZhciBXZWJHTENvbnRleHQgPSByZXF1aXJlKCcuL1dlYkdMQ29udGV4dCcpLFxyXG4gICAgICAgIFV0aWwgPSByZXF1aXJlKCcuLi91dGlsL1V0aWwnKSxcclxuICAgICAgICBTdGFjayA9IHJlcXVpcmUoJy4uL3V0aWwvU3RhY2snKSxcclxuICAgICAgICBGQUNFUyA9IFtcclxuICAgICAgICAgICAgJy14JywgJyt4JyxcclxuICAgICAgICAgICAgJy15JywgJyt5JyxcclxuICAgICAgICAgICAgJy16JywgJyt6J1xyXG4gICAgICAgIF0sXHJcbiAgICAgICAgRkFDRV9UQVJHRVRTID0ge1xyXG4gICAgICAgICAgICAnK3onOiAnVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9aJyxcclxuICAgICAgICAgICAgJy16JzogJ1RFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWicsXHJcbiAgICAgICAgICAgICcreCc6ICdURVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1gnLFxyXG4gICAgICAgICAgICAnLXgnOiAnVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9YJyxcclxuICAgICAgICAgICAgJyt5JzogJ1RFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWScsXHJcbiAgICAgICAgICAgICcteSc6ICdURVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1knXHJcbiAgICAgICAgfSxcclxuICAgICAgICBfc3RhY2sgPSB7fSxcclxuICAgICAgICBfYm91bmRUZXh0dXJlID0gbnVsbDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIElmIHRoZSBwcm92aWRlZCBpbWFnZSBkaW1lbnNpb25zIGFyZSBub3QgcG93ZXJzIG9mIHR3bywgaXQgd2lsbCByZWRyYXdcclxuICAgICAqIHRoZSBpbWFnZSB0byB0aGUgbmV4dCBoaWdoZXN0IHBvd2VyIG9mIHR3by5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge0hUTUxJbWFnZUVsZW1lbnR9IGltYWdlIC0gVGhlIGltYWdlIG9iamVjdC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7SFRNTEltYWdlRWxlbWVudH0gVGhlIG5ldyBpbWFnZSBvYmplY3QuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGVuc3VyZVBvd2VyT2ZUd28oIGltYWdlICkge1xyXG4gICAgICAgIGlmICggIVV0aWwuaXNQb3dlck9mVHdvKCBpbWFnZS53aWR0aCApIHx8XHJcbiAgICAgICAgICAgICFVdGlsLmlzUG93ZXJPZlR3byggaW1hZ2UuaGVpZ2h0ICkgKSB7XHJcbiAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApO1xyXG4gICAgICAgICAgICBjYW52YXMud2lkdGggPSBVdGlsLm5leHRIaWdoZXN0UG93ZXJPZlR3byggaW1hZ2Uud2lkdGggKTtcclxuICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IFV0aWwubmV4dEhpZ2hlc3RQb3dlck9mVHdvKCBpbWFnZS5oZWlnaHQgKTtcclxuICAgICAgICAgICAgdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgICAgICAgICBjdHguZHJhd0ltYWdlKFxyXG4gICAgICAgICAgICAgICAgaW1hZ2UsXHJcbiAgICAgICAgICAgICAgICAwLCAwLFxyXG4gICAgICAgICAgICAgICAgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCxcclxuICAgICAgICAgICAgICAgIDAsIDAsXHJcbiAgICAgICAgICAgICAgICBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQgKTtcclxuICAgICAgICAgICAgcmV0dXJuIGNhbnZhcztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGltYWdlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQmluZHMgdGhlIHRleHR1cmUgb2JqZWN0IHRvIGEgbG9jYXRpb24gYW5kIGFjdGl2YXRlcyB0aGUgdGV4dHVyZSB1bml0XHJcbiAgICAgKiB3aGlsZSBjYWNoaW5nIGl0IHRvIHByZXZlbnQgdW5uZWNlc3NhcnkgcmViaW5kcy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1RleHR1cmVDdWJlTWFwfSB0ZXh0dXJlIC0gVGhlIFRleHR1cmVDdWJlTWFwIG9iamVjdCB0byBiaW5kLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxvY2F0aW9uIC0gVGhlIHRleHR1cmUgdW5pdCBsb2NhdGlvbiBpbmRleC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gYmluZCggdGV4dHVyZSwgbG9jYXRpb24gKSB7XHJcbiAgICAgICAgLy8gaWYgdGhpcyBidWZmZXIgaXMgYWxyZWFkeSBib3VuZCwgZXhpdCBlYXJseVxyXG4gICAgICAgIGlmICggX2JvdW5kVGV4dHVyZSA9PT0gdGV4dHVyZSApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZ2wgPSB0ZXh0dXJlLmdsO1xyXG4gICAgICAgIGxvY2F0aW9uID0gZ2xbICdURVhUVVJFJyArIGxvY2F0aW9uIF0gfHwgZ2wuVEVYVFVSRTA7XHJcbiAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZSggbG9jYXRpb24gKTtcclxuICAgICAgICBnbC5iaW5kVGV4dHVyZSggZ2wuVEVYVFVSRV9DVUJFX01BUCwgdGV4dHVyZS50ZXh0dXJlICk7XHJcbiAgICAgICAgX2JvdW5kVGV4dHVyZSA9IHRleHR1cmU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVbmJpbmRzIHRoZSB0ZXh0dXJlIG9iamVjdC4gUHJldmVudHMgdW5uZWNlc3NhcnkgdW5iaW5kaW5nLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7VGV4dHVyZUN1YmVNYXB9IHRleHR1cmUgLSBUaGUgVGV4dHVyZUN1YmVNYXAgb2JqZWN0IHRvIHVuYmluZC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gdW5iaW5kKCB0ZXh0dXJlICkge1xyXG4gICAgICAgIC8vIGlmIG5vIGJ1ZmZlciBpcyBib3VuZCwgZXhpdCBlYXJseVxyXG4gICAgICAgIGlmICggX2JvdW5kVGV4dHVyZSA9PT0gbnVsbCApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZ2wgPSB0ZXh0dXJlLmdsO1xyXG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKCBnbC5URVhUVVJFX0NVQkVfTUFQLCBudWxsICk7XHJcbiAgICAgICAgX2JvdW5kVGV4dHVyZSA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdG8gbG9hZCBhbmQgYnVmZmVyIGEgZ2l2ZW4gY3ViZSBtYXAgZmFjZS5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1RleHR1cmVDdWJlTWFwfSBjdWJlTWFwIC0gVGhlIGN1YmUgbWFwIG9iamVjdC5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgLSBUaGUgdXJsIHRvIGxvYWQgdGhlIGltYWdlLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGZhY2UgLSBUaGUgZmFjZSBpZGVudGlmaWNhdGlvbiBzdHJpbmcuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBUaGUgcmVzdWx0aW5nIGZ1bmN0aW9uLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBsb2FkQW5kQnVmZmVySW1hZ2UoIGN1YmVNYXAsIHVybCwgZmFjZSApIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oIGRvbmUgKSB7XHJcbiAgICAgICAgICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG4gICAgICAgICAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIC8vIGJ1ZmZlciBmYWNlIHRleHR1cmVcclxuICAgICAgICAgICAgICAgIGN1YmVNYXAuYnVmZmVyRmFjZURhdGEoIGZhY2UsIGltYWdlICk7XHJcbiAgICAgICAgICAgICAgICBkb25lKCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGltYWdlLnNyYyA9IHVybDtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5zdGFudGlhdGVzIGEgVGV4dHVyZUN1YmVNYXAgb2JqZWN0LlxyXG4gICAgICogQGNsYXNzIFRleHR1cmVDdWJlTWFwXHJcbiAgICAgKiBAY2xhc3NkZXNjIEEgdGV4dHVyZSBjbGFzcyB0byByZXByZXNlbnQgYSBjdWJlIG1hcCB0ZXh0dXJlLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBUZXh0dXJlQ3ViZU1hcCggc3BlYywgY2FsbGJhY2sgKSB7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzLFxyXG4gICAgICAgICAgICBmYWNlLFxyXG4gICAgICAgICAgICBqb2JzO1xyXG4gICAgICAgIC8vIHN0b3JlIGdsIGNvbnRleHRcclxuICAgICAgICB0aGlzLmdsID0gV2ViR0xDb250ZXh0LmdldCgpO1xyXG4gICAgICAgIHRoaXMudGV4dHVyZSA9IHRoaXMuZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgICAgIHRoaXMud3JhcCA9IHNwZWMud3JhcCB8fCAnQ0xBTVBfVE9fRURHRSc7XHJcbiAgICAgICAgdGhpcy5maWx0ZXIgPSBzcGVjLmZpbHRlciB8fCAnTElORUFSJztcclxuICAgICAgICB0aGlzLmludmVydFkgPSBzcGVjLmludmVydFkgIT09IHVuZGVmaW5lZCA/IHNwZWMuaW52ZXJ0WSA6IGZhbHNlO1xyXG4gICAgICAgIC8vIGNyZWF0ZSBjdWJlIG1hcCBiYXNlZCBvbiBpbnB1dFxyXG4gICAgICAgIGlmICggc3BlYy5pbWFnZXMgKSB7XHJcbiAgICAgICAgICAgIC8vIG11bHRpcGxlIEltYWdlIG9iamVjdHNcclxuICAgICAgICAgICAgZm9yICggZmFjZSBpbiBzcGVjLmltYWdlcyApIHtcclxuICAgICAgICAgICAgICAgIGlmICggc3BlYy5pbWFnZXMuaGFzT3duUHJvcGVydHkoIGZhY2UgKSApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBidWZmZXIgZmFjZSB0ZXh0dXJlXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5idWZmZXJGYWNlRGF0YSggZmFjZSwgc3BlYy5pbWFnZXNbIGZhY2UgXSApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuc2V0UGFyYW1ldGVycyggdGhpcyApO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIHNwZWMudXJscyApIHtcclxuICAgICAgICAgICAgLy8gbXVsdGlwbGUgdXJsc1xyXG4gICAgICAgICAgICBqb2JzID0ge307XHJcbiAgICAgICAgICAgIGZvciAoIGZhY2UgaW4gc3BlYy51cmxzICkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBzcGVjLnVybHMuaGFzT3duUHJvcGVydHkoIGZhY2UgKSApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBhZGQgam9iIHRvIG1hcFxyXG4gICAgICAgICAgICAgICAgICAgIGpvYnNbIGZhY2UgXSA9IGxvYWRBbmRCdWZmZXJJbWFnZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3BlYy51cmxzWyBmYWNlIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhY2UgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBVdGlsLmFzeW5jKCBqb2JzLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQuc2V0UGFyYW1ldGVycyggdGhhdCApO1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soIHRoYXQgKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gZW1wdHkgY3ViZSBtYXBcclxuICAgICAgICAgICAgdGhpcy5mb3JtYXQgPSBzcGVjLmZvcm1hdCB8fCAnUkdCQSc7XHJcbiAgICAgICAgICAgIHRoaXMuaW50ZXJuYWxGb3JtYXQgPSB0aGlzLmZvcm1hdDsgLy8gd2ViZ2wgcmVxdWlyZXMgZm9ybWF0ID09PSBpbnRlcm5hbEZvcm1hdFxyXG4gICAgICAgICAgICB0aGlzLnR5cGUgPSBzcGVjLnR5cGUgfHwgJ1VOU0lHTkVEX0JZVEUnO1xyXG4gICAgICAgICAgICB0aGlzLm1pcE1hcCA9IHNwZWMubWlwTWFwICE9PSB1bmRlZmluZWQgPyBzcGVjLm1pcE1hcCA6IGZhbHNlO1xyXG4gICAgICAgICAgICBGQUNFUy5mb3JFYWNoKCBmdW5jdGlvbiggZmFjZSApIHtcclxuICAgICAgICAgICAgICAgIHZhciBkYXRhID0gKCBzcGVjLmRhdGEgPyBzcGVjLmRhdGFbZmFjZV0gOiBzcGVjLmRhdGEgKSB8fCBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5idWZmZXJGYWNlRGF0YSggZmFjZSwgZGF0YSwgc3BlYy53aWR0aCwgc3BlYy5oZWlnaHQgKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0UGFyYW1ldGVycyggdGhpcyApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEJpbmRzIHRoZSB0ZXh0dXJlIG9iamVjdCBhbmQgcHVzaGVzIGl0IHRvIHRoZSBmcm9udCBvZiB0aGUgc3RhY2suXHJcbiAgICAgKiBAbWVtYmVyb2YgVGV4dHVyZUN1YmVNYXBcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbG9jYXRpb24gLSBUaGUgdGV4dHVyZSB1bml0IGxvY2F0aW9uIGluZGV4LlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtUZXh0dXJlQ3ViZU1hcH0gVGhlIHRleHR1cmUgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgICBUZXh0dXJlQ3ViZU1hcC5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKCBsb2NhdGlvbiApIHtcclxuICAgICAgICBfc3RhY2tbIGxvY2F0aW9uIF0gPSBfc3RhY2tbIGxvY2F0aW9uIF0gfHwgbmV3IFN0YWNrKCk7XHJcbiAgICAgICAgX3N0YWNrWyBsb2NhdGlvbiBdLnB1c2goIHRoaXMgKTtcclxuICAgICAgICBiaW5kKCB0aGlzLCBsb2NhdGlvbiApO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVuYmluZHMgdGhlIHRleHR1cmUgb2JqZWN0IGFuZCBiaW5kcyB0aGUgdGV4dHVyZSBiZW5lYXRoIGl0IG9uXHJcbiAgICAgKiB0aGlzIHN0YWNrLiBJZiB0aGVyZSBpcyBubyB1bmRlcmx5aW5nIHRleHR1cmUsIHVuYmluZHMgdGhlIHVuaXQuXHJcbiAgICAgKiBAbWVtYmVyb2YgVGV4dHVyZUN1YmVNYXBcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbG9jYXRpb24gLSBUaGUgdGV4dHVyZSB1bml0IGxvY2F0aW9uIGluZGV4LlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtUZXh0dXJlQ3ViZU1hcH0gVGhlIHRleHR1cmUgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgICBUZXh0dXJlQ3ViZU1hcC5wcm90b3R5cGUucG9wID0gZnVuY3Rpb24oIGxvY2F0aW9uICkge1xyXG4gICAgICAgIHZhciB0b3A7XHJcbiAgICAgICAgaWYgKCAhX3N0YWNrWyBsb2NhdGlvbiBdICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTm8gdGV4dHVyZSB3YXMgYm91bmQgdG8gdGV4dHVyZSB1bml0IGAnICsgbG9jYXRpb24gK1xyXG4gICAgICAgICAgICAgICAgJ2AsIGNvbW1hbmQgaWdub3JlZC4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgX3N0YWNrWyBsb2NhdGlvbiBdLnBvcCgpO1xyXG4gICAgICAgIHRvcCA9IF9zdGFja1sgbG9jYXRpb24gXS50b3AoKTtcclxuICAgICAgICBpZiAoIHRvcCApIHtcclxuICAgICAgICAgICAgYmluZCggdG9wLCBsb2NhdGlvbiApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHVuYmluZCggdGhpcyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCdWZmZXIgZGF0YSBpbnRvIHRoZSByZXNwZWN0aXZlIGN1YmUgbWFwIGZhY2UuXHJcbiAgICAgKiBAbWVtYmVyb2YgVGV4dHVyZUN1YmVNYXBcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZmFjZSAtIFRoZSBmYWNlIGlkZW50aWZpY2F0aW9uIHN0cmluZy5cclxuICAgICAqIEBwYXJhbSB7SW1hZ2VEYXRhfEFycmF5QnVmZmVyVmlld3xIVE1MSW1hZ2VFbGVtZW50fSBkYXRhIC0gVGhlIGRhdGEuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGggLSBUaGUgd2lkdGggb2YgdGhlIGRhdGEuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0IC0gVGhlIGhlaWdodCBvZiB0aGUgZGF0YS5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7VGV4dHVyZUN1YmVNYXB9IFRoZSB0ZXh0dXJlIG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBUZXh0dXJlQ3ViZU1hcC5wcm90b3R5cGUuYnVmZmVyRmFjZURhdGEgPSBmdW5jdGlvbiggZmFjZSwgZGF0YSwgd2lkdGgsIGhlaWdodCApIHtcclxuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsLFxyXG4gICAgICAgICAgICBmYWNlVGFyZ2V0ID0gZ2xbIEZBQ0VfVEFSR0VUU1sgZmFjZSBdIF07XHJcbiAgICAgICAgaWYgKCAhZmFjZVRhcmdldCApIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0ludmFsaWQgZmFjZSBlbnVtZXJhdGlvbiBgJyArIGZhY2UgKyAnYCBwcm92aWRlZCwgJyArXHJcbiAgICAgICAgICAgICAgICAnY29tbWFuZCBpZ25vcmVkLicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBidWZmZXIgZmFjZSB0ZXh0dXJlXHJcbiAgICAgICAgdGhpcy5wdXNoKCk7XHJcbiAgICAgICAgaWYgKCBkYXRhIGluc3RhbmNlb2YgSFRNTEltYWdlRWxlbWVudCApIHtcclxuICAgICAgICAgICAgdGhpcy5pbWFnZXMgPSB0aGlzLmltYWdlcyB8fCB7fTtcclxuICAgICAgICAgICAgdGhpcy5pbWFnZXNbIGZhY2UgXSA9IGVuc3VyZVBvd2VyT2ZUd28oIGRhdGEgKTtcclxuICAgICAgICAgICAgdGhpcy5maWx0ZXIgPSAnTElORUFSJzsgLy8gbXVzdCBiZSBsaW5lYXIgZm9yIG1pcG1hcHBpbmdcclxuICAgICAgICAgICAgdGhpcy5taXBNYXAgPSB0cnVlO1xyXG4gICAgICAgICAgICBnbC5waXhlbFN0b3JlaSggZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgdGhpcy5pbnZlcnRZICk7XHJcbiAgICAgICAgICAgIGdsLnRleEltYWdlMkQoXHJcbiAgICAgICAgICAgICAgICBmYWNlVGFyZ2V0LFxyXG4gICAgICAgICAgICAgICAgMCwgLy8gbGV2ZWxcclxuICAgICAgICAgICAgICAgIGdsLlJHQkEsXHJcbiAgICAgICAgICAgICAgICBnbC5SR0JBLFxyXG4gICAgICAgICAgICAgICAgZ2wuVU5TSUdORURfQllURSxcclxuICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2VzWyBmYWNlIF0gKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEgPSB0aGlzLmRhdGEgfHwge307XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YVsgZmFjZSBdID0gZGF0YTtcclxuICAgICAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoIHx8IHRoaXMud2lkdGg7XHJcbiAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0IHx8IHRoaXMuaGVpZ2h0O1xyXG4gICAgICAgICAgICBnbC50ZXhJbWFnZTJEKFxyXG4gICAgICAgICAgICAgICAgZmFjZVRhcmdldCxcclxuICAgICAgICAgICAgICAgIDAsIC8vIGxldmVsXHJcbiAgICAgICAgICAgICAgICBnbFsgdGhpcy5pbnRlcm5hbEZvcm1hdCBdLFxyXG4gICAgICAgICAgICAgICAgdGhpcy53aWR0aCxcclxuICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgMCwgLy8gYm9yZGVyLCBtdXN0IGJlIDBcclxuICAgICAgICAgICAgICAgIGdsWyB0aGlzLmZvcm1hdCBdLFxyXG4gICAgICAgICAgICAgICAgZ2xbIHRoaXMudHlwZSBdLFxyXG4gICAgICAgICAgICAgICAgZGF0YSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBvbmx5IGdlbmVyYXRlIG1pcG1hcHMgaWYgYWxsIGZhY2VzIGFyZSBidWZmZXJlZFxyXG4gICAgICAgIHRoaXMuYnVmZmVyZWRGYWNlcyA9IHRoaXMuYnVmZmVyZWRGYWNlcyB8fCB7fTtcclxuICAgICAgICB0aGlzLmJ1ZmZlcmVkRmFjZXNbIGZhY2UgXSA9IHRydWU7XHJcbiAgICAgICAgLy8gb25jZSBhbGwgZmFjZXMgYXJlIGJ1ZmZlcmVkXHJcbiAgICAgICAgaWYgKCB0aGlzLm1pcE1hcCAmJlxyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlcmVkRmFjZXNbJy14J10gJiYgdGhpcy5idWZmZXJlZEZhY2VzWycreCddICYmXHJcbiAgICAgICAgICAgIHRoaXMuYnVmZmVyZWRGYWNlc1snLXknXSAmJiB0aGlzLmJ1ZmZlcmVkRmFjZXNbJyt5J10gJiZcclxuICAgICAgICAgICAgdGhpcy5idWZmZXJlZEZhY2VzWycteiddICYmIHRoaXMuYnVmZmVyZWRGYWNlc1snK3onXSApIHtcclxuICAgICAgICAgICAgLy8gZ2VuZXJhdGUgbWlwbWFwcyBvbmNlIGFsbCBmYWNlcyBhcmUgYnVmZmVyZWRcclxuICAgICAgICAgICAgZ2wuZ2VuZXJhdGVNaXBtYXAoIGdsLlRFWFRVUkVfQ1VCRV9NQVAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wb3AoKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgdGhlIHRleHR1cmUgcGFyYW1ldGVycy5cclxuICAgICAqIEBtZW1iZXJvZiBUZXh0dXJlQ3ViZU1hcFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIC0gVGhlIHBhcmFtZXRlcnMgYnkgbmFtZS5cclxuICAgICAqIDxwcmU+XHJcbiAgICAgKiAgICAgd3JhcCB8IHdyYXAucyB8IHdyYXAudCAtIFRoZSB3cmFwcGluZyB0eXBlLlxyXG4gICAgICogICAgIGZpbHRlciB8IGZpbHRlci5taW4gfCBmaWx0ZXIubWFnIC0gVGhlIGZpbHRlciB0eXBlLlxyXG4gICAgICogPC9wcmU+XHJcbiAgICAgKiBAcmV0dXJucyB7VGV4dHVyZUN1YmVNYXB9IFRoZSB0ZXh0dXJlIG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBUZXh0dXJlQ3ViZU1hcC5wcm90b3R5cGUuc2V0UGFyYW1ldGVycyA9IGZ1bmN0aW9uKCBwYXJhbWV0ZXJzICkge1xyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgdGhpcy5wdXNoKCk7XHJcbiAgICAgICAgaWYgKCBwYXJhbWV0ZXJzLndyYXAgKSB7XHJcbiAgICAgICAgICAgIC8vIHNldCB3cmFwIHBhcmFtZXRlcnNcclxuICAgICAgICAgICAgdGhpcy53cmFwID0gcGFyYW1ldGVycy53cmFwO1xyXG4gICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKFxyXG4gICAgICAgICAgICAgICAgZ2wuVEVYVFVSRV9DVUJFX01BUCxcclxuICAgICAgICAgICAgICAgIGdsLlRFWFRVUkVfV1JBUF9TLFxyXG4gICAgICAgICAgICAgICAgZ2xbIHRoaXMud3JhcC5zIHx8IHRoaXMud3JhcCBdICk7XHJcbiAgICAgICAgICAgIGdsLnRleFBhcmFtZXRlcmkoXHJcbiAgICAgICAgICAgICAgICBnbC5URVhUVVJFX0NVQkVfTUFQLFxyXG4gICAgICAgICAgICAgICAgZ2wuVEVYVFVSRV9XUkFQX1QsXHJcbiAgICAgICAgICAgICAgICBnbFsgdGhpcy53cmFwLnQgfHwgdGhpcy53cmFwIF0gKTtcclxuICAgICAgICAgICAgLyogbm90IHN1cHBvcnRlZCBpbiB3ZWJnbCAxLjBcclxuICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShcclxuICAgICAgICAgICAgICAgIGdsLlRFWFRVUkVfQ1VCRV9NQVAsXHJcbiAgICAgICAgICAgICAgICBnbC5URVhUVVJFX1dSQVBfUixcclxuICAgICAgICAgICAgICAgIGdsWyB0aGlzLndyYXAuciB8fCB0aGlzLndyYXAgXSApO1xyXG4gICAgICAgICAgICAqL1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIHBhcmFtZXRlcnMuZmlsdGVyICkge1xyXG4gICAgICAgICAgICAvLyBzZXQgZmlsdGVyIHBhcmFtZXRlcnNcclxuICAgICAgICAgICAgdGhpcy5maWx0ZXIgPSBwYXJhbWV0ZXJzLmZpbHRlcjtcclxuICAgICAgICAgICAgdmFyIG1pbkZpbHRlciA9IHRoaXMuZmlsdGVyLm1pbiB8fCB0aGlzLmZpbHRlcjtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLm1pbk1hcCApIHtcclxuICAgICAgICAgICAgICAgIC8vIGFwcGVuZCBtaW4gbXBhIHN1ZmZpeCB0byBtaW4gZmlsdGVyXHJcbiAgICAgICAgICAgICAgICBtaW5GaWx0ZXIgKz0gJ19NSVBNQVBfTElORUFSJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKFxyXG4gICAgICAgICAgICAgICAgZ2wuVEVYVFVSRV9DVUJFX01BUCxcclxuICAgICAgICAgICAgICAgIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUixcclxuICAgICAgICAgICAgICAgIGdsWyB0aGlzLmZpbHRlci5tYWcgfHwgdGhpcy5maWx0ZXIgXSApO1xyXG4gICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKFxyXG4gICAgICAgICAgICAgICAgZ2wuVEVYVFVSRV9DVUJFX01BUCxcclxuICAgICAgICAgICAgICAgIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUixcclxuICAgICAgICAgICAgICAgIGdsWyBtaW5GaWx0ZXJdICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucG9wKCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gVGV4dHVyZUN1YmVNYXA7XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICB2YXIgV2ViR0xDb250ZXh0ID0gcmVxdWlyZSgnLi9XZWJHTENvbnRleHQnKSxcclxuICAgICAgICBWZXJ0ZXhQYWNrYWdlID0gcmVxdWlyZSgnLi9WZXJ0ZXhQYWNrYWdlJyksXHJcbiAgICAgICAgVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvVXRpbCcpLFxyXG4gICAgICAgIF9ib3VuZEJ1ZmZlciA9IG51bGwsXHJcbiAgICAgICAgX2VuYWJsZWRBdHRyaWJ1dGVzID0gbnVsbDtcclxuXHJcbiAgICBmdW5jdGlvbiBnZXRTdHJpZGUoIGF0dHJpYnV0ZVBvaW50ZXJzICkge1xyXG4gICAgICAgIHZhciBCWVRFU19QRVJfQ09NUE9ORU5UID0gNDtcclxuICAgICAgICB2YXIgbWF4T2Zmc2V0ID0gMDtcclxuICAgICAgICB2YXIgc3RyaWRlID0gMDtcclxuICAgICAgICBPYmplY3Qua2V5cyggYXR0cmlidXRlUG9pbnRlcnMgKS5mb3JFYWNoKCBmdW5jdGlvbigga2V5ICkge1xyXG4gICAgICAgICAgICAvLyB0cmFjayB0aGUgbGFyZ2VzdCBvZmZzZXQgdG8gZGV0ZXJtaW5lIHRoZSBzdHJpZGUgb2YgdGhlIGJ1ZmZlclxyXG4gICAgICAgICAgICB2YXIgcG9pbnRlciA9IGF0dHJpYnV0ZVBvaW50ZXJzWyBrZXkgXTtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IHBvaW50ZXIub2Zmc2V0O1xyXG4gICAgICAgICAgICBpZiAoIG9mZnNldCA+IG1heE9mZnNldCApIHtcclxuICAgICAgICAgICAgICAgIG1heE9mZnNldCA9IG9mZnNldDtcclxuICAgICAgICAgICAgICAgIHN0cmlkZSA9IG9mZnNldCArICggcG9pbnRlci5zaXplICogQllURVNfUEVSX0NPTVBPTkVOVCApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHN0cmlkZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRBdHRyaWJ1dGVQb2ludGVycyggYXR0cmlidXRlUG9pbnRlcnMgKSB7XHJcbiAgICAgICAgLy8gZW5zdXJlIHRoZXJlIGFyZSBwb2ludGVycyBwcm92aWRlZFxyXG4gICAgICAgIGlmICggIWF0dHJpYnV0ZVBvaW50ZXJzIHx8IE9iamVjdC5rZXlzKCBhdHRyaWJ1dGVQb2ludGVycyApLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuaW5nKCAnVmVydGV4QnVmZmVyIHJlcXVpcmVzIGF0dHJpYnV0ZSBwb2ludGVycyB0byBiZSAnICtcclxuICAgICAgICAgICAgICAgICdzcGVjaWZpZWQgdXBvbiBpbnN0YW50aWF0aW9uLCB0aGlzIGJ1ZmZlciB3aWxsIG5vdCBkcmF3IGNvcnJlY3RseS4nICk7XHJcbiAgICAgICAgICAgIHJldHVybiB7fTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gcGFyc2UgcG9pbnRlcnMgdG8gZW5zdXJlIHRoZXkgYXJlIHZhbGlkXHJcbiAgICAgICAgdmFyIHBvaW50ZXJzID0ge307XHJcbiAgICAgICAgT2JqZWN0LmtleXMoIGF0dHJpYnV0ZVBvaW50ZXJzICkuZm9yRWFjaCggZnVuY3Rpb24oIGtleSApIHtcclxuICAgICAgICAgICAgdmFyIGluZGV4ID0gcGFyc2VJbnQoIGtleSwgMTAgKTtcclxuICAgICAgICAgICAgLy8gY2hlY2sgdGhhdCBrZXkgaXMgYW4gdmFsaWQgaW50ZWdlclxyXG4gICAgICAgICAgICBpZiAoIGlzTmFOKCBpbmRleCApICkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdBdHRyaWJ1dGUgaW5kZXggYCcgKyBrZXkgKyAnYCBkb2VzIG5vdCByZXByZXNlbnQgYW4gaW50ZWdlciwgZGlzY2FyZGluZyBhdHRyaWJ1dGUgcG9pbnRlci4nKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgcG9pbnRlciA9IGF0dHJpYnV0ZVBvaW50ZXJzW2tleV07XHJcbiAgICAgICAgICAgIHZhciBzaXplID0gcG9pbnRlci5zaXplO1xyXG4gICAgICAgICAgICB2YXIgdHlwZSA9IHBvaW50ZXIudHlwZTtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IHBvaW50ZXIub2Zmc2V0O1xyXG4gICAgICAgICAgICAvLyBjaGVjayBzaXplXHJcbiAgICAgICAgICAgIGlmICggIXNpemUgfHwgc2l6ZSA8IDEgfHwgc2l6ZSA+IDQgKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0F0dHJpYnV0ZSBwb2ludGVyIGBzaXplYCBwYXJhbWV0ZXIgaXMgaW52YWxpZCwgJyArXHJcbiAgICAgICAgICAgICAgICAgICAgJ2RlZmF1bHRpbmcgdG8gNC4nKTtcclxuICAgICAgICAgICAgICAgIHNpemUgPSA0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGNoZWNrIHR5cGVcclxuICAgICAgICAgICAgaWYgKCAhdHlwZSB8fCB0eXBlICE9PSAnRkxPQVQnICkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdBdHRyaWJ1dGUgcG9pbnRlciBgdHlwZWAgcGFyYW1ldGVyIGlzIGludmFsaWQsICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICdkZWZhdWx0aW5nIHRvIGBGTE9BVGAuJyk7XHJcbiAgICAgICAgICAgICAgICB0eXBlID0gJ0ZMT0FUJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBwb2ludGVyc1sgaW5kZXggXSA9IHtcclxuICAgICAgICAgICAgICAgIHNpemU6IHNpemUsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiB0eXBlLFxyXG4gICAgICAgICAgICAgICAgb2Zmc2V0OiAoIG9mZnNldCAhPT0gdW5kZWZpbmVkICkgPyBvZmZzZXQgOiAwXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHBvaW50ZXJzO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldE51bUNvbXBvbmVudHMocG9pbnRlcnMpIHtcclxuICAgICAgICB2YXIgc2l6ZSA9IDA7XHJcbiAgICAgICAgdmFyIGluZGV4O1xyXG4gICAgICAgIGZvciAoIGluZGV4IGluIHBvaW50ZXJzICkge1xyXG4gICAgICAgICAgICBpZiAoIHBvaW50ZXJzLmhhc093blByb3BlcnR5KCBpbmRleCApICkge1xyXG4gICAgICAgICAgICAgICAgc2l6ZSArPSBwb2ludGVyc1sgaW5kZXggXS5zaXplO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzaXplO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIFZlcnRleEJ1ZmZlciggYXJnLCBhdHRyaWJ1dGVQb2ludGVycywgb3B0aW9ucyApIHtcclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgICAgICB0aGlzLmJ1ZmZlciA9IDA7XHJcbiAgICAgICAgdGhpcy5nbCA9IFdlYkdMQ29udGV4dC5nZXQoKTtcclxuICAgICAgICAvLyBmaXJzdCwgc2V0IHRoZSBhdHRyaWJ1dGUgcG9pbnRlcnNcclxuICAgICAgICBpZiAoIGFyZyBpbnN0YW5jZW9mIFZlcnRleFBhY2thZ2UgKSB7XHJcbiAgICAgICAgICAgIC8vIFZlcnRleFBhY2thZ2UgYXJndW1lbnQsIHVzZSBpdHMgYXR0cmlidXRlIHBvaW50ZXJzXHJcbiAgICAgICAgICAgIHRoaXMucG9pbnRlcnMgPSBhcmcuYXR0cmlidXRlUG9pbnRlcnMoKTtcclxuICAgICAgICAgICAgLy8gc2hpZnQgb3B0aW9ucyBhcmcgc2luY2UgdGhlcmUgd2lsbCBiZSBubyBhdHRyaWIgcG9pbnRlcnMgYXJnXHJcbiAgICAgICAgICAgIG9wdGlvbnMgPSBhdHRyaWJ1dGVQb2ludGVycyB8fCB7fTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJzID0gZ2V0QXR0cmlidXRlUG9pbnRlcnMoIGF0dHJpYnV0ZVBvaW50ZXJzICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHRoZW4gYnVmZmVyIHRoZSBkYXRhXHJcbiAgICAgICAgaWYgKCBhcmcgKSB7XHJcbiAgICAgICAgICAgIGlmICggYXJnIGluc3RhbmNlb2YgVmVydGV4UGFja2FnZSApIHtcclxuICAgICAgICAgICAgICAgIC8vIFZlcnRleFBhY2thZ2UgYXJndW1lbnRcclxuICAgICAgICAgICAgICAgIHRoaXMuYnVmZmVyRGF0YSggYXJnLmJ1ZmZlcigpICk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIGFyZyBpbnN0YW5jZW9mIFdlYkdMQnVmZmVyICkge1xyXG4gICAgICAgICAgICAgICAgLy8gV2ViR0xCdWZmZXIgYXJndW1lbnRcclxuICAgICAgICAgICAgICAgIHRoaXMuYnVmZmVyID0gYXJnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudCA9ICggb3B0aW9ucy5jb3VudCAhPT0gdW5kZWZpbmVkICkgPyBvcHRpb25zLmNvdW50IDogMDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIEFycmF5IG9yIEFycmF5QnVmZmVyIG9yIG51bWJlciBhcmd1bWVudFxyXG4gICAgICAgICAgICAgICAgdGhpcy5idWZmZXJEYXRhKCBhcmcgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBzZXQgc3RyaWRlXHJcbiAgICAgICAgdGhpcy5zdHJpZGUgPSBnZXRTdHJpZGUoIHRoaXMucG9pbnRlcnMgKTtcclxuICAgICAgICAvLyBzZXQgZHJhdyBvZmZzZXQgYW5kIG1vZGVcclxuICAgICAgICB0aGlzLm9mZnNldCA9ICggb3B0aW9ucy5vZmZzZXQgIT09IHVuZGVmaW5lZCApID8gb3B0aW9ucy5vZmZzZXQgOiAwO1xyXG4gICAgICAgIHRoaXMubW9kZSA9ICggb3B0aW9ucy5tb2RlICE9PSB1bmRlZmluZWQgKSA/IG9wdGlvbnMubW9kZSA6ICdUUklBTkdMRVMnO1xyXG4gICAgfVxyXG5cclxuICAgIFZlcnRleEJ1ZmZlci5wcm90b3R5cGUuYnVmZmVyRGF0YSA9IGZ1bmN0aW9uKCBhcmcgKSB7XHJcbiAgICAgICAgdmFyIGdsID0gdGhpcy5nbDtcclxuICAgICAgICBpZiAoIGFyZyBpbnN0YW5jZW9mIEFycmF5ICkge1xyXG4gICAgICAgICAgICAvLyBjYXN0IGFycmF5cyBpbnRvIGJ1ZmZlcnZpZXdcclxuICAgICAgICAgICAgYXJnID0gbmV3IEZsb2F0MzJBcnJheSggYXJnICk7XHJcbiAgICAgICAgfSBlbHNlIGlmICggIVV0aWwuaXNUeXBlZEFycmF5KCBhcmcgKSAmJiB0eXBlb2YgYXJnICE9PSAnbnVtYmVyJyApIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvciggJ1ZlcnRleEJ1ZmZlciByZXF1aXJlcyBhbiBBcnJheSBvciBBcnJheUJ1ZmZlciwgJyArXHJcbiAgICAgICAgICAgICAgICAnb3IgYSBzaXplIGFyZ3VtZW50LCBjb21tYW5kIGlnbm9yZWQuJyApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggIXRoaXMuYnVmZmVyICkge1xyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBnZXQgdGhlIHRvdGFsIG51bWJlciBvZiBhdHRyaWJ1dGUgY29tcG9uZW50cyBmcm9tIHBvaW50ZXJzXHJcbiAgICAgICAgdmFyIG51bUNvbXBvbmVudHMgPSBnZXROdW1Db21wb25lbnRzKHRoaXMucG9pbnRlcnMpO1xyXG4gICAgICAgIC8vIHNldCBjb3VudCBiYXNlZCBvbiBzaXplIG9mIGJ1ZmZlciBhbmQgbnVtYmVyIG9mIGNvbXBvbmVudHNcclxuICAgICAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgdGhpcy5jb3VudCA9IGFyZyAvIG51bUNvbXBvbmVudHM7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5jb3VudCA9IGFyZy5sZW5ndGggLyBudW1Db21wb25lbnRzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBnbC5iaW5kQnVmZmVyKCBnbC5BUlJBWV9CVUZGRVIsIHRoaXMuYnVmZmVyICk7XHJcbiAgICAgICAgZ2wuYnVmZmVyRGF0YSggZ2wuQVJSQVlfQlVGRkVSLCBhcmcsIGdsLlNUQVRJQ19EUkFXICk7XHJcbiAgICB9O1xyXG5cclxuICAgIFZlcnRleEJ1ZmZlci5wcm90b3R5cGUuYnVmZmVyU3ViRGF0YSA9IGZ1bmN0aW9uKCBhcnJheSwgb2Zmc2V0ICkge1xyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgaWYgKCAhdGhpcy5idWZmZXIgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdWZXJ0ZXhCdWZmZXIgaGFzIG5vdCBiZWVuIGluaXRpYWxseSBidWZmZXJlZCwgJyArXHJcbiAgICAgICAgICAgICAgICAnY29tbWFuZCBpZ25vcmVkLicgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIGFycmF5IGluc3RhbmNlb2YgQXJyYXkgKSB7XHJcbiAgICAgICAgICAgIGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSggYXJyYXkgKTtcclxuICAgICAgICB9IGVsc2UgaWYgKCAhVXRpbC5pc1R5cGVkQXJyYXkoIGFycmF5ICkgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdWZXJ0ZXhCdWZmZXIgcmVxdWlyZXMgYW4gQXJyYXkgb3IgQXJyYXlCdWZmZXIgJyArXHJcbiAgICAgICAgICAgICAgICAnYXJndW1lbnQsIGNvbW1hbmQgaWdub3JlZC4nICk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgb2Zmc2V0ID0gKCBvZmZzZXQgIT09IHVuZGVmaW5lZCApID8gb2Zmc2V0IDogMDtcclxuICAgICAgICBnbC5iaW5kQnVmZmVyKCBnbC5BUlJBWV9CVUZGRVIsIHRoaXMuYnVmZmVyICk7XHJcbiAgICAgICAgZ2wuYnVmZmVyU3ViRGF0YSggZ2wuQVJSQVlfQlVGRkVSLCBvZmZzZXQsIGFycmF5ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIFZlcnRleEJ1ZmZlci5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIGlmIHRoaXMgYnVmZmVyIGlzIGFscmVhZHkgYm91bmQsIGV4aXQgZWFybHlcclxuICAgICAgICBpZiAoIF9ib3VuZEJ1ZmZlciA9PT0gdGhpcyApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsLFxyXG4gICAgICAgICAgICBwb2ludGVycyA9IHRoaXMucG9pbnRlcnMsXHJcbiAgICAgICAgICAgIHByZXZpb3VzbHlFbmFibGVkQXR0cmlidXRlcyA9IF9lbmFibGVkQXR0cmlidXRlcyB8fCB7fSxcclxuICAgICAgICAgICAgcG9pbnRlcixcclxuICAgICAgICAgICAgaW5kZXg7XHJcbiAgICAgICAgLy8gY2FjaGUgdGhpcyB2ZXJ0ZXggYnVmZmVyXHJcbiAgICAgICAgX2JvdW5kQnVmZmVyID0gdGhpcztcclxuICAgICAgICBfZW5hYmxlZEF0dHJpYnV0ZXMgPSB7fTtcclxuICAgICAgICAvLyBiaW5kIGJ1ZmZlclxyXG4gICAgICAgIGdsLmJpbmRCdWZmZXIoIGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5idWZmZXIgKTtcclxuICAgICAgICBmb3IgKCBpbmRleCBpbiBwb2ludGVycyApIHtcclxuICAgICAgICAgICAgaWYgKCBwb2ludGVycy5oYXNPd25Qcm9wZXJ0eSggaW5kZXggKSApIHtcclxuICAgICAgICAgICAgICAgIHBvaW50ZXIgPSB0aGlzLnBvaW50ZXJzWyBpbmRleCBdO1xyXG4gICAgICAgICAgICAgICAgLy8gc2V0IGF0dHJpYnV0ZSBwb2ludGVyXHJcbiAgICAgICAgICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKCBpbmRleCxcclxuICAgICAgICAgICAgICAgICAgICBwb2ludGVyLnNpemUsXHJcbiAgICAgICAgICAgICAgICAgICAgZ2xbIHBvaW50ZXIudHlwZSBdLFxyXG4gICAgICAgICAgICAgICAgICAgIGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RyaWRlLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvaW50ZXIub2Zmc2V0ICk7XHJcbiAgICAgICAgICAgICAgICAvLyBlbmFibGVkIGF0dHJpYnV0ZSBhcnJheVxyXG4gICAgICAgICAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoIGluZGV4ICk7XHJcbiAgICAgICAgICAgICAgICAvLyBjYWNoZSBhdHRyaWJ1dGVcclxuICAgICAgICAgICAgICAgIF9lbmFibGVkQXR0cmlidXRlc1sgaW5kZXggXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAvLyByZW1vdmUgZnJvbSBwcmV2aW91cyBsaXN0XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgcHJldmlvdXNseUVuYWJsZWRBdHRyaWJ1dGVzWyBpbmRleCBdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGVuc3VyZSBsZWFrZWQgYXR0cmlidXRlIGFycmF5cyBhcmUgZGlzYWJsZWRcclxuICAgICAgICBmb3IgKCBpbmRleCBpbiBwcmV2aW91c2x5RW5hYmxlZEF0dHJpYnV0ZXMgKSB7XHJcbiAgICAgICAgICAgIGlmICggcHJldmlvdXNseUVuYWJsZWRBdHRyaWJ1dGVzLmhhc093blByb3BlcnR5KCBpbmRleCApICkge1xyXG4gICAgICAgICAgICAgICAgZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KCBpbmRleCApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBWZXJ0ZXhCdWZmZXIucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiggb3B0aW9ucyApIHtcclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgICAgICBpZiAoIF9ib3VuZEJ1ZmZlciA9PT0gbnVsbCApIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCAnTm8gVmVydGV4QnVmZmVyIGlzIGJvdW5kLCBjb21tYW5kIGlnbm9yZWQuJyApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgdmFyIG1vZGUgPSBnbFsgb3B0aW9ucy5tb2RlIHx8IHRoaXMubW9kZSB8fCAnVFJJQU5HTEVTJyBdO1xyXG4gICAgICAgIHZhciBvZmZzZXQgPSAoIG9wdGlvbnMub2Zmc2V0ICE9PSB1bmRlZmluZWQgKSA/IG9wdGlvbnMub2Zmc2V0IDogdGhpcy5vZmZzZXQ7XHJcbiAgICAgICAgdmFyIGNvdW50ID0gKCBvcHRpb25zLmNvdW50ICE9PSB1bmRlZmluZWQgKSA/IG9wdGlvbnMuY291bnQgOiB0aGlzLmNvdW50O1xyXG4gICAgICAgIGdsLmRyYXdBcnJheXMoXHJcbiAgICAgICAgICAgIG1vZGUsIC8vIHByaW1pdGl2ZSB0eXBlXHJcbiAgICAgICAgICAgIG9mZnNldCwgLy8gb2Zmc2V0XHJcbiAgICAgICAgICAgIGNvdW50ICk7IC8vIGNvdW50XHJcbiAgICB9O1xyXG5cclxuICAgIFZlcnRleEJ1ZmZlci5wcm90b3R5cGUudW5iaW5kID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgLy8gaWYgbm8gYnVmZmVyIGlzIGJvdW5kLCBleGl0IGVhcmx5XHJcbiAgICAgICAgaWYgKCBfYm91bmRCdWZmZXIgPT09IG51bGwgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGdsID0gdGhpcy5nbCxcclxuICAgICAgICAgICAgcG9pbnRlcnMgPSB0aGlzLnBvaW50ZXJzLFxyXG4gICAgICAgICAgICBpbmRleDtcclxuICAgICAgICBmb3IgKCBpbmRleCBpbiBwb2ludGVycyApIHtcclxuICAgICAgICAgICAgaWYgKCBwb2ludGVycy5oYXNPd25Qcm9wZXJ0eSggaW5kZXggKSApIHtcclxuICAgICAgICAgICAgICAgIGdsLmRpc2FibGVWZXJ0ZXhBdHRyaWJBcnJheSggaW5kZXggKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBnbC5iaW5kQnVmZmVyKCBnbC5BUlJBWV9CVUZGRVIsIG51bGwgKTtcclxuICAgICAgICBfYm91bmRCdWZmZXIgPSBudWxsO1xyXG4gICAgICAgIF9lbmFibGVkQXR0cmlidXRlcyA9IHt9O1xyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFZlcnRleEJ1ZmZlcjtcclxuXHJcbn0oKSk7XHJcbiIsIihmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIHZhciBDT01QT05FTlRfVFlQRSA9ICdGTE9BVCc7XHJcbiAgICB2YXIgQllURVNfUEVSX0NPTVBPTkVOVCA9IDQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmVzIGludmFsaWQgYXR0cmlidXRlIGFyZ3VtZW50cy4gQSB2YWxpZCBhcmd1bWVudFxyXG4gICAgICogbXVzdCBiZSBhbiBBcnJheSBvZiBsZW5ndGggPiAwIGtleSBieSBhIHN0cmluZyByZXByZXNlbnRpbmcgYW4gaW50LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyaWJ1dGVzIC0gVGhlIG1hcCBvZiB2ZXJ0ZXggYXR0cmlidXRlcy5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFRoZSB2YWxpZCBhcnJheSBvZiBhcmd1bWVudHMuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHBhcnNlQXR0cmlidXRlTWFwKCBhdHRyaWJ1dGVzICkge1xyXG4gICAgICAgIHZhciBnb29kQXR0cmlidXRlcyA9IFtdO1xyXG4gICAgICAgIE9iamVjdC5rZXlzKCBhdHRyaWJ1dGVzICkuZm9yRWFjaCggZnVuY3Rpb24oIGtleSApIHtcclxuICAgICAgICAgICAgdmFyIGluZGV4ID0gcGFyc2VJbnQoIGtleSwgMTAgKTtcclxuICAgICAgICAgICAgLy8gY2hlY2sgdGhhdCBrZXkgaXMgYW4gdmFsaWQgaW50ZWdlclxyXG4gICAgICAgICAgICBpZiAoIGlzTmFOKCBpbmRleCApICkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdBdHRyaWJ1dGUgaW5kZXggYCcgKyBrZXkgKyAnYCBkb2VzIG5vdCAnICtcclxuICAgICAgICAgICAgICAgICAgICAncmVwcmVzZW50IGFuIGludGVnZXIsIGRpc2NhcmRpbmcgYXR0cmlidXRlIHBvaW50ZXIuJyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHZlcnRpY2VzID0gYXR0cmlidXRlc1trZXldO1xyXG4gICAgICAgICAgICAvLyBlbnN1cmUgYXR0cmlidXRlIGlzIHZhbGlkXHJcbiAgICAgICAgICAgIGlmICggdmVydGljZXMgJiZcclxuICAgICAgICAgICAgICAgIHZlcnRpY2VzIGluc3RhbmNlb2YgQXJyYXkgJiZcclxuICAgICAgICAgICAgICAgIHZlcnRpY2VzLmxlbmd0aCA+IDAgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBhZGQgYXR0cmlidXRlIGRhdGEgYW5kIGluZGV4XHJcbiAgICAgICAgICAgICAgICBnb29kQXR0cmlidXRlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBpbmRleDogaW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogdmVydGljZXNcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCAnRXJyb3IgcGFyc2luZyBhdHRyaWJ1dGUgb2YgaW5kZXggYCcgKyBrZXkgK1xyXG4gICAgICAgICAgICAgICAgICAgICdgLCBhdHRyaWJ1dGUgZGlzY2FyZGVkLicgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIHNvcnQgYXR0cmlidXRlcyBhc2NlbmRpbmcgYnkgaW5kZXhcclxuICAgICAgICBnb29kQXR0cmlidXRlcy5zb3J0KGZ1bmN0aW9uKGEsYikge1xyXG4gICAgICAgICAgICByZXR1cm4gYS5pbmRleCAtIGIuaW5kZXg7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGdvb2RBdHRyaWJ1dGVzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhIGNvbXBvbmVudCdzIGJ5dGUgc2l6ZS5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdHxBcnJheX0gY29tcG9uZW50IC0gVGhlIGNvbXBvbmVudCB0byBtZWFzdXJlLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtpbnRlZ2VyfSBUaGUgYnl0ZSBzaXplIG9mIHRoZSBjb21wb25lbnQuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGdldENvbXBvbmVudFNpemUoIGNvbXBvbmVudCApIHtcclxuICAgICAgICAvLyBjaGVjayBpZiB2ZWN0b3JcclxuICAgICAgICBpZiAoIGNvbXBvbmVudC54ICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgIC8vIDEgY29tcG9uZW50IHZlY3RvclxyXG4gICAgICAgICAgICBpZiAoIGNvbXBvbmVudC55ICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyAyIGNvbXBvbmVudCB2ZWN0b3JcclxuICAgICAgICAgICAgICAgIGlmICggY29tcG9uZW50LnogIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyAzIGNvbXBvbmVudCB2ZWN0b3JcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGNvbXBvbmVudC53ICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIDQgY29tcG9uZW50IHZlY3RvclxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gNDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDM7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gY2hlY2sgaWYgYXJyYXlcclxuICAgICAgICBpZiAoIGNvbXBvbmVudCBpbnN0YW5jZW9mIEFycmF5ICkge1xyXG4gICAgICAgICAgICByZXR1cm4gY29tcG9uZW50Lmxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIDE7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxjdWxhdGVzIHRoZSB0eXBlLCBzaXplLCBhbmQgb2Zmc2V0IGZvciBlYWNoIGF0dHJpYnV0ZSBpbiB0aGVcclxuICAgICAqIGF0dHJpYnV0ZSBhcnJheSBhbG9uZyB3aXRoIHRoZSBsZW5ndGggYW5kIHN0cmlkZSBvZiB0aGUgcGFja2FnZS5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1ZlcnRleFBhY2thZ2V9IHZlcnRleFBhY2thZ2UgLSBUaGUgVmVydGV4UGFja2FnZSBvYmplY3QuXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhdHRyaWJ1dGVzIC0gVGhlIGFycmF5IG9mIHZlcnRleCBhdHRyaWJ1dGVzLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBzZXRQb2ludGVyc0FuZFN0cmlkZSggdmVydGV4UGFja2FnZSwgYXR0cmlidXRlcyApIHtcclxuICAgICAgICB2YXIgc2hvcnRlc3RBcnJheSA9IE51bWJlci5NQVhfVkFMVUU7XHJcbiAgICAgICAgdmFyIG9mZnNldCA9IDA7XHJcbiAgICAgICAgLy8gY2xlYXIgcG9pbnRlcnNcclxuICAgICAgICB2ZXJ0ZXhQYWNrYWdlLnBvaW50ZXJzID0ge307XHJcbiAgICAgICAgLy8gZm9yIGVhY2ggYXR0cmlidXRlXHJcbiAgICAgICAgYXR0cmlidXRlcy5mb3JFYWNoKCBmdW5jdGlvbiggdmVydGljZXMgKSB7XHJcbiAgICAgICAgICAgIC8vIHNldCBzaXplIHRvIG51bWJlciBvZiBjb21wb25lbnRzIGluIHRoZSBhdHRyaWJ1dGVcclxuICAgICAgICAgICAgdmFyIHNpemUgPSBnZXRDb21wb25lbnRTaXplKCB2ZXJ0aWNlcy5kYXRhWzBdICk7XHJcbiAgICAgICAgICAgIC8vIGxlbmd0aCBvZiB0aGUgcGFja2FnZSB3aWxsIGJlIHRoZSBzaG9ydGVzdCBhdHRyaWJ1dGUgYXJyYXkgbGVuZ3RoXHJcbiAgICAgICAgICAgIHNob3J0ZXN0QXJyYXkgPSBNYXRoLm1pbiggc2hvcnRlc3RBcnJheSwgdmVydGljZXMuZGF0YS5sZW5ndGggKTtcclxuICAgICAgICAgICAgLy8gc3RvcmUgcG9pbnRlciB1bmRlciBpbmRleFxyXG4gICAgICAgICAgICB2ZXJ0ZXhQYWNrYWdlLnBvaW50ZXJzWyB2ZXJ0aWNlcy5pbmRleCBdID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZSA6IENPTVBPTkVOVF9UWVBFLFxyXG4gICAgICAgICAgICAgICAgc2l6ZSA6IHNpemUsXHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgOiBvZmZzZXQgKiBCWVRFU19QRVJfQ09NUE9ORU5UXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8vIGFjY3VtdWxhdGUgYXR0cmlidXRlIG9mZnNldFxyXG4gICAgICAgICAgICBvZmZzZXQgKz0gc2l6ZTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBzZXQgc3RyaWRlIHRvIHRvdGFsIG9mZnNldFxyXG4gICAgICAgIHZlcnRleFBhY2thZ2Uuc3RyaWRlID0gb2Zmc2V0ICogQllURVNfUEVSX0NPTVBPTkVOVDtcclxuICAgICAgICAvLyBzZXQgbGVuZ3RoIG9mIHBhY2thZ2UgdG8gdGhlIHNob3J0ZXN0IGF0dHJpYnV0ZSBhcnJheSBsZW5ndGhcclxuICAgICAgICB2ZXJ0ZXhQYWNrYWdlLmxlbmd0aCA9IHNob3J0ZXN0QXJyYXk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gVmVydGV4UGFja2FnZSggYXR0cmlidXRlcyApIHtcclxuICAgICAgICBpZiAoIGF0dHJpYnV0ZXMgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0KCBhdHRyaWJ1dGVzICk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRhID0gbmV3IEZsb2F0MzJBcnJheSgwKTtcclxuICAgICAgICAgICAgdGhpcy5wb2ludGVycyA9IHt9O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBWZXJ0ZXhQYWNrYWdlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiggYXR0cmlidXRlTWFwICkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICAvLyByZW1vdmUgYmFkIGF0dHJpYnV0ZXNcclxuICAgICAgICB2YXIgYXR0cmlidXRlcyA9IHBhcnNlQXR0cmlidXRlTWFwKCBhdHRyaWJ1dGVNYXAgKTtcclxuICAgICAgICAvLyBzZXQgYXR0cmlidXRlIHBvaW50ZXJzIGFuZCBzdHJpZGVcclxuICAgICAgICBzZXRQb2ludGVyc0FuZFN0cmlkZSggdGhpcywgYXR0cmlidXRlcyApO1xyXG4gICAgICAgIC8vIHNldCBzaXplIG9mIGRhdGEgdmVjdG9yXHJcbiAgICAgICAgdGhpcy5kYXRhID0gbmV3IEZsb2F0MzJBcnJheSggdGhpcy5sZW5ndGggKiAoIHRoaXMuc3RyaWRlIC8gQllURVNfUEVSX0NPTVBPTkVOVCApICk7XHJcbiAgICAgICAgLy8gZm9yIGVhY2ggdmVydGV4IGF0dHJpYnV0ZSBhcnJheVxyXG4gICAgICAgIGF0dHJpYnV0ZXMuZm9yRWFjaCggZnVuY3Rpb24oIHZlcnRpY2VzICkge1xyXG4gICAgICAgICAgICAvLyBnZXQgdGhlIHBvaW50ZXJcclxuICAgICAgICAgICAgdmFyIHBvaW50ZXIgPSB0aGF0LnBvaW50ZXJzWyB2ZXJ0aWNlcy5pbmRleCBdO1xyXG4gICAgICAgICAgICAvLyBnZXQgdGhlIHBvaW50ZXJzIG9mZnNldFxyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gcG9pbnRlci5vZmZzZXQgLyBCWVRFU19QRVJfQ09NUE9ORU5UO1xyXG4gICAgICAgICAgICAvLyBnZXQgdGhlIHBhY2thZ2Ugc3RyaWRlXHJcbiAgICAgICAgICAgIHZhciBzdHJpZGUgPSB0aGF0LnN0cmlkZSAvIEJZVEVTX1BFUl9DT01QT05FTlQ7XHJcbiAgICAgICAgICAgIC8vIGZvciBlYWNoIHZlcnRleFxyXG4gICAgICAgICAgICB2YXIgdmVydGV4LCBpLCBqO1xyXG4gICAgICAgICAgICBmb3IgKCBpPTA7IGk8dGhhdC5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgICAgIHZlcnRleCA9IHZlcnRpY2VzLmRhdGFbaV07XHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIGluZGV4IGluIHRoZSBidWZmZXIgdG8gdGhlIHBhcnRpY3VsYXIgdmVydGV4XHJcbiAgICAgICAgICAgICAgICBqID0gb2Zmc2V0ICsgKCBzdHJpZGUgKiBpICk7XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKCBwb2ludGVyLnNpemUgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmRhdGFbal0gPSAoIHZlcnRleC54ICE9PSB1bmRlZmluZWQgKSA/IHZlcnRleC54IDogdmVydGV4WzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmRhdGFbaisxXSA9ICggdmVydGV4LnkgIT09IHVuZGVmaW5lZCApID8gdmVydGV4LnkgOiB2ZXJ0ZXhbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kYXRhW2pdID0gKCB2ZXJ0ZXgueCAhPT0gdW5kZWZpbmVkICkgPyB2ZXJ0ZXgueCA6IHZlcnRleFswXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kYXRhW2orMV0gPSAoIHZlcnRleC55ICE9PSB1bmRlZmluZWQgKSA/IHZlcnRleC55IDogdmVydGV4WzFdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmRhdGFbaisyXSA9ICggdmVydGV4LnogIT09IHVuZGVmaW5lZCApID8gdmVydGV4LnogOiB2ZXJ0ZXhbMl07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgNDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kYXRhW2pdID0gKCB2ZXJ0ZXgueCAhPT0gdW5kZWZpbmVkICkgPyB2ZXJ0ZXgueCA6IHZlcnRleFswXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kYXRhW2orMV0gPSAoIHZlcnRleC55ICE9PSB1bmRlZmluZWQgKSA/IHZlcnRleC55IDogdmVydGV4WzFdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmRhdGFbaisyXSA9ICggdmVydGV4LnogIT09IHVuZGVmaW5lZCApID8gdmVydGV4LnogOiB2ZXJ0ZXhbMl07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZGF0YVtqKzNdID0gKCB2ZXJ0ZXgudyAhPT0gdW5kZWZpbmVkICkgPyB2ZXJ0ZXgudyA6IHZlcnRleFszXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB2ZXJ0ZXgueCAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kYXRhW2pdID0gdmVydGV4Lng7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHZlcnRleFswXSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kYXRhW2pdID0gdmVydGV4WzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kYXRhW2pdID0gdmVydGV4O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIFZlcnRleFBhY2thZ2UucHJvdG90eXBlLmJ1ZmZlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGE7XHJcbiAgICB9O1xyXG5cclxuICAgIFZlcnRleFBhY2thZ2UucHJvdG90eXBlLmF0dHJpYnV0ZVBvaW50ZXJzID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucG9pbnRlcnM7XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gVmVydGV4UGFja2FnZTtcclxuXHJcbn0oKSk7XHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIFdlYkdMQ29udGV4dCA9IHJlcXVpcmUoJy4vV2ViR0xDb250ZXh0JyksXHJcbiAgICAgICAgU3RhY2sgPSByZXF1aXJlKCcuLi91dGlsL1N0YWNrJyksXHJcbiAgICAgICAgX3N0YWNrID0gbmV3IFN0YWNrKCk7XHJcblxyXG4gICAgZnVuY3Rpb24gc2V0KCB2aWV3cG9ydCwgeCwgeSwgd2lkdGgsIGhlaWdodCApIHtcclxuICAgICAgICB2YXIgZ2wgPSB2aWV3cG9ydC5nbDtcclxuICAgICAgICB4ID0gKCB4ICE9PSB1bmRlZmluZWQgKSA/IHggOiB2aWV3cG9ydC54O1xyXG4gICAgICAgIHkgPSAoIHkgIT09IHVuZGVmaW5lZCApID8geSA6IHZpZXdwb3J0Lnk7XHJcbiAgICAgICAgd2lkdGggPSAoIHdpZHRoICE9PSB1bmRlZmluZWQgKSA/IHdpZHRoIDogdmlld3BvcnQud2lkdGg7XHJcbiAgICAgICAgaGVpZ2h0ID0gKCBoZWlnaHQgIT09IHVuZGVmaW5lZCApID8gaGVpZ2h0IDogdmlld3BvcnQuaGVpZ2h0O1xyXG4gICAgICAgIGdsLnZpZXdwb3J0KCB4LCB5LCB3aWR0aCwgaGVpZ2h0ICk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gVmlld3BvcnQoIHNwZWMgKSB7XHJcbiAgICAgICAgc3BlYyA9IHNwZWMgfHwge307XHJcbiAgICAgICAgdGhpcy5nbCA9IFdlYkdMQ29udGV4dC5nZXQoKTtcclxuICAgICAgICAvLyBzZXQgc2l6ZVxyXG4gICAgICAgIHRoaXMucmVzaXplKFxyXG4gICAgICAgICAgICBzcGVjLndpZHRoIHx8IHRoaXMuZ2wuY2FudmFzLndpZHRoLFxyXG4gICAgICAgICAgICBzcGVjLmhlaWdodCB8fCB0aGlzLmdsLmNhbnZhcy5oZWlnaHQgKTtcclxuICAgICAgICAvLyBzZXQgb2Zmc2V0XHJcbiAgICAgICAgdGhpcy5vZmZzZXQoXHJcbiAgICAgICAgICAgIHNwZWMueCAhPT0gdW5kZWZpbmVkID8gc3BlYy54IDogMCxcclxuICAgICAgICAgICAgc3BlYy55ICE9PSB1bmRlZmluZWQgPyBzcGVjLnkgOiAwKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFVwZGF0ZXMgdGhlIHZpZXdwb3J0IG9iamVjdHMgd2lkdGggYW5kIGhlaWdodC5cclxuICAgICAqIEBtZW1iZXJvZiBWaWV3cG9ydFxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtWaWV3cG9ydH0gVGhlIHZpZXdwb3J0IG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBWaWV3cG9ydC5wcm90b3R5cGUucmVzaXplID0gZnVuY3Rpb24oIHdpZHRoLCBoZWlnaHQgKSB7XHJcbiAgICAgICAgaWYgKCB3aWR0aCAhPT0gdW5kZWZpbmVkICYmIGhlaWdodCAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgICAgICB0aGlzLmdsLmNhbnZhcy53aWR0aCA9IHdpZHRoICsgdGhpcy54O1xyXG4gICAgICAgICAgICB0aGlzLmdsLmNhbnZhcy5oZWlnaHQgPSBoZWlnaHQgKyB0aGlzLnk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVwZGF0ZXMgdGhlIHZpZXdwb3J0IG9iamVjdHMgeCBhbmQgeSBvZmZzZXRzLlxyXG4gICAgICogQG1lbWJlcm9mIFZpZXdwb3J0XHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1ZpZXdwb3J0fSBUaGUgdmlld3BvcnQgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIFZpZXdwb3J0LnByb3RvdHlwZS5vZmZzZXQgPSBmdW5jdGlvbiggeCwgeSApIHtcclxuICAgICAgICBpZiAoIHggIT09IHVuZGVmaW5lZCAmJiB5ICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgIHRoaXMueCA9IHg7XHJcbiAgICAgICAgICAgIHRoaXMueSA9IHk7XHJcbiAgICAgICAgICAgIHRoaXMuZ2wuY2FudmFzLndpZHRoID0gdGhpcy53aWR0aCArIHg7XHJcbiAgICAgICAgICAgIHRoaXMuZ2wuY2FudmFzLmhlaWdodCA9IHRoaXMuaGVpZ2h0ICsgeTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyB0aGUgdmlld3BvcnQgb2JqZWN0IGFuZCBwdXNoZXMgaXQgdG8gdGhlIGZyb250IG9mIHRoZSBzdGFjay5cclxuICAgICAqIEBtZW1iZXJvZiBWaWV3cG9ydFxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtWaWV3cG9ydH0gVGhlIHZpZXdwb3J0IG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICAgVmlld3BvcnQucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiggeCwgeSwgd2lkdGgsIGhlaWdodCApIHtcclxuICAgICAgICBfc3RhY2sucHVzaCh7XHJcbiAgICAgICAgICAgIHZpZXdwb3J0OiB0aGlzLFxyXG4gICAgICAgICAgICB4OiB4LFxyXG4gICAgICAgICAgICB5OiB5LFxyXG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXHJcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgc2V0KCB0aGlzLCB4LCB5LCB3aWR0aCwgaGVpZ2h0ICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUG9wcyBjdXJyZW50IHRoZSB2aWV3cG9ydCBvYmplY3QgYW5kIHNldHMgdGhlIHZpZXdwb3J0IGJlbmVhdGggaXQuXHJcbiAgICAgKiBAbWVtYmVyb2YgVmlld3BvcnRcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7Vmlld3BvcnR9IFRoZSB2aWV3cG9ydCBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgIFZpZXdwb3J0LnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgdG9wO1xyXG4gICAgICAgIF9zdGFjay5wb3AoKTtcclxuICAgICAgICB0b3AgPSBfc3RhY2sudG9wKCk7XHJcbiAgICAgICAgaWYgKCB0b3AgKSB7XHJcbiAgICAgICAgICAgIHNldCggdG9wLnZpZXdwb3J0LCB0b3AueCwgdG9wLnksIHRvcC53aWR0aCwgdG9wLmhlaWdodCApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHNldCggdGhpcyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBWaWV3cG9ydDtcclxuXHJcbn0oKSk7XHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIF9ib3VuZENvbnRleHQgPSBudWxsLFxyXG4gICAgICAgIF9jb250ZXh0c0J5SWQgPSB7fSxcclxuICAgICAgICBFWFRFTlNJT05TID0gW1xyXG4gICAgICAgICAgICAvLyByYXRpZmllZFxyXG4gICAgICAgICAgICAnT0VTX3RleHR1cmVfZmxvYXQnLFxyXG4gICAgICAgICAgICAnT0VTX3RleHR1cmVfaGFsZl9mbG9hdCcsXHJcbiAgICAgICAgICAgICdXRUJHTF9sb3NlX2NvbnRleHQnLFxyXG4gICAgICAgICAgICAnT0VTX3N0YW5kYXJkX2Rlcml2YXRpdmVzJyxcclxuICAgICAgICAgICAgJ09FU192ZXJ0ZXhfYXJyYXlfb2JqZWN0JyxcclxuICAgICAgICAgICAgJ1dFQkdMX2RlYnVnX3JlbmRlcmVyX2luZm8nLFxyXG4gICAgICAgICAgICAnV0VCR0xfZGVidWdfc2hhZGVycycsXHJcbiAgICAgICAgICAgICdXRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfczN0YycsXHJcbiAgICAgICAgICAgICdXRUJHTF9kZXB0aF90ZXh0dXJlJyxcclxuICAgICAgICAgICAgJ09FU19lbGVtZW50X2luZGV4X3VpbnQnLFxyXG4gICAgICAgICAgICAnRVhUX3RleHR1cmVfZmlsdGVyX2FuaXNvdHJvcGljJyxcclxuICAgICAgICAgICAgJ1dFQkdMX2RyYXdfYnVmZmVycycsXHJcbiAgICAgICAgICAgICdBTkdMRV9pbnN0YW5jZWRfYXJyYXlzJyxcclxuICAgICAgICAgICAgJ09FU190ZXh0dXJlX2Zsb2F0X2xpbmVhcicsXHJcbiAgICAgICAgICAgICdPRVNfdGV4dHVyZV9oYWxmX2Zsb2F0X2xpbmVhcicsXHJcbiAgICAgICAgICAgIC8vIGNvbW11bml0eVxyXG4gICAgICAgICAgICAnV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX2F0YycsXHJcbiAgICAgICAgICAgICdXRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfcHZydGMnLFxyXG4gICAgICAgICAgICAnRVhUX2NvbG9yX2J1ZmZlcl9oYWxmX2Zsb2F0JyxcclxuICAgICAgICAgICAgJ1dFQkdMX2NvbG9yX2J1ZmZlcl9mbG9hdCcsXHJcbiAgICAgICAgICAgICdFWFRfZnJhZ19kZXB0aCcsXHJcbiAgICAgICAgICAgICdFWFRfc1JHQicsXHJcbiAgICAgICAgICAgICdXRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfZXRjMScsXHJcbiAgICAgICAgICAgICdFWFRfYmxlbmRfbWlubWF4JyxcclxuICAgICAgICAgICAgJ0VYVF9zaGFkZXJfdGV4dHVyZV9sb2QnXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYSBDYW52YXMgZWxlbWVudCBvYmplY3QgZnJvbSBlaXRoZXIgYW4gZXhpc3Rpbmcgb2JqZWN0LCBvclxyXG4gICAgICogaWRlbnRpZmljYXRpb24gc3RyaW5nLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7SFRNTENhbnZhc0VsZW1lbnR8U3RyaW5nfSBhcmcgLSBUaGUgQ2FudmFzXHJcbiAgICAgKiAgICAgb2JqZWN0IG9yIENhbnZhcyBpZGVudGlmaWNhdGlvbiBzdHJpbmcuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge0hUTUxDYW52YXNFbGVtZW50fSBUaGUgQ2FudmFzIGVsZW1lbnQgb2JqZWN0LlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBnZXRDYW52YXMoIGFyZyApIHtcclxuICAgICAgICBpZiAoIGFyZyBpbnN0YW5jZW9mIEhUTUxJbWFnZUVsZW1lbnQgfHxcclxuICAgICAgICAgICAgIGFyZyBpbnN0YW5jZW9mIEhUTUxDYW52YXNFbGVtZW50ICkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXJnO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIGFyZyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEF0dGVtcHRzIHRvIHJldHJlaXZlIGEgd3JhcHBlZCBXZWJHTFJlbmRlcmluZ0NvbnRleHQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtIVE1MQ2FudmFzRWxlbWVudH0gVGhlIENhbnZhcyBlbGVtZW50IG9iamVjdCB0byBjcmVhdGUgdGhlIGNvbnRleHQgdW5kZXIuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge09iamVjdH0gVGhlIGNvbnRleHQgd3JhcHBlci5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZ2V0Q29udGV4dFdyYXBwZXIoIGFyZyApIHtcclxuICAgICAgICBpZiAoICFhcmcgKSB7XHJcbiAgICAgICAgICAgIGlmICggX2JvdW5kQ29udGV4dCApIHtcclxuICAgICAgICAgICAgICAgIC8vIHJldHVybiBsYXN0IGJvdW5kIGNvbnRleHRcclxuICAgICAgICAgICAgICAgIHJldHVybiBfYm91bmRDb250ZXh0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGdldENhbnZhcyggYXJnICk7XHJcbiAgICAgICAgICAgIGlmICggY2FudmFzICkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0c0J5SWRbIGNhbnZhcy5pZCBdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIG5vIGJvdW5kIGNvbnRleHQgb3IgYXJndW1lbnRcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEF0dGVtcHRzIHRvIGxvYWQgYWxsIGtub3duIGV4dGVuc2lvbnMgZm9yIGEgcHJvdmlkZWRcclxuICAgICAqIFdlYkdMUmVuZGVyaW5nQ29udGV4dC4gU3RvcmVzIHRoZSByZXN1bHRzIGluIHRoZSBjb250ZXh0IHdyYXBwZXIgZm9yXHJcbiAgICAgKiBsYXRlciBxdWVyaWVzLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0V3JhcHBlciAtIFRoZSBjb250ZXh0IHdyYXBwZXIuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGxvYWRFeHRlbnNpb25zKCBjb250ZXh0V3JhcHBlciApIHtcclxuICAgICAgICB2YXIgZ2wgPSBjb250ZXh0V3JhcHBlci5nbCxcclxuICAgICAgICAgICAgZXh0ZW5zaW9uLFxyXG4gICAgICAgICAgICBpO1xyXG4gICAgICAgIGZvciAoIGk9MDsgaTxFWFRFTlNJT05TLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgICBleHRlbnNpb24gPSBFWFRFTlNJT05TW2ldO1xyXG4gICAgICAgICAgICBjb250ZXh0V3JhcHBlci5leHRlbnNpb25zWyBleHRlbnNpb24gXSA9IGdsLmdldEV4dGVuc2lvbiggZXh0ZW5zaW9uICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXR0ZW1wdHMgdG8gY3JlYXRlIGEgV2ViR0xSZW5kZXJpbmdDb250ZXh0IHdyYXBwZWQgaW5zaWRlIGFuIG9iamVjdCB3aGljaFxyXG4gICAgICogd2lsbCBhbHNvIHN0b3JlIHRoZSBleHRlbnNpb24gcXVlcnkgcmVzdWx0cy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fSBUaGUgQ2FudmFzIGVsZW1lbnQgb2JqZWN0IHRvIGNyZWF0ZSB0aGUgY29udGV4dCB1bmRlci5cclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fX0gb3B0aW9ucyAtIFBhcmFtZXRlcnMgdG8gdGhlIHdlYmdsIGNvbnRleHQsIG9ubHkgdXNlZCBkdXJpbmcgaW5zdGFudGlhdGlvbi4gT3B0aW9uYWwuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge09iamVjdH0gVGhlIGNvbnRleHQgd3JhcHBlci5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gY3JlYXRlQ29udGV4dFdyYXBwZXIoIGNhbnZhcywgb3B0aW9ucyApIHtcclxuICAgICAgICB2YXIgY29udGV4dFdyYXBwZXIsXHJcbiAgICAgICAgICAgIGdsO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIGdldCBXZWJHTCBjb250ZXh0LCBmYWxsYmFjayB0byBleHBlcmltZW50YWxcclxuICAgICAgICAgICAgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dCggJ3dlYmdsJywgb3B0aW9ucyApIHx8IGNhbnZhcy5nZXRDb250ZXh0KCAnZXhwZXJpbWVudGFsLXdlYmdsJywgb3B0aW9ucyApO1xyXG4gICAgICAgICAgICAvLyB3cmFwIGNvbnRleHRcclxuICAgICAgICAgICAgY29udGV4dFdyYXBwZXIgPSB7XHJcbiAgICAgICAgICAgICAgICBpZDogY2FudmFzLmlkLFxyXG4gICAgICAgICAgICAgICAgZ2w6IGdsLFxyXG4gICAgICAgICAgICAgICAgZXh0ZW5zaW9uczoge31cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLy8gbG9hZCBXZWJHTCBleHRlbnNpb25zXHJcbiAgICAgICAgICAgIGxvYWRFeHRlbnNpb25zKCBjb250ZXh0V3JhcHBlciApO1xyXG4gICAgICAgICAgICAvLyBhZGQgY29udGV4dCB3cmFwcGVyIHRvIG1hcFxyXG4gICAgICAgICAgICBfY29udGV4dHNCeUlkWyBjYW52YXMuaWQgXSA9IGNvbnRleHRXcmFwcGVyO1xyXG4gICAgICAgICAgICAvLyBiaW5kIHRoZSBjb250ZXh0XHJcbiAgICAgICAgICAgIF9ib3VuZENvbnRleHQgPSBjb250ZXh0V3JhcHBlcjtcclxuICAgICAgICB9IGNhdGNoKCBlcnIgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoIGVyci5tZXNzYWdlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggIWdsICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCAnVW5hYmxlIHRvIGluaXRpYWxpemUgV2ViR0wuIFlvdXIgYnJvd3NlciBtYXkgbm90ICcgK1xyXG4gICAgICAgICAgICAgICAgJ3N1cHBvcnQgaXQuJyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY29udGV4dFdyYXBwZXI7XHJcbiAgICB9XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEJpbmRzIGEgc3BlY2lmaWMgV2ViR0wgY29udGV4dCBhcyB0aGUgYWN0aXZlIGNvbnRleHQuIFRoaXMgY29udGV4dFxyXG4gICAgICAgICAqIHdpbGwgYmUgdXNlZCBmb3IgYWxsIGNvZGUgL3dlYmdsLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIHtIVE1MQ2FudmFzRWxlbWVudHxTdHJpbmd9IGFyZyAtIFRoZSBDYW52YXMgb2JqZWN0IG9yIENhbnZhcyBpZGVudGlmaWNhdGlvbiBzdHJpbmcuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcmV0dXJucyB7V2ViR0xDb250ZXh0fSBUaGlzIG5hbWVzcGFjZSwgdXNlZCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgYmluZDogZnVuY3Rpb24oIGFyZyApIHtcclxuICAgICAgICAgICAgdmFyIHdyYXBwZXIgPSBnZXRDb250ZXh0V3JhcHBlciggYXJnICk7XHJcbiAgICAgICAgICAgIGlmICggd3JhcHBlciApIHtcclxuICAgICAgICAgICAgICAgIF9ib3VuZENvbnRleHQgPSB3cmFwcGVyO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc29sZS5lcnJvciggJ05vIGNvbnRleHQgZXhpc3RzIGZvciBwcm92aWRlZCBhcmd1bWVudCBgJyArIGFyZyArXHJcbiAgICAgICAgICAgICAgICAnYCwgY29tbWFuZCBpZ25vcmVkLicgKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQ3JlYXRlcyBhIG5ldyBvciByZXRyZWl2ZXMgYW4gZXhpc3RpbmcgV2ViR0wgY29udGV4dCBmb3IgYSBwcm92aWRlZFxyXG4gICAgICAgICAqIGNhbnZhcyBvYmplY3QuIER1cmluZyBjcmVhdGlvbiBhdHRlbXB0cyB0byBsb2FkIGFsbCBleHRlbnNpb25zIGZvdW5kXHJcbiAgICAgICAgICogYXQ6IGh0dHBzOi8vd3d3Lmtocm9ub3Mub3JnL3JlZ2lzdHJ5L3dlYmdsL2V4dGVuc2lvbnMvLiBJZiBub1xyXG4gICAgICAgICAqIGFyZ3VtZW50IGlzIHByb3ZpZGVkIGl0IHdpbGwgYXR0ZW1wdCB0byByZXR1cm4gdGhlIGN1cnJlbnRseSBib3VuZFxyXG4gICAgICAgICAqIGNvbnRleHQuIElmIG5vIGNvbnRleHQgaXMgYm91bmQsIGl0IHdpbGwgcmV0dXJuICdudWxsJy5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSB7SFRNTENhbnZhc0VsZW1lbnR8U3RyaW5nfSBhcmcgLSBUaGUgQ2FudmFzIG9iamVjdCBvciBDYW52YXMgaWRlbnRpZmljYXRpb24gc3RyaW5nLiBPcHRpb25hbC5cclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH19IG9wdGlvbnMgLSBQYXJhbWV0ZXJzIHRvIHRoZSB3ZWJnbCBjb250ZXh0LCBvbmx5IHVzZWQgZHVyaW5nIGluc3RhbnRpYXRpb24uIE9wdGlvbmFsLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHJldHVybnMge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gVGhlIFdlYkdMUmVuZGVyaW5nQ29udGV4dCBjb250ZXh0IG9iamVjdC5cclxuICAgICAgICAgKi9cclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCBhcmcsIG9wdGlvbnMgKSB7XHJcbiAgICAgICAgICAgIHZhciB3cmFwcGVyID0gZ2V0Q29udGV4dFdyYXBwZXIoIGFyZyApO1xyXG4gICAgICAgICAgICBpZiAoIHdyYXBwZXIgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gdGhlIG5hdGl2ZSBXZWJHTFJlbmRlcmluZ0NvbnRleHRcclxuICAgICAgICAgICAgICAgIHJldHVybiB3cmFwcGVyLmdsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGdldCBjYW52YXMgZWxlbWVudFxyXG4gICAgICAgICAgICB2YXIgY2FudmFzID0gZ2V0Q2FudmFzKCBhcmcgKTtcclxuICAgICAgICAgICAgLy8gdHJ5IHRvIGZpbmQgb3IgY3JlYXRlIGNvbnRleHRcclxuICAgICAgICAgICAgaWYgKCAhY2FudmFzIHx8ICFjcmVhdGVDb250ZXh0V3JhcHBlciggY2FudmFzLCBvcHRpb25zICkgKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCAnQ29udGV4dCBjb3VsZCBub3QgYmUgZm91bmQgb3IgY3JlYXRlZCBmb3IgJyArXHJcbiAgICAgICAgICAgICAgICAgICAgJ2FyZ3VtZW50IG9mIHR5cGVgJyArICggdHlwZW9mIGFyZyApICsgJ2AsIHJldHVybmluZyBgbnVsbGAuJyApO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gcmV0dXJuIGNvbnRleHRcclxuICAgICAgICAgICAgcmV0dXJuIF9jb250ZXh0c0J5SWRbIGNhbnZhcy5pZCBdLmdsO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJldHVybnMgYW4gYXJyYXkgb2YgYWxsIHN1cHBvcnRlZCBleHRlbnNpb25zIGZvciB0aGUgcHJvdmlkZWQgY2FudmFzXHJcbiAgICAgICAgICogb2JqZWN0LiBJZiBubyBhcmd1bWVudCBpcyBwcm92aWRlZCBpdCB3aWxsIGF0dGVtcHQgdG8gcXVlcnkgdGhlXHJcbiAgICAgICAgICogY3VycmVudGx5IGJvdW5kIGNvbnRleHQuIElmIG5vIGNvbnRleHQgaXMgYm91bmQsIGl0IHdpbGwgcmV0dXJuXHJcbiAgICAgICAgICogYW4gZW1wdHkgYXJyYXkuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fFN0cmluZ30gYXJnIC0gVGhlIENhbnZhcyBvYmplY3Qgb3IgQ2FudmFzIGlkZW50aWZpY2F0aW9uIHN0cmluZy4gT3B0aW9uYWwuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXl9IEFsbCBzdXBwb3J0ZWQgZXh0ZW5zaW9ucy5cclxuICAgICAgICAgKi9cclxuICAgICAgICBzdXBwb3J0ZWRFeHRlbnNpb25zOiBmdW5jdGlvbiggYXJnICkge1xyXG4gICAgICAgICAgICB2YXIgd3JhcHBlciA9IGdldENvbnRleHRXcmFwcGVyKCBhcmcgKTtcclxuICAgICAgICAgICAgaWYgKCB3cmFwcGVyICkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGV4dGVuc2lvbnMgPSB3cmFwcGVyLmV4dGVuc2lvbnM7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3VwcG9ydGVkID0gW107XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIga2V5IGluIGV4dGVuc2lvbnMgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBleHRlbnNpb25zLmhhc093blByb3BlcnR5KCBrZXkgKSAmJiBleHRlbnNpb25zWyBrZXkgXSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VwcG9ydGVkLnB1c2goIGtleSApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBzdXBwb3J0ZWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignTm8gY29udGV4dCBpcyBjdXJyZW50bHkgYm91bmQgb3Igd2FzIHByb3ZpZGVkLCAnICtcclxuICAgICAgICAgICAgICAgICdyZXR1cm5pbmcgYW4gZW1wdHkgYXJyYXkuJyk7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGFsbCB1bnN1cHBvcnRlZCBleHRlbnNpb25zIGZvciB0aGUgcHJvdmlkZWQgY2FudmFzXHJcbiAgICAgICAgICogb2JqZWN0LiBJZiBubyBhcmd1bWVudCBpcyBwcm92aWRlZCBpdCB3aWxsIGF0dGVtcHQgdG8gcXVlcnkgdGhlXHJcbiAgICAgICAgICogY3VycmVudGx5IGJvdW5kIGNvbnRleHQuIElmIG5vIGNvbnRleHQgaXMgYm91bmQsIGl0IHdpbGwgcmV0dXJuXHJcbiAgICAgICAgICogYW4gZW1wdHkgYXJyYXkuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fFN0cmluZ30gYXJnIC0gVGhlIENhbnZhcyBvYmplY3Qgb3IgQ2FudmFzIGlkZW50aWZpY2F0aW9uIHN0cmluZy4gT3B0aW9uYWwuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXl9IEFsbCB1bnN1cHBvcnRlZCBleHRlbnNpb25zLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHVuc3VwcG9ydGVkRXh0ZW5zaW9uczogZnVuY3Rpb24oIGFyZyApIHtcclxuICAgICAgICAgICAgdmFyIHdyYXBwZXIgPSBnZXRDb250ZXh0V3JhcHBlciggYXJnICk7XHJcbiAgICAgICAgICAgIGlmICggd3JhcHBlciApIHtcclxuICAgICAgICAgICAgICAgIHZhciBleHRlbnNpb25zID0gd3JhcHBlci5leHRlbnNpb25zO1xyXG4gICAgICAgICAgICAgICAgdmFyIHVuc3VwcG9ydGVkID0gW107XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIga2V5IGluIGV4dGVuc2lvbnMgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBleHRlbnNpb25zLmhhc093blByb3BlcnR5KCBrZXkgKSAmJiAhZXh0ZW5zaW9uc1sga2V5IF0gKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuc3VwcG9ydGVkLnB1c2goIGtleSApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB1bnN1cHBvcnRlZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdObyBjb250ZXh0IGlzIGN1cnJlbnRseSBib3VuZCBvciB3YXMgcHJvdmlkZWQsICcgK1xyXG4gICAgICAgICAgICAgICAgJ3JldHVybmluZyBhbiBlbXB0eSBhcnJheS4nKTtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIENoZWNrcyBpZiBhbiBleHRlbnNpb24gaGFzIGJlZW4gc3VjY2Vzc2Z1bGx5IGxvYWRlZCBieSB0aGUgcHJvdmlkZWRcclxuICAgICAgICAgKiBjYW52YXMgb2JqZWN0LiBJZiBubyBhcmd1bWVudCBpcyBwcm92aWRlZCBpdCB3aWxsIGF0dGVtcHQgdG8gcmV0dXJuXHJcbiAgICAgICAgICogdGhlIGN1cnJlbnRseSBib3VuZCBjb250ZXh0LiBJZiBubyBjb250ZXh0IGlzIGJvdW5kLCBpdCB3aWxsIHJldHVyblxyXG4gICAgICAgICAqICdmYWxzZScuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fFN0cmluZ30gYXJnIC0gVGhlIENhbnZhcyBvYmplY3Qgb3IgQ2FudmFzIGlkZW50aWZpY2F0aW9uIHN0cmluZy4gT3B0aW9uYWwuXHJcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGV4dGVuc2lvbiAtIFRoZSBleHRlbnNpb24gbmFtZS5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufSBXaGV0aGVyIG9yIG5vdCB0aGUgcHJvdmlkZWQgZXh0ZW5zaW9uIGhhcyBiZWVuIGxvYWRlZCBzdWNjZXNzZnVsbHkuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgY2hlY2tFeHRlbnNpb246IGZ1bmN0aW9uKCBhcmcsIGV4dGVuc2lvbiApIHtcclxuICAgICAgICAgICAgaWYgKCAhZXh0ZW5zaW9uICkge1xyXG4gICAgICAgICAgICAgICAgLy8gc2hpZnQgcGFyYW1ldGVycyBpZiBubyBjYW52YXMgYXJnIGlzIHByb3ZpZGVkXHJcbiAgICAgICAgICAgICAgICBleHRlbnNpb24gPSBhcmc7XHJcbiAgICAgICAgICAgICAgICBhcmcgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciB3cmFwcGVyID0gZ2V0Q29udGV4dFdyYXBwZXIoIGFyZyApO1xyXG4gICAgICAgICAgICBpZiAoIHdyYXBwZXIgKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZXh0ZW5zaW9ucyA9IHdyYXBwZXIuZXh0ZW5zaW9ucztcclxuICAgICAgICAgICAgICAgIHJldHVybiBleHRlbnNpb25zWyBleHRlbnNpb24gXSA/IGV4dGVuc2lvbnNbIGV4dGVuc2lvbiBdIDogZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignTm8gY29udGV4dCBpcyBjdXJyZW50bHkgYm91bmQgb3IgcHJvdmlkZWQgYXMgJyArXHJcbiAgICAgICAgICAgICAgICAnYXJndW1lbnQsIHJldHVybmluZyBmYWxzZS4nKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBJbmRleEJ1ZmZlcjogcmVxdWlyZSgnLi9jb3JlL0luZGV4QnVmZmVyJyksXHJcbiAgICAgICAgUmVuZGVyYWJsZTogcmVxdWlyZSgnLi9jb3JlL1JlbmRlcmFibGUnKSxcclxuICAgICAgICBSZW5kZXJUYXJnZXQ6IHJlcXVpcmUoJy4vY29yZS9SZW5kZXJUYXJnZXQnKSxcclxuICAgICAgICBTaGFkZXI6IHJlcXVpcmUoJy4vY29yZS9TaGFkZXInKSxcclxuICAgICAgICBUZXh0dXJlMkQ6IHJlcXVpcmUoJy4vY29yZS9UZXh0dXJlMkQnKSxcclxuICAgICAgICBUZXh0dXJlQ3ViZU1hcDogcmVxdWlyZSgnLi9jb3JlL1RleHR1cmVDdWJlTWFwJyksXHJcbiAgICAgICAgVmVydGV4QnVmZmVyOiByZXF1aXJlKCcuL2NvcmUvVmVydGV4QnVmZmVyJyksXHJcbiAgICAgICAgVmVydGV4UGFja2FnZTogcmVxdWlyZSgnLi9jb3JlL1ZlcnRleFBhY2thZ2UnKSxcclxuICAgICAgICBWaWV3cG9ydDogcmVxdWlyZSgnLi9jb3JlL1ZpZXdwb3J0JyksXHJcbiAgICAgICAgV2ViR0xDb250ZXh0OiByZXF1aXJlKCcuL2NvcmUvV2ViR0xDb250ZXh0JylcclxuICAgIH07XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICBmdW5jdGlvbiBTdGFjaygpIHtcclxuICAgICAgICB0aGlzLmRhdGEgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBTdGFjay5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcclxuICAgICAgICB0aGlzLmRhdGEucHVzaCggdmFsdWUgKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgU3RhY2sucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuZGF0YS5wb3AoKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgU3RhY2sucHJvdG90eXBlLnRvcCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuZGF0YS5sZW5ndGggLSAxO1xyXG4gICAgICAgIGlmICggaW5kZXggPCAwICkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVsgaW5kZXggXTtcclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBTdGFjaztcclxuXHJcbn0oKSk7XHJcbiIsIihmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIHZhciBzaW1wbHlEZWZlcnJlZCA9IHJlcXVpcmUoJ3NpbXBseS1kZWZlcnJlZCcpLFxyXG4gICAgICAgIERlZmVycmVkID0gc2ltcGx5RGVmZXJyZWQuRGVmZXJyZWQsXHJcbiAgICAgICAgd2hlbiA9IHNpbXBseURlZmVycmVkLndoZW47XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCByZXNvbHZlcyB0aGUgcHJvdmlkZWQgZGVmZXJyZWQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtEZWZlcnJlZH0gZGVmZXJyZWQgLSBUaGUgZGVmZXJyZWQgb2JqZWN0LlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gVGhlIGZ1bmN0aW9uIHRvIHJlc29sdmUgdGhlIGRlZmVycmVkLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiByZXNvbHZlRGVmZXJyZWQoIGRlZmVycmVkICkge1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiggcmVzdWx0ICkge1xyXG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCByZXN1bHQgKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGlzcGF0Y2hlcyBhbiBhcnJheSBvZiBqb2JzLCBhY2N1bXVsYXRpbmcgdGhlIHJlc3VsdHMgYW5kXHJcbiAgICAgKiBwYXNzaW5nIHRoZW0gdG8gdGhlIGNhbGxiYWNrIGZ1bmN0aW9uIGluIGNvcnJlc3BvbmRpbmcgaW5kaWNlcy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBqb2JzIC0gVGhlIGpvYiBhcnJheS5cclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gVGhlIGNhbGxiYWNrIGZ1bmN0aW9uLlxyXG4gICAgICovXHJcbiAgICAgZnVuY3Rpb24gYXN5bmNBcnJheSggam9icywgY2FsbGJhY2sgKSB7XHJcbiAgICAgICAgdmFyIGRlZmVycmVkcyA9IFtdLFxyXG4gICAgICAgICAgICBkZWZlcnJlZCxcclxuICAgICAgICAgICAgaTtcclxuICAgICAgICBmb3IgKCBpPTA7IGk8am9icy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgZGVmZXJyZWQgPSBuZXcgRGVmZXJyZWQoKTtcclxuICAgICAgICAgICAgZGVmZXJyZWRzLnB1c2goIGRlZmVycmVkICk7XHJcbiAgICAgICAgICAgIGpvYnNbaV0oIHJlc29sdmVEZWZlcnJlZCggZGVmZXJyZWQgKSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICB3aGVuLmFwcGx5KCB3aGVuLCBkZWZlcnJlZHMgKS50aGVuKCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCggYXJndW1lbnRzLCAwICk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKCByZXN1bHRzICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEaXNwYXRjaGVzIGEgbWFwIG9mIGpvYnMsIGFjY3VtdWxhdGluZyB0aGUgcmVzdWx0cyBhbmRcclxuICAgICAqIHBhc3NpbmcgdGhlbSB0byB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gdW5kZXIgY29ycmVzcG9uZGluZ1xyXG4gICAgICoga2V5cy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gam9icyAtIFRoZSBqb2IgbWFwLlxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBUaGUgY2FsbGJhY2sgZnVuY3Rpb24uXHJcbiAgICAgKi9cclxuICAgICBmdW5jdGlvbiBhc3luY09iaiggam9icywgY2FsbGJhY2sgKSB7XHJcbiAgICAgICAgdmFyIGpvYnNCeUluZGV4ID0gW10sXHJcbiAgICAgICAgICAgIGRlZmVycmVkcyA9IFtdLFxyXG4gICAgICAgICAgICBkZWZlcnJlZCxcclxuICAgICAgICAgICAga2V5O1xyXG4gICAgICAgIGZvciAoIGtleSBpbiBqb2JzICkge1xyXG4gICAgICAgICAgICBpZiAoIGpvYnMuaGFzT3duUHJvcGVydHkoIGtleSApICkge1xyXG4gICAgICAgICAgICAgICAgZGVmZXJyZWQgPSBuZXcgRGVmZXJyZWQoKTtcclxuICAgICAgICAgICAgICAgIGRlZmVycmVkcy5wdXNoKCBkZWZlcnJlZCApO1xyXG4gICAgICAgICAgICAgICAgam9ic0J5SW5kZXgucHVzaCgga2V5ICk7XHJcbiAgICAgICAgICAgICAgICBqb2JzWyBrZXkgXSggcmVzb2x2ZURlZmVycmVkKCBkZWZlcnJlZCApICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgd2hlbi5hcHBseSggd2hlbiwgZGVmZXJyZWRzICkuZG9uZSggZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHRzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMCApLFxyXG4gICAgICAgICAgICAgICAgcmVzdWx0c0J5S2V5ID0ge30sXHJcbiAgICAgICAgICAgICAgICBpO1xyXG4gICAgICAgICAgICBmb3IgKCBpPTA7IGk8am9ic0J5SW5kZXgubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRzQnlLZXlbIGpvYnNCeUluZGV4W2ldIF0gPSByZXN1bHRzW2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKCByZXN1bHRzQnlLZXkgKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRXhlY3V0ZSBhIHNldCBvZiBmdW5jdGlvbnMgYXN5bmNocm9ub3VzbHksIG9uY2UgYWxsIGhhdmUgYmVlblxyXG4gICAgICAgICAqIGNvbXBsZXRlZCwgZXhlY3V0ZSB0aGUgcHJvdmlkZWQgY2FsbGJhY2sgZnVuY3Rpb24uIEpvYnMgbWF5IGJlIHBhc3NlZFxyXG4gICAgICAgICAqIGFzIGFuIGFycmF5IG9yIG9iamVjdC4gVGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHdpbGwgYmUgcGFzc2VkIHRoZVxyXG4gICAgICAgICAqIHJlc3VsdHMgaW4gdGhlIHNhbWUgZm9ybWF0IGFzIHRoZSBqb2JzLiBBbGwgam9icyBtdXN0IGhhdmUgYWNjZXB0IGFuZFxyXG4gICAgICAgICAqIGV4ZWN1dGUgYSBjYWxsYmFjayBmdW5jdGlvbiB1cG9uIGNvbXBsZXRpb24uXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gam9icyAtIFRoZSBzZXQgb2YgZnVuY3Rpb25zIHRvIGV4ZWN1dGUuXHJcbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBUaGUgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYmUgZXhlY3V0ZWQgdXBvbiBjb21wbGV0aW9uLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGFzeW5jOiBmdW5jdGlvbiggam9icywgY2FsbGJhY2sgKSB7XHJcbiAgICAgICAgICAgIGlmICggam9icyBpbnN0YW5jZW9mIEFycmF5ICkge1xyXG4gICAgICAgICAgICAgICAgYXN5bmNBcnJheSggam9icywgY2FsbGJhY2sgKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGFzeW5jT2JqKCBqb2JzLCBjYWxsYmFjayApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUmV0dXJucyB0cnVlIGlmIGEgcHJvdmlkZWQgYXJyYXkgaXMgYSBqYXZzY3JpcHQgVHlwZWRBcnJheS5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSB7Kn0gYXJyYXkgLSBUaGUgdmFyaWFibGUgdG8gdGVzdC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufSAtIFdoZXRoZXIgb3Igbm90IHRoZSB2YXJpYWJsZSBpcyBhIFR5cGVkQXJyYXkuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgaXNUeXBlZEFycmF5OiBmdW5jdGlvbiggYXJyYXkgKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcnJheSAmJlxyXG4gICAgICAgICAgICAgICAgYXJyYXkuYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgJiZcclxuICAgICAgICAgICAgICAgIGFycmF5LmJ5dGVMZW5ndGggIT09IHVuZGVmaW5lZDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIHByb3ZpZGVkIGludGVnZXIgaXMgYSBwb3dlciBvZiB0d28uXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0ge2ludGVnZXJ9IG51bSAtIFRoZSBudW1iZXIgdG8gdGVzdC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufSAtIFdoZXRoZXIgb3Igbm90IHRoZSBudW1iZXIgaXMgYSBwb3dlciBvZiB0d28uXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgaXNQb3dlck9mVHdvOiBmdW5jdGlvbiggbnVtICkge1xyXG4gICAgICAgICAgICByZXR1cm4gKCBudW0gIT09IDAgKSA/ICggbnVtICYgKCBudW0gLSAxICkgKSA9PT0gMCA6IGZhbHNlO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJldHVybnMgdGhlIG5leHQgaGlnaGVzdCBwb3dlciBvZiB0d28gZm9yIGEgbnVtYmVyLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogRXguXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiAgICAgMjAwIC0+IDI1NlxyXG4gICAgICAgICAqICAgICAyNTYgLT4gMjU2XHJcbiAgICAgICAgICogICAgIDI1NyAtPiA1MTJcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSB7aW50ZWdlcn0gbnVtIC0gVGhlIG51bWJlciB0byBtb2RpZnkuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcmV0dXJucyB7aW50ZWdlcn0gLSBOZXh0IGhpZ2hlc3QgcG93ZXIgb2YgdHdvLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIG5leHRIaWdoZXN0UG93ZXJPZlR3bzogZnVuY3Rpb24oIG51bSApIHtcclxuICAgICAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgICAgIGlmICggbnVtICE9PSAwICkge1xyXG4gICAgICAgICAgICAgICAgbnVtID0gbnVtLTE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZm9yICggaT0xOyBpPDMyOyBpPDw9MSApIHtcclxuICAgICAgICAgICAgICAgIG51bSA9IG51bSB8IG51bSA+PiBpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBudW0gKyAxO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VuZHMgYW4gWE1MSHR0cFJlcXVlc3QgR0VUIHJlcXVlc3QgdG8gdGhlIHN1cHBsaWVkIHVybC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHVybCAtIFRoZSBVUkwgZm9yIHRoZSByZXNvdXJjZS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBDb250YWlucyB0aGUgZm9sbG93aW5nIG9wdGlvbnM6XG4gICAgICAgICAqIDxwcmU+XG4gICAgICAgICAqICAgICB7XG4gICAgICAgICAqICAgICAgICAge1N0cmluZ30gc3VjY2VzcyAtIFRoZSBzdWNjZXNzIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgICAgICAgKiAgICAgICAgIHtTdHJpbmd9IGVycm9yIC0gVGhlIGVycm9yIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgICAgICAgKiAgICAgICAgIHtTdHJpbmd9IHByb2dyZXNzIC0gVGhlIHByb2dyZXNzIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgICAgICAgKiAgICAgICAgIHtTdHJpbmd9IHJlc3BvbnNlVHlwZSAtIFRoZSByZXNwb25zZVR5cGUgb2YgdGhlIFhIUi5cbiAgICAgICAgICogICAgIH1cbiAgICAgICAgICogPC9wcmU+XG4gICAgICAgICAqL1xuICAgICAgICBsb2FkOiBmdW5jdGlvbiAoIHVybCwgb3B0aW9ucyApIHtcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9wZW4oICdHRVQnLCB1cmwsIHRydWUgKTtcbiAgICAgICAgICAgIHJlcXVlc3QucmVzcG9uc2VUeXBlID0gb3B0aW9ucy5yZXNwb25zZVR5cGU7XG4gICAgICAgICAgICByZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoICdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICggb3B0aW9ucy5zdWNjZXNzICkge1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnN1Y2Nlc3MoIHRoaXMucmVzcG9uc2UgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICggb3B0aW9ucy5wcm9ncmVzcyApIHtcbiAgICAgICAgICAgICAgICByZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoICdwcm9ncmVzcycsIGZ1bmN0aW9uICggZXZlbnQgKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMucHJvZ3Jlc3MoIGV2ZW50ICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIG9wdGlvbnMuZXJyb3IgKSB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKCAnZXJyb3InLCBmdW5jdGlvbiAoIGV2ZW50ICkge1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmVycm9yKCBldmVudCApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVxdWVzdC5zZW5kKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KCkpO1xuIiwidmFyIGpzb24gPSB0eXBlb2YgSlNPTiAhPT0gJ3VuZGVmaW5lZCcgPyBKU09OIDogcmVxdWlyZSgnanNvbmlmeScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmosIG9wdHMpIHtcbiAgICBpZiAoIW9wdHMpIG9wdHMgPSB7fTtcbiAgICBpZiAodHlwZW9mIG9wdHMgPT09ICdmdW5jdGlvbicpIG9wdHMgPSB7IGNtcDogb3B0cyB9O1xuICAgIHZhciBzcGFjZSA9IG9wdHMuc3BhY2UgfHwgJyc7XG4gICAgaWYgKHR5cGVvZiBzcGFjZSA9PT0gJ251bWJlcicpIHNwYWNlID0gQXJyYXkoc3BhY2UrMSkuam9pbignICcpO1xuICAgIHZhciBjeWNsZXMgPSAodHlwZW9mIG9wdHMuY3ljbGVzID09PSAnYm9vbGVhbicpID8gb3B0cy5jeWNsZXMgOiBmYWxzZTtcbiAgICB2YXIgcmVwbGFjZXIgPSBvcHRzLnJlcGxhY2VyIHx8IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHsgcmV0dXJuIHZhbHVlOyB9O1xuXG4gICAgdmFyIGNtcCA9IG9wdHMuY21wICYmIChmdW5jdGlvbiAoZikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIHZhciBhb2JqID0geyBrZXk6IGEsIHZhbHVlOiBub2RlW2FdIH07XG4gICAgICAgICAgICAgICAgdmFyIGJvYmogPSB7IGtleTogYiwgdmFsdWU6IG5vZGVbYl0gfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZihhb2JqLCBib2JqKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgfSkob3B0cy5jbXApO1xuXG4gICAgdmFyIHNlZW4gPSBbXTtcbiAgICByZXR1cm4gKGZ1bmN0aW9uIHN0cmluZ2lmeSAocGFyZW50LCBrZXksIG5vZGUsIGxldmVsKSB7XG4gICAgICAgIHZhciBpbmRlbnQgPSBzcGFjZSA/ICgnXFxuJyArIG5ldyBBcnJheShsZXZlbCArIDEpLmpvaW4oc3BhY2UpKSA6ICcnO1xuICAgICAgICB2YXIgY29sb25TZXBhcmF0b3IgPSBzcGFjZSA/ICc6ICcgOiAnOic7XG5cbiAgICAgICAgaWYgKG5vZGUgJiYgbm9kZS50b0pTT04gJiYgdHlwZW9mIG5vZGUudG9KU09OID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBub2RlID0gbm9kZS50b0pTT04oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vZGUgPSByZXBsYWNlci5jYWxsKHBhcmVudCwga2V5LCBub2RlKTtcblxuICAgICAgICBpZiAobm9kZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBub2RlICE9PSAnb2JqZWN0JyB8fCBub2RlID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4ganNvbi5zdHJpbmdpZnkobm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzQXJyYXkobm9kZSkpIHtcbiAgICAgICAgICAgIHZhciBvdXQgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBpdGVtID0gc3RyaW5naWZ5KG5vZGUsIGksIG5vZGVbaV0sIGxldmVsKzEpIHx8IGpzb24uc3RyaW5naWZ5KG51bGwpO1xuICAgICAgICAgICAgICAgIG91dC5wdXNoKGluZGVudCArIHNwYWNlICsgaXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gJ1snICsgb3V0LmpvaW4oJywnKSArIGluZGVudCArICddJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChzZWVuLmluZGV4T2Yobm9kZSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgaWYgKGN5Y2xlcykgcmV0dXJuIGpzb24uc3RyaW5naWZ5KCdfX2N5Y2xlX18nKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDb252ZXJ0aW5nIGNpcmN1bGFyIHN0cnVjdHVyZSB0byBKU09OJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHNlZW4ucHVzaChub2RlKTtcblxuICAgICAgICAgICAgdmFyIGtleXMgPSBvYmplY3RLZXlzKG5vZGUpLnNvcnQoY21wICYmIGNtcChub2RlKSk7XG4gICAgICAgICAgICB2YXIgb3V0ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBzdHJpbmdpZnkobm9kZSwga2V5LCBub2RlW2tleV0sIGxldmVsKzEpO1xuXG4gICAgICAgICAgICAgICAgaWYoIXZhbHVlKSBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgIHZhciBrZXlWYWx1ZSA9IGpzb24uc3RyaW5naWZ5KGtleSlcbiAgICAgICAgICAgICAgICAgICAgKyBjb2xvblNlcGFyYXRvclxuICAgICAgICAgICAgICAgICAgICArIHZhbHVlO1xuICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgICBvdXQucHVzaChpbmRlbnQgKyBzcGFjZSArIGtleVZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlZW4uc3BsaWNlKHNlZW4uaW5kZXhPZihub2RlKSwgMSk7XG4gICAgICAgICAgICByZXR1cm4gJ3snICsgb3V0LmpvaW4oJywnKSArIGluZGVudCArICd9JztcbiAgICAgICAgfVxuICAgIH0pKHsgJyc6IG9iaiB9LCAnJywgb2JqLCAwKTtcbn07XG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiB7fS50b1N0cmluZy5jYWxsKHgpID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkgfHwgZnVuY3Rpb24gKCkgeyByZXR1cm4gdHJ1ZSB9O1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICBpZiAoaGFzLmNhbGwob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIGtleXM7XG59O1xuIiwiZXhwb3J0cy5wYXJzZSA9IHJlcXVpcmUoJy4vbGliL3BhcnNlJyk7XG5leHBvcnRzLnN0cmluZ2lmeSA9IHJlcXVpcmUoJy4vbGliL3N0cmluZ2lmeScpO1xuIiwidmFyIGF0LCAvLyBUaGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgY2hhcmFjdGVyXG4gICAgY2gsIC8vIFRoZSBjdXJyZW50IGNoYXJhY3RlclxuICAgIGVzY2FwZWUgPSB7XG4gICAgICAgICdcIic6ICAnXCInLFxuICAgICAgICAnXFxcXCc6ICdcXFxcJyxcbiAgICAgICAgJy8nOiAgJy8nLFxuICAgICAgICBiOiAgICAnXFxiJyxcbiAgICAgICAgZjogICAgJ1xcZicsXG4gICAgICAgIG46ICAgICdcXG4nLFxuICAgICAgICByOiAgICAnXFxyJyxcbiAgICAgICAgdDogICAgJ1xcdCdcbiAgICB9LFxuICAgIHRleHQsXG5cbiAgICBlcnJvciA9IGZ1bmN0aW9uIChtKSB7XG4gICAgICAgIC8vIENhbGwgZXJyb3Igd2hlbiBzb21ldGhpbmcgaXMgd3JvbmcuXG4gICAgICAgIHRocm93IHtcbiAgICAgICAgICAgIG5hbWU6ICAgICdTeW50YXhFcnJvcicsXG4gICAgICAgICAgICBtZXNzYWdlOiBtLFxuICAgICAgICAgICAgYXQ6ICAgICAgYXQsXG4gICAgICAgICAgICB0ZXh0OiAgICB0ZXh0XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBcbiAgICBuZXh0ID0gZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgLy8gSWYgYSBjIHBhcmFtZXRlciBpcyBwcm92aWRlZCwgdmVyaWZ5IHRoYXQgaXQgbWF0Y2hlcyB0aGUgY3VycmVudCBjaGFyYWN0ZXIuXG4gICAgICAgIGlmIChjICYmIGMgIT09IGNoKSB7XG4gICAgICAgICAgICBlcnJvcihcIkV4cGVjdGVkICdcIiArIGMgKyBcIicgaW5zdGVhZCBvZiAnXCIgKyBjaCArIFwiJ1wiKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gR2V0IHRoZSBuZXh0IGNoYXJhY3Rlci4gV2hlbiB0aGVyZSBhcmUgbm8gbW9yZSBjaGFyYWN0ZXJzLFxuICAgICAgICAvLyByZXR1cm4gdGhlIGVtcHR5IHN0cmluZy5cbiAgICAgICAgXG4gICAgICAgIGNoID0gdGV4dC5jaGFyQXQoYXQpO1xuICAgICAgICBhdCArPSAxO1xuICAgICAgICByZXR1cm4gY2g7XG4gICAgfSxcbiAgICBcbiAgICBudW1iZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIFBhcnNlIGEgbnVtYmVyIHZhbHVlLlxuICAgICAgICB2YXIgbnVtYmVyLFxuICAgICAgICAgICAgc3RyaW5nID0gJyc7XG4gICAgICAgIFxuICAgICAgICBpZiAoY2ggPT09ICctJykge1xuICAgICAgICAgICAgc3RyaW5nID0gJy0nO1xuICAgICAgICAgICAgbmV4dCgnLScpO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChjaCA+PSAnMCcgJiYgY2ggPD0gJzknKSB7XG4gICAgICAgICAgICBzdHJpbmcgKz0gY2g7XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoID09PSAnLicpIHtcbiAgICAgICAgICAgIHN0cmluZyArPSAnLic7XG4gICAgICAgICAgICB3aGlsZSAobmV4dCgpICYmIGNoID49ICcwJyAmJiBjaCA8PSAnOScpIHtcbiAgICAgICAgICAgICAgICBzdHJpbmcgKz0gY2g7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoID09PSAnZScgfHwgY2ggPT09ICdFJykge1xuICAgICAgICAgICAgc3RyaW5nICs9IGNoO1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgaWYgKGNoID09PSAnLScgfHwgY2ggPT09ICcrJykge1xuICAgICAgICAgICAgICAgIHN0cmluZyArPSBjaDtcbiAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aGlsZSAoY2ggPj0gJzAnICYmIGNoIDw9ICc5Jykge1xuICAgICAgICAgICAgICAgIHN0cmluZyArPSBjaDtcbiAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbnVtYmVyID0gK3N0cmluZztcbiAgICAgICAgaWYgKCFpc0Zpbml0ZShudW1iZXIpKSB7XG4gICAgICAgICAgICBlcnJvcihcIkJhZCBudW1iZXJcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVtYmVyO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBzdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIFBhcnNlIGEgc3RyaW5nIHZhbHVlLlxuICAgICAgICB2YXIgaGV4LFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIHN0cmluZyA9ICcnLFxuICAgICAgICAgICAgdWZmZmY7XG4gICAgICAgIFxuICAgICAgICAvLyBXaGVuIHBhcnNpbmcgZm9yIHN0cmluZyB2YWx1ZXMsIHdlIG11c3QgbG9vayBmb3IgXCIgYW5kIFxcIGNoYXJhY3RlcnMuXG4gICAgICAgIGlmIChjaCA9PT0gJ1wiJykge1xuICAgICAgICAgICAgd2hpbGUgKG5leHQoKSkge1xuICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJ1wiJykge1xuICAgICAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJ1xcXFwnKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoID09PSAndScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVmZmZmID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCA0OyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZXggPSBwYXJzZUludChuZXh0KCksIDE2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzRmluaXRlKGhleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVmZmZmID0gdWZmZmYgKiAxNiArIGhleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHVmZmZmKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZXNjYXBlZVtjaF0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmcgKz0gZXNjYXBlZVtjaF07XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmluZyArPSBjaDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3IoXCJCYWQgc3RyaW5nXCIpO1xuICAgIH0sXG5cbiAgICB3aGl0ZSA9IGZ1bmN0aW9uICgpIHtcblxuLy8gU2tpcCB3aGl0ZXNwYWNlLlxuXG4gICAgICAgIHdoaWxlIChjaCAmJiBjaCA8PSAnICcpIHtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB3b3JkID0gZnVuY3Rpb24gKCkge1xuXG4vLyB0cnVlLCBmYWxzZSwgb3IgbnVsbC5cblxuICAgICAgICBzd2l0Y2ggKGNoKSB7XG4gICAgICAgIGNhc2UgJ3QnOlxuICAgICAgICAgICAgbmV4dCgndCcpO1xuICAgICAgICAgICAgbmV4dCgncicpO1xuICAgICAgICAgICAgbmV4dCgndScpO1xuICAgICAgICAgICAgbmV4dCgnZScpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGNhc2UgJ2YnOlxuICAgICAgICAgICAgbmV4dCgnZicpO1xuICAgICAgICAgICAgbmV4dCgnYScpO1xuICAgICAgICAgICAgbmV4dCgnbCcpO1xuICAgICAgICAgICAgbmV4dCgncycpO1xuICAgICAgICAgICAgbmV4dCgnZScpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBjYXNlICduJzpcbiAgICAgICAgICAgIG5leHQoJ24nKTtcbiAgICAgICAgICAgIG5leHQoJ3UnKTtcbiAgICAgICAgICAgIG5leHQoJ2wnKTtcbiAgICAgICAgICAgIG5leHQoJ2wnKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGVycm9yKFwiVW5leHBlY3RlZCAnXCIgKyBjaCArIFwiJ1wiKTtcbiAgICB9LFxuXG4gICAgdmFsdWUsICAvLyBQbGFjZSBob2xkZXIgZm9yIHRoZSB2YWx1ZSBmdW5jdGlvbi5cblxuICAgIGFycmF5ID0gZnVuY3Rpb24gKCkge1xuXG4vLyBQYXJzZSBhbiBhcnJheSB2YWx1ZS5cblxuICAgICAgICB2YXIgYXJyYXkgPSBbXTtcblxuICAgICAgICBpZiAoY2ggPT09ICdbJykge1xuICAgICAgICAgICAgbmV4dCgnWycpO1xuICAgICAgICAgICAgd2hpdGUoKTtcbiAgICAgICAgICAgIGlmIChjaCA9PT0gJ10nKSB7XG4gICAgICAgICAgICAgICAgbmV4dCgnXScpO1xuICAgICAgICAgICAgICAgIHJldHVybiBhcnJheTsgICAvLyBlbXB0eSBhcnJheVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2hpbGUgKGNoKSB7XG4gICAgICAgICAgICAgICAgYXJyYXkucHVzaCh2YWx1ZSgpKTtcbiAgICAgICAgICAgICAgICB3aGl0ZSgpO1xuICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJ10nKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHQoJ10nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBuZXh0KCcsJyk7XG4gICAgICAgICAgICAgICAgd2hpdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlcnJvcihcIkJhZCBhcnJheVwiKTtcbiAgICB9LFxuXG4gICAgb2JqZWN0ID0gZnVuY3Rpb24gKCkge1xuXG4vLyBQYXJzZSBhbiBvYmplY3QgdmFsdWUuXG5cbiAgICAgICAgdmFyIGtleSxcbiAgICAgICAgICAgIG9iamVjdCA9IHt9O1xuXG4gICAgICAgIGlmIChjaCA9PT0gJ3snKSB7XG4gICAgICAgICAgICBuZXh0KCd7Jyk7XG4gICAgICAgICAgICB3aGl0ZSgpO1xuICAgICAgICAgICAgaWYgKGNoID09PSAnfScpIHtcbiAgICAgICAgICAgICAgICBuZXh0KCd9Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iamVjdDsgICAvLyBlbXB0eSBvYmplY3RcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdoaWxlIChjaCkge1xuICAgICAgICAgICAgICAgIGtleSA9IHN0cmluZygpO1xuICAgICAgICAgICAgICAgIHdoaXRlKCk7XG4gICAgICAgICAgICAgICAgbmV4dCgnOicpO1xuICAgICAgICAgICAgICAgIGlmIChPYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IoJ0R1cGxpY2F0ZSBrZXkgXCInICsga2V5ICsgJ1wiJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG9iamVjdFtrZXldID0gdmFsdWUoKTtcbiAgICAgICAgICAgICAgICB3aGl0ZSgpO1xuICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHQoJ30nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbmV4dCgnLCcpO1xuICAgICAgICAgICAgICAgIHdoaXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3IoXCJCYWQgb2JqZWN0XCIpO1xuICAgIH07XG5cbnZhbHVlID0gZnVuY3Rpb24gKCkge1xuXG4vLyBQYXJzZSBhIEpTT04gdmFsdWUuIEl0IGNvdWxkIGJlIGFuIG9iamVjdCwgYW4gYXJyYXksIGEgc3RyaW5nLCBhIG51bWJlcixcbi8vIG9yIGEgd29yZC5cblxuICAgIHdoaXRlKCk7XG4gICAgc3dpdGNoIChjaCkge1xuICAgIGNhc2UgJ3snOlxuICAgICAgICByZXR1cm4gb2JqZWN0KCk7XG4gICAgY2FzZSAnWyc6XG4gICAgICAgIHJldHVybiBhcnJheSgpO1xuICAgIGNhc2UgJ1wiJzpcbiAgICAgICAgcmV0dXJuIHN0cmluZygpO1xuICAgIGNhc2UgJy0nOlxuICAgICAgICByZXR1cm4gbnVtYmVyKCk7XG4gICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGNoID49ICcwJyAmJiBjaCA8PSAnOScgPyBudW1iZXIoKSA6IHdvcmQoKTtcbiAgICB9XG59O1xuXG4vLyBSZXR1cm4gdGhlIGpzb25fcGFyc2UgZnVuY3Rpb24uIEl0IHdpbGwgaGF2ZSBhY2Nlc3MgdG8gYWxsIG9mIHRoZSBhYm92ZVxuLy8gZnVuY3Rpb25zIGFuZCB2YXJpYWJsZXMuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHNvdXJjZSwgcmV2aXZlcikge1xuICAgIHZhciByZXN1bHQ7XG4gICAgXG4gICAgdGV4dCA9IHNvdXJjZTtcbiAgICBhdCA9IDA7XG4gICAgY2ggPSAnICc7XG4gICAgcmVzdWx0ID0gdmFsdWUoKTtcbiAgICB3aGl0ZSgpO1xuICAgIGlmIChjaCkge1xuICAgICAgICBlcnJvcihcIlN5bnRheCBlcnJvclwiKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBpcyBhIHJldml2ZXIgZnVuY3Rpb24sIHdlIHJlY3Vyc2l2ZWx5IHdhbGsgdGhlIG5ldyBzdHJ1Y3R1cmUsXG4gICAgLy8gcGFzc2luZyBlYWNoIG5hbWUvdmFsdWUgcGFpciB0byB0aGUgcmV2aXZlciBmdW5jdGlvbiBmb3IgcG9zc2libGVcbiAgICAvLyB0cmFuc2Zvcm1hdGlvbiwgc3RhcnRpbmcgd2l0aCBhIHRlbXBvcmFyeSByb290IG9iamVjdCB0aGF0IGhvbGRzIHRoZSByZXN1bHRcbiAgICAvLyBpbiBhbiBlbXB0eSBrZXkuIElmIHRoZXJlIGlzIG5vdCBhIHJldml2ZXIgZnVuY3Rpb24sIHdlIHNpbXBseSByZXR1cm4gdGhlXG4gICAgLy8gcmVzdWx0LlxuXG4gICAgcmV0dXJuIHR5cGVvZiByZXZpdmVyID09PSAnZnVuY3Rpb24nID8gKGZ1bmN0aW9uIHdhbGsoaG9sZGVyLCBrZXkpIHtcbiAgICAgICAgdmFyIGssIHYsIHZhbHVlID0gaG9sZGVyW2tleV07XG4gICAgICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBmb3IgKGsgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCBrKSkge1xuICAgICAgICAgICAgICAgICAgICB2ID0gd2Fsayh2YWx1ZSwgayk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlW2tdID0gdjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB2YWx1ZVtrXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV2aXZlci5jYWxsKGhvbGRlciwga2V5LCB2YWx1ZSk7XG4gICAgfSh7Jyc6IHJlc3VsdH0sICcnKSkgOiByZXN1bHQ7XG59O1xuIiwidmFyIGN4ID0gL1tcXHUwMDAwXFx1MDBhZFxcdTA2MDAtXFx1MDYwNFxcdTA3MGZcXHUxN2I0XFx1MTdiNVxcdTIwMGMtXFx1MjAwZlxcdTIwMjgtXFx1MjAyZlxcdTIwNjAtXFx1MjA2ZlxcdWZlZmZcXHVmZmYwLVxcdWZmZmZdL2csXG4gICAgZXNjYXBhYmxlID0gL1tcXFxcXFxcIlxceDAwLVxceDFmXFx4N2YtXFx4OWZcXHUwMGFkXFx1MDYwMC1cXHUwNjA0XFx1MDcwZlxcdTE3YjRcXHUxN2I1XFx1MjAwYy1cXHUyMDBmXFx1MjAyOC1cXHUyMDJmXFx1MjA2MC1cXHUyMDZmXFx1ZmVmZlxcdWZmZjAtXFx1ZmZmZl0vZyxcbiAgICBnYXAsXG4gICAgaW5kZW50LFxuICAgIG1ldGEgPSB7ICAgIC8vIHRhYmxlIG9mIGNoYXJhY3RlciBzdWJzdGl0dXRpb25zXG4gICAgICAgICdcXGInOiAnXFxcXGInLFxuICAgICAgICAnXFx0JzogJ1xcXFx0JyxcbiAgICAgICAgJ1xcbic6ICdcXFxcbicsXG4gICAgICAgICdcXGYnOiAnXFxcXGYnLFxuICAgICAgICAnXFxyJzogJ1xcXFxyJyxcbiAgICAgICAgJ1wiJyA6ICdcXFxcXCInLFxuICAgICAgICAnXFxcXCc6ICdcXFxcXFxcXCdcbiAgICB9LFxuICAgIHJlcDtcblxuZnVuY3Rpb24gcXVvdGUoc3RyaW5nKSB7XG4gICAgLy8gSWYgdGhlIHN0cmluZyBjb250YWlucyBubyBjb250cm9sIGNoYXJhY3RlcnMsIG5vIHF1b3RlIGNoYXJhY3RlcnMsIGFuZCBub1xuICAgIC8vIGJhY2tzbGFzaCBjaGFyYWN0ZXJzLCB0aGVuIHdlIGNhbiBzYWZlbHkgc2xhcCBzb21lIHF1b3RlcyBhcm91bmQgaXQuXG4gICAgLy8gT3RoZXJ3aXNlIHdlIG11c3QgYWxzbyByZXBsYWNlIHRoZSBvZmZlbmRpbmcgY2hhcmFjdGVycyB3aXRoIHNhZmUgZXNjYXBlXG4gICAgLy8gc2VxdWVuY2VzLlxuICAgIFxuICAgIGVzY2FwYWJsZS5sYXN0SW5kZXggPSAwO1xuICAgIHJldHVybiBlc2NhcGFibGUudGVzdChzdHJpbmcpID8gJ1wiJyArIHN0cmluZy5yZXBsYWNlKGVzY2FwYWJsZSwgZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgdmFyIGMgPSBtZXRhW2FdO1xuICAgICAgICByZXR1cm4gdHlwZW9mIGMgPT09ICdzdHJpbmcnID8gYyA6XG4gICAgICAgICAgICAnXFxcXHUnICsgKCcwMDAwJyArIGEuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikpLnNsaWNlKC00KTtcbiAgICB9KSArICdcIicgOiAnXCInICsgc3RyaW5nICsgJ1wiJztcbn1cblxuZnVuY3Rpb24gc3RyKGtleSwgaG9sZGVyKSB7XG4gICAgLy8gUHJvZHVjZSBhIHN0cmluZyBmcm9tIGhvbGRlcltrZXldLlxuICAgIHZhciBpLCAgICAgICAgICAvLyBUaGUgbG9vcCBjb3VudGVyLlxuICAgICAgICBrLCAgICAgICAgICAvLyBUaGUgbWVtYmVyIGtleS5cbiAgICAgICAgdiwgICAgICAgICAgLy8gVGhlIG1lbWJlciB2YWx1ZS5cbiAgICAgICAgbGVuZ3RoLFxuICAgICAgICBtaW5kID0gZ2FwLFxuICAgICAgICBwYXJ0aWFsLFxuICAgICAgICB2YWx1ZSA9IGhvbGRlcltrZXldO1xuICAgIFxuICAgIC8vIElmIHRoZSB2YWx1ZSBoYXMgYSB0b0pTT04gbWV0aG9kLCBjYWxsIGl0IHRvIG9idGFpbiBhIHJlcGxhY2VtZW50IHZhbHVlLlxuICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmXG4gICAgICAgICAgICB0eXBlb2YgdmFsdWUudG9KU09OID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhbHVlID0gdmFsdWUudG9KU09OKGtleSk7XG4gICAgfVxuICAgIFxuICAgIC8vIElmIHdlIHdlcmUgY2FsbGVkIHdpdGggYSByZXBsYWNlciBmdW5jdGlvbiwgdGhlbiBjYWxsIHRoZSByZXBsYWNlciB0b1xuICAgIC8vIG9idGFpbiBhIHJlcGxhY2VtZW50IHZhbHVlLlxuICAgIGlmICh0eXBlb2YgcmVwID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHZhbHVlID0gcmVwLmNhbGwoaG9sZGVyLCBrZXksIHZhbHVlKTtcbiAgICB9XG4gICAgXG4gICAgLy8gV2hhdCBoYXBwZW5zIG5leHQgZGVwZW5kcyBvbiB0aGUgdmFsdWUncyB0eXBlLlxuICAgIHN3aXRjaCAodHlwZW9mIHZhbHVlKSB7XG4gICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICByZXR1cm4gcXVvdGUodmFsdWUpO1xuICAgICAgICBcbiAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgIC8vIEpTT04gbnVtYmVycyBtdXN0IGJlIGZpbml0ZS4gRW5jb2RlIG5vbi1maW5pdGUgbnVtYmVycyBhcyBudWxsLlxuICAgICAgICAgICAgcmV0dXJuIGlzRmluaXRlKHZhbHVlKSA/IFN0cmluZyh2YWx1ZSkgOiAnbnVsbCc7XG4gICAgICAgIFxuICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgY2FzZSAnbnVsbCc6XG4gICAgICAgICAgICAvLyBJZiB0aGUgdmFsdWUgaXMgYSBib29sZWFuIG9yIG51bGwsIGNvbnZlcnQgaXQgdG8gYSBzdHJpbmcuIE5vdGU6XG4gICAgICAgICAgICAvLyB0eXBlb2YgbnVsbCBkb2VzIG5vdCBwcm9kdWNlICdudWxsJy4gVGhlIGNhc2UgaXMgaW5jbHVkZWQgaGVyZSBpblxuICAgICAgICAgICAgLy8gdGhlIHJlbW90ZSBjaGFuY2UgdGhhdCB0aGlzIGdldHMgZml4ZWQgc29tZWRheS5cbiAgICAgICAgICAgIHJldHVybiBTdHJpbmcodmFsdWUpO1xuICAgICAgICAgICAgXG4gICAgICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSByZXR1cm4gJ251bGwnO1xuICAgICAgICAgICAgZ2FwICs9IGluZGVudDtcbiAgICAgICAgICAgIHBhcnRpYWwgPSBbXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQXJyYXkuaXNBcnJheVxuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuYXBwbHkodmFsdWUpID09PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gdmFsdWUubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJ0aWFsW2ldID0gc3RyKGksIHZhbHVlKSB8fCAnbnVsbCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIEpvaW4gYWxsIG9mIHRoZSBlbGVtZW50cyB0b2dldGhlciwgc2VwYXJhdGVkIHdpdGggY29tbWFzLCBhbmRcbiAgICAgICAgICAgICAgICAvLyB3cmFwIHRoZW0gaW4gYnJhY2tldHMuXG4gICAgICAgICAgICAgICAgdiA9IHBhcnRpYWwubGVuZ3RoID09PSAwID8gJ1tdJyA6IGdhcCA/XG4gICAgICAgICAgICAgICAgICAgICdbXFxuJyArIGdhcCArIHBhcnRpYWwuam9pbignLFxcbicgKyBnYXApICsgJ1xcbicgKyBtaW5kICsgJ10nIDpcbiAgICAgICAgICAgICAgICAgICAgJ1snICsgcGFydGlhbC5qb2luKCcsJykgKyAnXSc7XG4gICAgICAgICAgICAgICAgZ2FwID0gbWluZDtcbiAgICAgICAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gSWYgdGhlIHJlcGxhY2VyIGlzIGFuIGFycmF5LCB1c2UgaXQgdG8gc2VsZWN0IHRoZSBtZW1iZXJzIHRvIGJlXG4gICAgICAgICAgICAvLyBzdHJpbmdpZmllZC5cbiAgICAgICAgICAgIGlmIChyZXAgJiYgdHlwZW9mIHJlcCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBsZW5ndGggPSByZXAubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBrID0gcmVwW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGsgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2ID0gc3RyKGssIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFydGlhbC5wdXNoKHF1b3RlKGspICsgKGdhcCA/ICc6ICcgOiAnOicpICsgdik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBPdGhlcndpc2UsIGl0ZXJhdGUgdGhyb3VnaCBhbGwgb2YgdGhlIGtleXMgaW4gdGhlIG9iamVjdC5cbiAgICAgICAgICAgICAgICBmb3IgKGsgaW4gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgaykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHYgPSBzdHIoaywgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJ0aWFsLnB1c2gocXVvdGUoaykgKyAoZ2FwID8gJzogJyA6ICc6JykgKyB2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAvLyBKb2luIGFsbCBvZiB0aGUgbWVtYmVyIHRleHRzIHRvZ2V0aGVyLCBzZXBhcmF0ZWQgd2l0aCBjb21tYXMsXG4gICAgICAgIC8vIGFuZCB3cmFwIHRoZW0gaW4gYnJhY2VzLlxuXG4gICAgICAgIHYgPSBwYXJ0aWFsLmxlbmd0aCA9PT0gMCA/ICd7fScgOiBnYXAgP1xuICAgICAgICAgICAgJ3tcXG4nICsgZ2FwICsgcGFydGlhbC5qb2luKCcsXFxuJyArIGdhcCkgKyAnXFxuJyArIG1pbmQgKyAnfScgOlxuICAgICAgICAgICAgJ3snICsgcGFydGlhbC5qb2luKCcsJykgKyAnfSc7XG4gICAgICAgIGdhcCA9IG1pbmQ7XG4gICAgICAgIHJldHVybiB2O1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsdWUsIHJlcGxhY2VyLCBzcGFjZSkge1xuICAgIHZhciBpO1xuICAgIGdhcCA9ICcnO1xuICAgIGluZGVudCA9ICcnO1xuICAgIFxuICAgIC8vIElmIHRoZSBzcGFjZSBwYXJhbWV0ZXIgaXMgYSBudW1iZXIsIG1ha2UgYW4gaW5kZW50IHN0cmluZyBjb250YWluaW5nIHRoYXRcbiAgICAvLyBtYW55IHNwYWNlcy5cbiAgICBpZiAodHlwZW9mIHNwYWNlID09PSAnbnVtYmVyJykge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc3BhY2U7IGkgKz0gMSkge1xuICAgICAgICAgICAgaW5kZW50ICs9ICcgJztcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBJZiB0aGUgc3BhY2UgcGFyYW1ldGVyIGlzIGEgc3RyaW5nLCBpdCB3aWxsIGJlIHVzZWQgYXMgdGhlIGluZGVudCBzdHJpbmcuXG4gICAgZWxzZSBpZiAodHlwZW9mIHNwYWNlID09PSAnc3RyaW5nJykge1xuICAgICAgICBpbmRlbnQgPSBzcGFjZTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBpcyBhIHJlcGxhY2VyLCBpdCBtdXN0IGJlIGEgZnVuY3Rpb24gb3IgYW4gYXJyYXkuXG4gICAgLy8gT3RoZXJ3aXNlLCB0aHJvdyBhbiBlcnJvci5cbiAgICByZXAgPSByZXBsYWNlcjtcbiAgICBpZiAocmVwbGFjZXIgJiYgdHlwZW9mIHJlcGxhY2VyICE9PSAnZnVuY3Rpb24nXG4gICAgJiYgKHR5cGVvZiByZXBsYWNlciAhPT0gJ29iamVjdCcgfHwgdHlwZW9mIHJlcGxhY2VyLmxlbmd0aCAhPT0gJ251bWJlcicpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSlNPTi5zdHJpbmdpZnknKTtcbiAgICB9XG4gICAgXG4gICAgLy8gTWFrZSBhIGZha2Ugcm9vdCBvYmplY3QgY29udGFpbmluZyBvdXIgdmFsdWUgdW5kZXIgdGhlIGtleSBvZiAnJy5cbiAgICAvLyBSZXR1cm4gdGhlIHJlc3VsdCBvZiBzdHJpbmdpZnlpbmcgdGhlIHZhbHVlLlxuICAgIHJldHVybiBzdHIoJycsIHsnJzogdmFsdWV9KTtcbn07XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuNi4zXG4oZnVuY3Rpb24oKSB7XG4gIHZhciBEZWZlcnJlZCwgUEVORElORywgUkVKRUNURUQsIFJFU09MVkVELCBWRVJTSU9OLCBhZnRlciwgZXhlY3V0ZSwgZmxhdHRlbiwgaGFzLCBpbnN0YWxsSW50bywgaXNBcmd1bWVudHMsIGlzUHJvbWlzZSwgd3JhcCwgX3doZW4sXG4gICAgX19zbGljZSA9IFtdLnNsaWNlO1xuXG4gIFZFUlNJT04gPSAnMy4wLjAnO1xuXG4gIFBFTkRJTkcgPSBcInBlbmRpbmdcIjtcblxuICBSRVNPTFZFRCA9IFwicmVzb2x2ZWRcIjtcblxuICBSRUpFQ1RFRCA9IFwicmVqZWN0ZWRcIjtcblxuICBoYXMgPSBmdW5jdGlvbihvYmosIHByb3ApIHtcbiAgICByZXR1cm4gb2JqICE9IG51bGwgPyBvYmouaGFzT3duUHJvcGVydHkocHJvcCkgOiB2b2lkIDA7XG4gIH07XG5cbiAgaXNBcmd1bWVudHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gaGFzKG9iaiwgJ2xlbmd0aCcpICYmIGhhcyhvYmosICdjYWxsZWUnKTtcbiAgfTtcblxuICBpc1Byb21pc2UgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gaGFzKG9iaiwgJ3Byb21pc2UnKSAmJiB0eXBlb2YgKG9iaiAhPSBudWxsID8gb2JqLnByb21pc2UgOiB2b2lkIDApID09PSAnZnVuY3Rpb24nO1xuICB9O1xuXG4gIGZsYXR0ZW4gPSBmdW5jdGlvbihhcnJheSkge1xuICAgIGlmIChpc0FyZ3VtZW50cyhhcnJheSkpIHtcbiAgICAgIHJldHVybiBmbGF0dGVuKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFycmF5KSk7XG4gICAgfVxuICAgIGlmICghQXJyYXkuaXNBcnJheShhcnJheSkpIHtcbiAgICAgIHJldHVybiBbYXJyYXldO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXkucmVkdWNlKGZ1bmN0aW9uKG1lbW8sIHZhbHVlKSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIG1lbW8uY29uY2F0KGZsYXR0ZW4odmFsdWUpKTtcbiAgICAgIH1cbiAgICAgIG1lbW8ucHVzaCh2YWx1ZSk7XG4gICAgICByZXR1cm4gbWVtbztcbiAgICB9LCBbXSk7XG4gIH07XG5cbiAgYWZ0ZXIgPSBmdW5jdGlvbih0aW1lcywgZnVuYykge1xuICAgIGlmICh0aW1lcyA8PSAwKSB7XG4gICAgICByZXR1cm4gZnVuYygpO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoLS10aW1lcyA8IDEpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICB9O1xuICB9O1xuXG4gIHdyYXAgPSBmdW5jdGlvbihmdW5jLCB3cmFwcGVyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3M7XG4gICAgICBhcmdzID0gW2Z1bmNdLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTtcbiAgICAgIHJldHVybiB3cmFwcGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH07XG4gIH07XG5cbiAgZXhlY3V0ZSA9IGZ1bmN0aW9uKGNhbGxiYWNrcywgYXJncywgY29udGV4dCkge1xuICAgIHZhciBjYWxsYmFjaywgX2ksIF9sZW4sIF9yZWYsIF9yZXN1bHRzO1xuICAgIF9yZWYgPSBmbGF0dGVuKGNhbGxiYWNrcyk7XG4gICAgX3Jlc3VsdHMgPSBbXTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIGNhbGxiYWNrID0gX3JlZltfaV07XG4gICAgICBfcmVzdWx0cy5wdXNoKGNhbGxiYWNrLmNhbGwuYXBwbHkoY2FsbGJhY2ssIFtjb250ZXh0XS5jb25jYXQoX19zbGljZS5jYWxsKGFyZ3MpKSkpO1xuICAgIH1cbiAgICByZXR1cm4gX3Jlc3VsdHM7XG4gIH07XG5cbiAgRGVmZXJyZWQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgY2FuZGlkYXRlLCBjbG9zZSwgY2xvc2luZ0FyZ3VtZW50cywgZG9uZUNhbGxiYWNrcywgZmFpbENhbGxiYWNrcywgcHJvZ3Jlc3NDYWxsYmFja3MsIHN0YXRlO1xuICAgIHN0YXRlID0gUEVORElORztcbiAgICBkb25lQ2FsbGJhY2tzID0gW107XG4gICAgZmFpbENhbGxiYWNrcyA9IFtdO1xuICAgIHByb2dyZXNzQ2FsbGJhY2tzID0gW107XG4gICAgY2xvc2luZ0FyZ3VtZW50cyA9IHtcbiAgICAgICdyZXNvbHZlZCc6IHt9LFxuICAgICAgJ3JlamVjdGVkJzoge30sXG4gICAgICAncGVuZGluZyc6IHt9XG4gICAgfTtcbiAgICB0aGlzLnByb21pc2UgPSBmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgICAgIHZhciBwaXBlLCBzdG9yZUNhbGxiYWNrcztcbiAgICAgIGNhbmRpZGF0ZSA9IGNhbmRpZGF0ZSB8fCB7fTtcbiAgICAgIGNhbmRpZGF0ZS5zdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICB9O1xuICAgICAgc3RvcmVDYWxsYmFja3MgPSBmdW5jdGlvbihzaG91bGRFeGVjdXRlSW1tZWRpYXRlbHksIGhvbGRlciwgaG9sZGVyU3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChzdGF0ZSA9PT0gUEVORElORykge1xuICAgICAgICAgICAgaG9sZGVyLnB1c2guYXBwbHkoaG9sZGVyLCBmbGF0dGVuKGFyZ3VtZW50cykpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc2hvdWxkRXhlY3V0ZUltbWVkaWF0ZWx5KCkpIHtcbiAgICAgICAgICAgIGV4ZWN1dGUoYXJndW1lbnRzLCBjbG9zaW5nQXJndW1lbnRzW2hvbGRlclN0YXRlXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBjYW5kaWRhdGU7XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgICAgY2FuZGlkYXRlLmRvbmUgPSBzdG9yZUNhbGxiYWNrcygoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZSA9PT0gUkVTT0xWRUQ7XG4gICAgICB9KSwgZG9uZUNhbGxiYWNrcywgUkVTT0xWRUQpO1xuICAgICAgY2FuZGlkYXRlLmZhaWwgPSBzdG9yZUNhbGxiYWNrcygoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZSA9PT0gUkVKRUNURUQ7XG4gICAgICB9KSwgZmFpbENhbGxiYWNrcywgUkVKRUNURUQpO1xuICAgICAgY2FuZGlkYXRlLnByb2dyZXNzID0gc3RvcmVDYWxsYmFja3MoKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc3RhdGUgIT09IFBFTkRJTkc7XG4gICAgICB9KSwgcHJvZ3Jlc3NDYWxsYmFja3MsIFBFTkRJTkcpO1xuICAgICAgY2FuZGlkYXRlLmFsd2F5cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgX3JlZjtcbiAgICAgICAgcmV0dXJuIChfcmVmID0gY2FuZGlkYXRlLmRvbmUuYXBwbHkoY2FuZGlkYXRlLCBhcmd1bWVudHMpKS5mYWlsLmFwcGx5KF9yZWYsIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgICAgcGlwZSA9IGZ1bmN0aW9uKGRvbmVGaWx0ZXIsIGZhaWxGaWx0ZXIsIHByb2dyZXNzRmlsdGVyKSB7XG4gICAgICAgIHZhciBmaWx0ZXIsIG1hc3RlcjtcbiAgICAgICAgbWFzdGVyID0gbmV3IERlZmVycmVkKCk7XG4gICAgICAgIGZpbHRlciA9IGZ1bmN0aW9uKHNvdXJjZSwgZnVubmVsLCBjYWxsYmFjaykge1xuICAgICAgICAgIGlmICghY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBjYW5kaWRhdGVbc291cmNlXShtYXN0ZXJbZnVubmVsXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBjYW5kaWRhdGVbc291cmNlXShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBhcmdzLCB2YWx1ZTtcbiAgICAgICAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgICAgICAgdmFsdWUgPSBjYWxsYmFjay5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICAgIGlmIChpc1Byb21pc2UodmFsdWUpKSB7XG4gICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5kb25lKG1hc3Rlci5yZXNvbHZlKS5mYWlsKG1hc3Rlci5yZWplY3QpLnByb2dyZXNzKG1hc3Rlci5ub3RpZnkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG1hc3RlcltmdW5uZWxdKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgZmlsdGVyKCdkb25lJywgJ3Jlc29sdmUnLCBkb25lRmlsdGVyKTtcbiAgICAgICAgZmlsdGVyKCdmYWlsJywgJ3JlamVjdCcsIGZhaWxGaWx0ZXIpO1xuICAgICAgICBmaWx0ZXIoJ3Byb2dyZXNzJywgJ25vdGlmeScsIHByb2dyZXNzRmlsdGVyKTtcbiAgICAgICAgcmV0dXJuIG1hc3RlcjtcbiAgICAgIH07XG4gICAgICBjYW5kaWRhdGUucGlwZSA9IHBpcGU7XG4gICAgICBjYW5kaWRhdGUudGhlbiA9IHBpcGU7XG4gICAgICBpZiAoY2FuZGlkYXRlLnByb21pc2UgPT0gbnVsbCkge1xuICAgICAgICBjYW5kaWRhdGUucHJvbWlzZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBjYW5kaWRhdGU7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4gY2FuZGlkYXRlO1xuICAgIH07XG4gICAgdGhpcy5wcm9taXNlKHRoaXMpO1xuICAgIGNhbmRpZGF0ZSA9IHRoaXM7XG4gICAgY2xvc2UgPSBmdW5jdGlvbihmaW5hbFN0YXRlLCBjYWxsYmFja3MsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHN0YXRlID09PSBQRU5ESU5HKSB7XG4gICAgICAgICAgc3RhdGUgPSBmaW5hbFN0YXRlO1xuICAgICAgICAgIGNsb3NpbmdBcmd1bWVudHNbZmluYWxTdGF0ZV0gPSBhcmd1bWVudHM7XG4gICAgICAgICAgZXhlY3V0ZShjYWxsYmFja3MsIGNsb3NpbmdBcmd1bWVudHNbZmluYWxTdGF0ZV0sIGNvbnRleHQpO1xuICAgICAgICAgIHJldHVybiBjYW5kaWRhdGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9O1xuICAgIH07XG4gICAgdGhpcy5yZXNvbHZlID0gY2xvc2UoUkVTT0xWRUQsIGRvbmVDYWxsYmFja3MpO1xuICAgIHRoaXMucmVqZWN0ID0gY2xvc2UoUkVKRUNURUQsIGZhaWxDYWxsYmFja3MpO1xuICAgIHRoaXMubm90aWZ5ID0gY2xvc2UoUEVORElORywgcHJvZ3Jlc3NDYWxsYmFja3MpO1xuICAgIHRoaXMucmVzb2x2ZVdpdGggPSBmdW5jdGlvbihjb250ZXh0LCBhcmdzKSB7XG4gICAgICByZXR1cm4gY2xvc2UoUkVTT0xWRUQsIGRvbmVDYWxsYmFja3MsIGNvbnRleHQpLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgIH07XG4gICAgdGhpcy5yZWplY3RXaXRoID0gZnVuY3Rpb24oY29udGV4dCwgYXJncykge1xuICAgICAgcmV0dXJuIGNsb3NlKFJFSkVDVEVELCBmYWlsQ2FsbGJhY2tzLCBjb250ZXh0KS5hcHBseShudWxsLCBhcmdzKTtcbiAgICB9O1xuICAgIHRoaXMubm90aWZ5V2l0aCA9IGZ1bmN0aW9uKGNvbnRleHQsIGFyZ3MpIHtcbiAgICAgIHJldHVybiBjbG9zZShQRU5ESU5HLCBwcm9ncmVzc0NhbGxiYWNrcywgY29udGV4dCkuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBfd2hlbiA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBkZWYsIGRlZnMsIGZpbmlzaCwgcmVzb2x1dGlvbkFyZ3MsIHRyaWdnZXIsIF9pLCBfbGVuO1xuICAgIGRlZnMgPSBmbGF0dGVuKGFyZ3VtZW50cyk7XG4gICAgaWYgKGRlZnMubGVuZ3RoID09PSAxKSB7XG4gICAgICBpZiAoaXNQcm9taXNlKGRlZnNbMF0pKSB7XG4gICAgICAgIHJldHVybiBkZWZzWzBdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIChuZXcgRGVmZXJyZWQoKSkucmVzb2x2ZShkZWZzWzBdKS5wcm9taXNlKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRyaWdnZXIgPSBuZXcgRGVmZXJyZWQoKTtcbiAgICBpZiAoIWRlZnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdHJpZ2dlci5yZXNvbHZlKCkucHJvbWlzZSgpO1xuICAgIH1cbiAgICByZXNvbHV0aW9uQXJncyA9IFtdO1xuICAgIGZpbmlzaCA9IGFmdGVyKGRlZnMubGVuZ3RoLCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0cmlnZ2VyLnJlc29sdmUuYXBwbHkodHJpZ2dlciwgcmVzb2x1dGlvbkFyZ3MpO1xuICAgIH0pO1xuICAgIGRlZnMuZm9yRWFjaChmdW5jdGlvbihkZWYsIGluZGV4KSB7XG4gICAgICBpZiAoaXNQcm9taXNlKGRlZikpIHtcbiAgICAgICAgcmV0dXJuIGRlZi5kb25lKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBhcmdzO1xuICAgICAgICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgICAgICAgIHJlc29sdXRpb25BcmdzW2luZGV4XSA9IGFyZ3MubGVuZ3RoID4gMSA/IGFyZ3MgOiBhcmdzWzBdO1xuICAgICAgICAgIHJldHVybiBmaW5pc2goKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHV0aW9uQXJnc1tpbmRleF0gPSBkZWY7XG4gICAgICAgIHJldHVybiBmaW5pc2goKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGRlZnMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIGRlZiA9IGRlZnNbX2ldO1xuICAgICAgaXNQcm9taXNlKGRlZikgJiYgZGVmLmZhaWwodHJpZ2dlci5yZWplY3QpO1xuICAgIH1cbiAgICByZXR1cm4gdHJpZ2dlci5wcm9taXNlKCk7XG4gIH07XG5cbiAgaW5zdGFsbEludG8gPSBmdW5jdGlvbihmdykge1xuICAgIGZ3LkRlZmVycmVkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IERlZmVycmVkKCk7XG4gICAgfTtcbiAgICBmdy5hamF4ID0gd3JhcChmdy5hamF4LCBmdW5jdGlvbihhamF4LCBvcHRpb25zKSB7XG4gICAgICB2YXIgY3JlYXRlV3JhcHBlciwgZGVmLCBwcm9taXNlLCB4aHI7XG4gICAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgIH1cbiAgICAgIGRlZiA9IG5ldyBEZWZlcnJlZCgpO1xuICAgICAgY3JlYXRlV3JhcHBlciA9IGZ1bmN0aW9uKHdyYXBwZWQsIGZpbmlzaGVyKSB7XG4gICAgICAgIHJldHVybiB3cmFwKHdyYXBwZWQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBhcmdzLCBmdW5jO1xuICAgICAgICAgIGZ1bmMgPSBhcmd1bWVudHNbMF0sIGFyZ3MgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuICAgICAgICAgIGlmIChmdW5jKSB7XG4gICAgICAgICAgICBmdW5jLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmluaXNoZXIuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgIG9wdGlvbnMuc3VjY2VzcyA9IGNyZWF0ZVdyYXBwZXIob3B0aW9ucy5zdWNjZXNzLCBkZWYucmVzb2x2ZSk7XG4gICAgICBvcHRpb25zLmVycm9yID0gY3JlYXRlV3JhcHBlcihvcHRpb25zLmVycm9yLCBkZWYucmVqZWN0KTtcbiAgICAgIHhociA9IGFqYXgob3B0aW9ucyk7XG4gICAgICBwcm9taXNlID0gZGVmLnByb21pc2UoKTtcbiAgICAgIHByb21pc2UuYWJvcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHhoci5hYm9ydCgpO1xuICAgICAgfTtcbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH0pO1xuICAgIHJldHVybiBmdy53aGVuID0gX3doZW47XG4gIH07XG5cbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGV4cG9ydHMuRGVmZXJyZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgRGVmZXJyZWQoKTtcbiAgICB9O1xuICAgIGV4cG9ydHMud2hlbiA9IF93aGVuO1xuICAgIGV4cG9ydHMuaW5zdGFsbEludG8gPSBpbnN0YWxsSW50bztcbiAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodHlwZW9mIFplcHRvICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gaW5zdGFsbEludG8oWmVwdG8pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgRGVmZXJyZWQud2hlbiA9IF93aGVuO1xuICAgICAgICBEZWZlcnJlZC5pbnN0YWxsSW50byA9IGluc3RhbGxJbnRvO1xuICAgICAgICByZXR1cm4gRGVmZXJyZWQ7XG4gICAgICB9XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIFplcHRvICE9PSAndW5kZWZpbmVkJykge1xuICAgIGluc3RhbGxJbnRvKFplcHRvKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLkRlZmVycmVkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IERlZmVycmVkKCk7XG4gICAgfTtcbiAgICB0aGlzLkRlZmVycmVkLndoZW4gPSBfd2hlbjtcbiAgICB0aGlzLkRlZmVycmVkLmluc3RhbGxJbnRvID0gaW5zdGFsbEludG87XG4gIH1cblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgVGlsZUxheWVyOiByZXF1aXJlKCcuL2xheWVyL2V4cG9ydHMnKSxcbiAgICAgICAgUmVuZGVyZXI6IHJlcXVpcmUoJy4vcmVuZGVyZXIvZXhwb3J0cycpLFxuICAgICAgICBUaWxlUmVxdWVzdG9yOiByZXF1aXJlKCcuL3JlcXVlc3QvVGlsZVJlcXVlc3RvcicpLFxuICAgICAgICBNZXRhUmVxdWVzdG9yOiByZXF1aXJlKCcuL3JlcXVlc3QvTWV0YVJlcXVlc3RvcicpXG4gICAgfTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBJbWFnZSA9IHJlcXVpcmUoJy4vSW1hZ2UnKTtcblxuICAgIHZhciBEZWJ1ZyA9IEltYWdlLmV4dGVuZCh7XG5cbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgdW5sb2FkSW52aXNpYmxlVGlsZXM6IHRydWUsXG4gICAgICAgICAgICB6SW5kZXg6IDUwMDBcbiAgICAgICAgfSxcblxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgICAgICAvLyBzZXQgcmVuZGVyZXJcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5yZW5kZXJlckNsYXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdObyBgcmVuZGVyZXJDbGFzc2Agb3B0aW9uIGZvdW5kLCB0aGlzIGxheWVyIHdpbGwgbm90IHJlbmRlciBhbnkgZGF0YS4nKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gcmVjdXJzaXZlbHkgZXh0ZW5kXG4gICAgICAgICAgICAgICAgJC5leHRlbmQodHJ1ZSwgdGhpcywgb3B0aW9ucy5yZW5kZXJlckNsYXNzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHNldCBvcHRpb25zXG4gICAgICAgICAgICBMLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVkcmF3OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9tYXApIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNldCh7XG4gICAgICAgICAgICAgICAgICAgIGhhcmQ6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZWRyYXdUaWxlOiBmdW5jdGlvbih0aWxlKSB7XG4gICAgICAgICAgICB2YXIgY29vcmQgPSB7XG4gICAgICAgICAgICAgICAgeDogdGlsZS5fdGlsZVBvaW50LngsXG4gICAgICAgICAgICAgICAgeTogdGlsZS5fdGlsZVBvaW50LnksXG4gICAgICAgICAgICAgICAgejogdGhpcy5fbWFwLl96b29tXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJUaWxlKHRpbGUsIGNvb3JkKTtcbiAgICAgICAgICAgIHRoaXMudGlsZURyYXduKHRpbGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9jcmVhdGVUaWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB0aWxlID0gTC5Eb21VdGlsLmNyZWF0ZSgnZGl2JywgJ2xlYWZsZXQtdGlsZSBsZWFmbGV0LWRlYnVnLXRpbGUnKTtcbiAgICAgICAgICAgIHRpbGUud2lkdGggPSB0aGlzLm9wdGlvbnMudGlsZVNpemU7XG4gICAgICAgICAgICB0aWxlLmhlaWdodCA9IHRoaXMub3B0aW9ucy50aWxlU2l6ZTtcbiAgICAgICAgICAgIHRpbGUub25zZWxlY3RzdGFydCA9IEwuVXRpbC5mYWxzZUZuO1xuICAgICAgICAgICAgdGlsZS5vbm1vdXNlbW92ZSA9IEwuVXRpbC5mYWxzZUZuO1xuICAgICAgICAgICAgcmV0dXJuIHRpbGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2xvYWRUaWxlOiBmdW5jdGlvbih0aWxlLCB0aWxlUG9pbnQpIHtcbiAgICAgICAgICAgIHRpbGUuX2xheWVyID0gdGhpcztcbiAgICAgICAgICAgIHRpbGUuX3RpbGVQb2ludCA9IHRpbGVQb2ludDtcbiAgICAgICAgICAgIHRoaXMuX2FkanVzdFRpbGVQb2ludCh0aWxlUG9pbnQpO1xuICAgICAgICAgICAgdGhpcy5fcmVkcmF3VGlsZSh0aWxlKTtcbiAgICAgICAgfSxcblxuICAgICAgICByZW5kZXJUaWxlOiBmdW5jdGlvbiggLyplbGVtLCBjb29yZCovICkge1xuICAgICAgICAgICAgLy8gb3ZlcnJpZGVcbiAgICAgICAgfSxcblxuICAgICAgICB0aWxlRHJhd246IGZ1bmN0aW9uKHRpbGUpIHtcbiAgICAgICAgICAgIHRoaXMuX3RpbGVPbkxvYWQuY2FsbCh0aWxlKTtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IERlYnVnO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIEltYWdlID0gTC5UaWxlTGF5ZXIuZXh0ZW5kKHtcblxuICAgICAgICBnZXRPcGFjaXR5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMub3BhY2l0eTtcbiAgICAgICAgfSxcblxuICAgICAgICBzaG93OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX2hpZGRlbiA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5fcHJldk1hcC5hZGRMYXllcih0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBoaWRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX2hpZGRlbiA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLl9wcmV2TWFwID0gdGhpcy5fbWFwO1xuICAgICAgICAgICAgdGhpcy5fbWFwLnJlbW92ZUxheWVyKHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzSGlkZGVuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9oaWRkZW47XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0QnJpZ2h0bmVzczogZnVuY3Rpb24oYnJpZ2h0bmVzcykge1xuICAgICAgICAgICAgdGhpcy5fYnJpZ2h0bmVzcyA9IGJyaWdodG5lc3M7XG4gICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikuY3NzKCctd2Via2l0LWZpbHRlcicsICdicmlnaHRuZXNzKCcgKyAodGhpcy5fYnJpZ2h0bmVzcyAqIDEwMCkgKyAnJSknKTtcbiAgICAgICAgICAgICQodGhpcy5fY29udGFpbmVyKS5jc3MoJ2ZpbHRlcicsICdicmlnaHRuZXNzKCcgKyAodGhpcy5fYnJpZ2h0bmVzcyAqIDEwMCkgKyAnJSknKTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRCcmlnaHRuZXNzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAodGhpcy5fYnJpZ2h0bmVzcyAhPT0gdW5kZWZpbmVkKSA/IHRoaXMuX2JyaWdodG5lc3MgOiAxO1xuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gSW1hZ2U7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgTUlOID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICB2YXIgTUFYID0gMDtcblxuICAgIHZhciBMaXZlID0gTC5DbGFzcy5leHRlbmQoe1xuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG1ldGEsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vIHNldCByZW5kZXJlclxuICAgICAgICAgICAgaWYgKCFvcHRpb25zLnJlbmRlcmVyQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ05vIGByZW5kZXJlckNsYXNzYCBvcHRpb24gZm91bmQsIHRoaXMgbGF5ZXIgd2lsbCBub3QgcmVuZGVyIGFueSBkYXRhLicpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyByZWN1cnNpdmVseSBleHRlbmQgYW5kIGluaXRpYWxpemVcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5yZW5kZXJlckNsYXNzLnByb3RvdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCB0aGlzLCBvcHRpb25zLnJlbmRlcmVyQ2xhc3MucHJvdG90eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5yZW5kZXJlckNsYXNzLnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJC5leHRlbmQodHJ1ZSwgdGhpcywgb3B0aW9ucy5yZW5kZXJlckNsYXNzKTtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5yZW5kZXJlckNsYXNzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBzZXQgb3B0aW9uc1xuICAgICAgICAgICAgTC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgLy8gc2V0IG1ldGFcbiAgICAgICAgICAgIHRoaXMuX21ldGEgPSBtZXRhO1xuICAgICAgICAgICAgLy8gc2V0IHBhcmFtc1xuICAgICAgICAgICAgdGhpcy5fcGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIGJpbm5pbmc6IHt9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjbGVhckV4dHJlbWE6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5fZXh0cmVtYSA9IHtcbiAgICAgICAgICAgICAgICBtaW46IE1JTixcbiAgICAgICAgICAgICAgICBtYXg6IE1BWFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuX2NhY2hlID0ge307XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0RXh0cmVtYTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZXh0cmVtYTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVFeHRyZW1hOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB2YXIgZXh0cmVtYSA9IHRoaXMuZXh0cmFjdEV4dHJlbWEoZGF0YSk7XG4gICAgICAgICAgICB2YXIgY2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKGV4dHJlbWEubWluIDwgdGhpcy5fZXh0cmVtYS5taW4pIHtcbiAgICAgICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9leHRyZW1hLm1pbiA9IGV4dHJlbWEubWluO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGV4dHJlbWEubWF4ID4gdGhpcy5fZXh0cmVtYS5tYXgpIHtcbiAgICAgICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9leHRyZW1hLm1heCA9IGV4dHJlbWEubWF4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNoYW5nZWQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZXh0cmFjdEV4dHJlbWE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbWluOiBfLm1pbihkYXRhKSxcbiAgICAgICAgICAgICAgICBtYXg6IF8ubWF4KGRhdGEpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldE1ldGE6IGZ1bmN0aW9uKG1ldGEpIHtcbiAgICAgICAgICAgIHRoaXMuX21ldGEgPSBtZXRhO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0TWV0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbWV0YTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRQYXJhbXM6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICAgICAgdGhpcy5fcGFyYW1zID0gcGFyYW1zO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldFBhcmFtczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGFyYW1zO1xuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gTGl2ZTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBJbWFnZSA9IHJlcXVpcmUoJy4vSW1hZ2UnKTtcblxuICAgIHZhciBQZW5kaW5nID0gSW1hZ2UuZXh0ZW5kKHtcblxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICB1bmxvYWRJbnZpc2libGVUaWxlczogdHJ1ZSxcbiAgICAgICAgICAgIHpJbmRleDogNTAwMFxuICAgICAgICB9LFxuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdUaWxlcyA9IHt9O1xuICAgICAgICAgICAgLy8gc2V0IHJlbmRlcmVyXG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMucmVuZGVyZXJDbGFzcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignTm8gYHJlbmRlcmVyQ2xhc3NgIG9wdGlvbiBmb3VuZCwgdGhpcyBsYXllciB3aWxsIG5vdCByZW5kZXIgYW55IGRhdGEuJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHJlY3Vyc2l2ZWx5IGV4dGVuZFxuICAgICAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIHRoaXMsIG9wdGlvbnMucmVuZGVyZXJDbGFzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBzZXQgb3B0aW9uc1xuICAgICAgICAgICAgTC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGluY3JlbWVudDogZnVuY3Rpb24oY29vcmQpIHtcbiAgICAgICAgICAgIHZhciBoYXNoID0gdGhpcy5fZ2V0VGlsZUhhc2goY29vcmQpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3BlbmRpbmdUaWxlc1toYXNoXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGVuZGluZ1RpbGVzW2hhc2hdID0gMTtcbiAgICAgICAgICAgICAgICB2YXIgdGlsZXMgPSB0aGlzLl9nZXRUaWxlc1dpdGhIYXNoKGhhc2gpO1xuICAgICAgICAgICAgICAgIHRpbGVzLmZvckVhY2goZnVuY3Rpb24odGlsZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZWRyYXdUaWxlKHRpbGUpO1xuICAgICAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wZW5kaW5nVGlsZXNbaGFzaF0rKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBkZWNyZW1lbnQ6IGZ1bmN0aW9uKGNvb3JkKSB7XG4gICAgICAgICAgICB2YXIgaGFzaCA9IHRoaXMuX2dldFRpbGVIYXNoKGNvb3JkKTtcbiAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdUaWxlc1toYXNoXS0tO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3BlbmRpbmdUaWxlc1toYXNoXSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9wZW5kaW5nVGlsZXNbaGFzaF07XG4gICAgICAgICAgICAgICAgdmFyIHRpbGVzID0gdGhpcy5fZ2V0VGlsZXNXaXRoSGFzaChoYXNoKTtcbiAgICAgICAgICAgICAgICB0aWxlcy5mb3JFYWNoKGZ1bmN0aW9uKHRpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVkcmF3VGlsZSh0aWxlKTtcbiAgICAgICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICByZWRyYXc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX21hcCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2V0KHtcbiAgICAgICAgICAgICAgICAgICAgaGFyZDogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2dldFRpbGVDbGFzczogZnVuY3Rpb24oaGFzaCkge1xuICAgICAgICAgICAgcmV0dXJuICdwZW5kaW5nLScgKyBoYXNoO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9nZXRUaWxlSGFzaDogZnVuY3Rpb24oY29vcmQpIHtcbiAgICAgICAgICAgIHJldHVybiBjb29yZC56ICsgJy0nICsgY29vcmQueCArICctJyArIGNvb3JkLnk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2dldFRpbGVzV2l0aEhhc2g6IGZ1bmN0aW9uKGhhc2gpIHtcbiAgICAgICAgICAgIHZhciBjbGFzc05hbWUgPSB0aGlzLl9nZXRUaWxlQ2xhc3MoaGFzaCk7XG4gICAgICAgICAgICB2YXIgdGlsZXMgPSBbXTtcbiAgICAgICAgICAgICQodGhpcy5fY29udGFpbmVyKS5maW5kKCcuJyArIGNsYXNzTmFtZSkuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aWxlcy5wdXNoKHRoaXMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gdGlsZXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3JlZHJhd1RpbGU6IGZ1bmN0aW9uKHRpbGUpIHtcbiAgICAgICAgICAgIHZhciBjb29yZCA9IHtcbiAgICAgICAgICAgICAgICB4OiB0aWxlLl90aWxlUG9pbnQueCxcbiAgICAgICAgICAgICAgICB5OiB0aWxlLl90aWxlUG9pbnQueSxcbiAgICAgICAgICAgICAgICB6OiB0aGlzLl9tYXAuX3pvb21cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgaGFzaCA9IHRoaXMuX2dldFRpbGVIYXNoKGNvb3JkKTtcbiAgICAgICAgICAgICQodGlsZSkuYWRkQ2xhc3ModGhpcy5fZ2V0VGlsZUNsYXNzKGhhc2gpKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9wZW5kaW5nVGlsZXNbaGFzaF0gPiAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJUaWxlKHRpbGUsIGNvb3JkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGlsZS5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMudGlsZURyYXduKHRpbGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9jcmVhdGVUaWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB0aWxlID0gTC5Eb21VdGlsLmNyZWF0ZSgnZGl2JywgJ2xlYWZsZXQtdGlsZSBsZWFmbGV0LXBlbmRpbmctdGlsZScpO1xuICAgICAgICAgICAgdGlsZS53aWR0aCA9IHRoaXMub3B0aW9ucy50aWxlU2l6ZTtcbiAgICAgICAgICAgIHRpbGUuaGVpZ2h0ID0gdGhpcy5vcHRpb25zLnRpbGVTaXplO1xuICAgICAgICAgICAgdGlsZS5vbnNlbGVjdHN0YXJ0ID0gTC5VdGlsLmZhbHNlRm47XG4gICAgICAgICAgICB0aWxlLm9ubW91c2Vtb3ZlID0gTC5VdGlsLmZhbHNlRm47XG4gICAgICAgICAgICByZXR1cm4gdGlsZTtcbiAgICAgICAgfSxcblxuICAgICAgICBfbG9hZFRpbGU6IGZ1bmN0aW9uKHRpbGUsIHRpbGVQb2ludCkge1xuICAgICAgICAgICAgdGlsZS5fbGF5ZXIgPSB0aGlzO1xuICAgICAgICAgICAgdGlsZS5fdGlsZVBvaW50ID0gdGlsZVBvaW50O1xuICAgICAgICAgICAgdGhpcy5fYWRqdXN0VGlsZVBvaW50KHRpbGVQb2ludCk7XG4gICAgICAgICAgICB0aGlzLl9yZWRyYXdUaWxlKHRpbGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlbmRlclRpbGU6IGZ1bmN0aW9uKCAvKmVsZW0qLyApIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRlXG4gICAgICAgIH0sXG5cbiAgICAgICAgdGlsZURyYXduOiBmdW5jdGlvbih0aWxlKSB7XG4gICAgICAgICAgICB0aGlzLl90aWxlT25Mb2FkLmNhbGwodGlsZSk7XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBQZW5kaW5nO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gZGVidWcgdGlsZSBsYXllclxuICAgIHZhciBEZWJ1ZyA9IHJlcXVpcmUoJy4vY29yZS9EZWJ1ZycpO1xuXG4gICAgLy8gcGVuZGluZyB0aWxlIGxheWVyXG4gICAgdmFyIFBlbmRpbmcgPSByZXF1aXJlKCcuL2NvcmUvUGVuZGluZycpO1xuXG4gICAgLy8gc3RhbmRhcmQgWFlaIC8gVE1YIGltYWdlIGxheWVyXG4gICAgdmFyIEltYWdlID0gcmVxdWlyZSgnLi9jb3JlL0ltYWdlJyk7XG5cbiAgICAvLyBsaXZlIHRpbGUgbGF5ZXJzXG4gICAgdmFyIEhlYXRtYXAgPSByZXF1aXJlKCcuL3R5cGVzL0hlYXRtYXAnKTtcbiAgICB2YXIgVG9wQ291bnQgPSByZXF1aXJlKCcuL3R5cGVzL1RvcENvdW50Jyk7XG4gICAgdmFyIFRvcEZyZXF1ZW5jeSA9IHJlcXVpcmUoJy4vdHlwZXMvVG9wRnJlcXVlbmN5Jyk7XG4gICAgdmFyIFRvcGljQ291bnQgPSByZXF1aXJlKCcuL3R5cGVzL1RvcGljQ291bnQnKTtcbiAgICB2YXIgVG9waWNGcmVxdWVuY3kgPSByZXF1aXJlKCcuL3R5cGVzL1RvcGljRnJlcXVlbmN5Jyk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgRGVidWc6IERlYnVnLFxuICAgICAgICBQZW5kaW5nOiBQZW5kaW5nLFxuICAgICAgICBJbWFnZTogSW1hZ2UsXG4gICAgICAgIEhlYXRtYXA6IEhlYXRtYXAsXG4gICAgICAgIFRvcENvdW50OiBUb3BDb3VudCxcbiAgICAgICAgVG9wRnJlcXVlbmN5OiBUb3BGcmVxdWVuY3ksXG4gICAgICAgIFRvcGljQ291bnQ6IFRvcGljQ291bnQsXG4gICAgICAgIFRvcGljRnJlcXVlbmN5OiBUb3BpY0ZyZXF1ZW5jeVxuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBmdW5jdGlvbiByZ2IybGFiKHJnYikge1xuICAgICAgICB2YXIgciA9IHJnYlswXSA+IDAuMDQwNDUgPyBNYXRoLnBvdygocmdiWzBdICsgMC4wNTUpIC8gMS4wNTUsIDIuNCkgOiByZ2JbMF0gLyAxMi45MjtcbiAgICAgICAgdmFyIGcgPSByZ2JbMV0gPiAwLjA0MDQ1ID8gTWF0aC5wb3coKHJnYlsxXSArIDAuMDU1KSAvIDEuMDU1LCAyLjQpIDogcmdiWzFdIC8gMTIuOTI7XG4gICAgICAgIHZhciBiID0gcmdiWzJdID4gMC4wNDA0NSA/IE1hdGgucG93KChyZ2JbMl0gKyAwLjA1NSkgLyAxLjA1NSwgMi40KSA6IHJnYlsyXSAvIDEyLjkyO1xuICAgICAgICAvL09ic2VydmVyLiA9IDLCsCwgSWxsdW1pbmFudCA9IEQ2NVxuICAgICAgICB2YXIgeCA9IHIgKiAwLjQxMjQ1NjQgKyBnICogMC4zNTc1NzYxICsgYiAqIDAuMTgwNDM3NTtcbiAgICAgICAgdmFyIHkgPSByICogMC4yMTI2NzI5ICsgZyAqIDAuNzE1MTUyMiArIGIgKiAwLjA3MjE3NTA7XG4gICAgICAgIHZhciB6ID0gciAqIDAuMDE5MzMzOSArIGcgKiAwLjExOTE5MjAgKyBiICogMC45NTAzMDQxO1xuICAgICAgICB4ID0geCAvIDAuOTUwNDc7IC8vIE9ic2VydmVyPSAywrAsIElsbHVtaW5hbnQ9IEQ2NVxuICAgICAgICB5ID0geSAvIDEuMDAwMDA7XG4gICAgICAgIHogPSB6IC8gMS4wODg4MztcbiAgICAgICAgeCA9IHggPiAwLjAwODg1NiA/IE1hdGgucG93KHgsIDEgLyAzKSA6ICg3Ljc4NzAzNyAqIHgpICsgKDE2IC8gMTE2KTtcbiAgICAgICAgeSA9IHkgPiAwLjAwODg1NiA/IE1hdGgucG93KHksIDEgLyAzKSA6ICg3Ljc4NzAzNyAqIHkpICsgKDE2IC8gMTE2KTtcbiAgICAgICAgeiA9IHogPiAwLjAwODg1NiA/IE1hdGgucG93KHosIDEgLyAzKSA6ICg3Ljc4NzAzNyAqIHopICsgKDE2IC8gMTE2KTtcbiAgICAgICAgcmV0dXJuIFsoMTE2ICogeSkgLSAxNixcbiAgICAgICAgICAgIDUwMCAqICh4IC0geSksXG4gICAgICAgICAgICAyMDAgKiAoeSAtIHopLFxuICAgICAgICAgICAgcmdiWzNdXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsYWIycmdiKGxhYikge1xuICAgICAgICB2YXIgeSA9IChsYWJbMF0gKyAxNikgLyAxMTY7XG4gICAgICAgIHZhciB4ID0geSArIGxhYlsxXSAvIDUwMDtcbiAgICAgICAgdmFyIHogPSB5IC0gbGFiWzJdIC8gMjAwO1xuICAgICAgICB4ID0geCA+IDAuMjA2ODkzMDM0ID8geCAqIHggKiB4IDogKHggLSA0IC8gMjkpIC8gNy43ODcwMzc7XG4gICAgICAgIHkgPSB5ID4gMC4yMDY4OTMwMzQgPyB5ICogeSAqIHkgOiAoeSAtIDQgLyAyOSkgLyA3Ljc4NzAzNztcbiAgICAgICAgeiA9IHogPiAwLjIwNjg5MzAzNCA/IHogKiB6ICogeiA6ICh6IC0gNCAvIDI5KSAvIDcuNzg3MDM3O1xuICAgICAgICB4ID0geCAqIDAuOTUwNDc7IC8vIE9ic2VydmVyPSAywrAsIElsbHVtaW5hbnQ9IEQ2NVxuICAgICAgICB5ID0geSAqIDEuMDAwMDA7XG4gICAgICAgIHogPSB6ICogMS4wODg4MztcbiAgICAgICAgdmFyIHIgPSB4ICogMy4yNDA0NTQyICsgeSAqIC0xLjUzNzEzODUgKyB6ICogLTAuNDk4NTMxNDtcbiAgICAgICAgdmFyIGcgPSB4ICogLTAuOTY5MjY2MCArIHkgKiAxLjg3NjAxMDggKyB6ICogMC4wNDE1NTYwO1xuICAgICAgICB2YXIgYiA9IHggKiAwLjA1NTY0MzQgKyB5ICogLTAuMjA0MDI1OSArIHogKiAxLjA1NzIyNTI7XG4gICAgICAgIHIgPSByID4gMC4wMDMwNCA/IDEuMDU1ICogTWF0aC5wb3cociwgMSAvIDIuNCkgLSAwLjA1NSA6IDEyLjkyICogcjtcbiAgICAgICAgZyA9IGcgPiAwLjAwMzA0ID8gMS4wNTUgKiBNYXRoLnBvdyhnLCAxIC8gMi40KSAtIDAuMDU1IDogMTIuOTIgKiBnO1xuICAgICAgICBiID0gYiA+IDAuMDAzMDQgPyAxLjA1NSAqIE1hdGgucG93KGIsIDEgLyAyLjQpIC0gMC4wNTUgOiAxMi45MiAqIGI7XG4gICAgICAgIHJldHVybiBbTWF0aC5tYXgoTWF0aC5taW4ociwgMSksIDApLCBNYXRoLm1heChNYXRoLm1pbihnLCAxKSwgMCksIE1hdGgubWF4KE1hdGgubWluKGIsIDEpLCAwKSwgbGFiWzNdXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaXN0YW5jZShjMSwgYzIpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydChcbiAgICAgICAgICAgIChjMVswXSAtIGMyWzBdKSAqIChjMVswXSAtIGMyWzBdKSArXG4gICAgICAgICAgICAoYzFbMV0gLSBjMlsxXSkgKiAoYzFbMV0gLSBjMlsxXSkgK1xuICAgICAgICAgICAgKGMxWzJdIC0gYzJbMl0pICogKGMxWzJdIC0gYzJbMl0pICtcbiAgICAgICAgICAgIChjMVszXSAtIGMyWzNdKSAqIChjMVszXSAtIGMyWzNdKVxuICAgICAgICApO1xuICAgIH1cblxuICAgIHZhciBHUkFESUVOVF9TVEVQUyA9IDIwMDtcblxuICAgIC8vIEludGVycG9sYXRlIGJldHdlZW4gYSBzZXQgb2YgY29sb3JzIHVzaW5nIGV2ZW4gcGVyY2VwdHVhbCBkaXN0YW5jZSBhbmQgaW50ZXJwb2xhdGlvbiBpbiBDSUUgTCphKmIqIHNwYWNlXG4gICAgdmFyIGJ1aWxkUGVyY2VwdHVhbExvb2t1cFRhYmxlID0gZnVuY3Rpb24oYmFzZUNvbG9ycykge1xuICAgICAgICB2YXIgb3V0cHV0R3JhZGllbnQgPSBbXTtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHBlcmNlcHR1YWwgc3ByZWFkIGluIEwqYSpiKiBzcGFjZVxuICAgICAgICB2YXIgbGFicyA9IF8ubWFwKGJhc2VDb2xvcnMsIGZ1bmN0aW9uKGNvbG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gcmdiMmxhYihbY29sb3JbMF0gLyAyNTUsIGNvbG9yWzFdIC8gMjU1LCBjb2xvclsyXSAvIDI1NSwgY29sb3JbM10gLyAyNTVdKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBkaXN0YW5jZXMgPSBfLm1hcChsYWJzLCBmdW5jdGlvbihjb2xvciwgaW5kZXgsIGNvbG9ycykge1xuICAgICAgICAgICAgcmV0dXJuIGluZGV4ID4gMCA/IGRpc3RhbmNlKGNvbG9yLCBjb2xvcnNbaW5kZXggLSAxXSkgOiAwO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIGN1bXVsYXRpdmUgZGlzdGFuY2VzIGluIFswLDFdXG4gICAgICAgIHZhciB0b3RhbERpc3RhbmNlID0gXy5yZWR1Y2UoZGlzdGFuY2VzLCBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYSArIGI7XG4gICAgICAgIH0sIDApO1xuICAgICAgICBkaXN0YW5jZXMgPSBfLm1hcChkaXN0YW5jZXMsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkIC8gdG90YWxEaXN0YW5jZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBkaXN0YW5jZVRyYXZlcnNlZCA9IDA7XG4gICAgICAgIHZhciBrZXkgPSAwO1xuICAgICAgICB2YXIgcHJvZ3Jlc3M7XG4gICAgICAgIHZhciBzdGVwUHJvZ3Jlc3M7XG4gICAgICAgIHZhciByZ2I7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgR1JBRElFTlRfU1RFUFM7IGkrKykge1xuICAgICAgICAgICAgcHJvZ3Jlc3MgPSBpIC8gKEdSQURJRU5UX1NURVBTIC0gMSk7XG4gICAgICAgICAgICBpZiAocHJvZ3Jlc3MgPiBkaXN0YW5jZVRyYXZlcnNlZCArIGRpc3RhbmNlc1trZXkgKyAxXSAmJiBrZXkgKyAxIDwgbGFicy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAga2V5ICs9IDE7XG4gICAgICAgICAgICAgICAgZGlzdGFuY2VUcmF2ZXJzZWQgKz0gZGlzdGFuY2VzW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGVwUHJvZ3Jlc3MgPSAocHJvZ3Jlc3MgLSBkaXN0YW5jZVRyYXZlcnNlZCkgLyBkaXN0YW5jZXNba2V5ICsgMV07XG4gICAgICAgICAgICByZ2IgPSBsYWIycmdiKFtcbiAgICAgICAgICAgICAgICBsYWJzW2tleV1bMF0gKyAobGFic1trZXkgKyAxXVswXSAtIGxhYnNba2V5XVswXSkgKiBzdGVwUHJvZ3Jlc3MsXG4gICAgICAgICAgICAgICAgbGFic1trZXldWzFdICsgKGxhYnNba2V5ICsgMV1bMV0gLSBsYWJzW2tleV1bMV0pICogc3RlcFByb2dyZXNzLFxuICAgICAgICAgICAgICAgIGxhYnNba2V5XVsyXSArIChsYWJzW2tleSArIDFdWzJdIC0gbGFic1trZXldWzJdKSAqIHN0ZXBQcm9ncmVzcyxcbiAgICAgICAgICAgICAgICBsYWJzW2tleV1bM10gKyAobGFic1trZXkgKyAxXVszXSAtIGxhYnNba2V5XVszXSkgKiBzdGVwUHJvZ3Jlc3NcbiAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgb3V0cHV0R3JhZGllbnQucHVzaChbXG4gICAgICAgICAgICAgICAgTWF0aC5yb3VuZChyZ2JbMF0gKiAyNTUpLFxuICAgICAgICAgICAgICAgIE1hdGgucm91bmQocmdiWzFdICogMjU1KSxcbiAgICAgICAgICAgICAgICBNYXRoLnJvdW5kKHJnYlsyXSAqIDI1NSksXG4gICAgICAgICAgICAgICAgTWF0aC5yb3VuZChyZ2JbM10gKiAyNTUpXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0cHV0R3JhZGllbnQ7XG4gICAgfTtcblxuICAgIHZhciBDT09MID0gYnVpbGRQZXJjZXB0dWFsTG9va3VwVGFibGUoW1xuICAgICAgICBbMHgwNCwgMHgyMCwgMHg0MCwgMHg1MF0sXG4gICAgICAgIFsweDA4LCAweDQwLCAweDgxLCAweDdmXSxcbiAgICAgICAgWzB4MDgsIDB4NjgsIDB4YWMsIDB4ZmZdLFxuICAgICAgICBbMHgyYiwgMHg4YywgMHhiZSwgMHhmZl0sXG4gICAgICAgIFsweDRlLCAweGIzLCAweGQzLCAweGZmXSxcbiAgICAgICAgWzB4N2IsIDB4Y2MsIDB4YzQsIDB4ZmZdLFxuICAgICAgICBbMHhhOCwgMHhkZCwgMHhiNSwgMHhmZl0sXG4gICAgICAgIFsweGNjLCAweGViLCAweGM1LCAweGZmXSxcbiAgICAgICAgWzB4ZTAsIDB4ZjMsIDB4ZGIsIDB4ZmZdLFxuICAgICAgICBbMHhmNywgMHhmYywgMHhmMCwgMHhmZl1cbiAgICBdKTtcblxuICAgIHZhciBIT1QgPSBidWlsZFBlcmNlcHR1YWxMb29rdXBUYWJsZShbXG4gICAgICAgIFsweDQwLCAweDAwLCAweDEzLCAweDUwXSxcbiAgICAgICAgWzB4ODAsIDB4MDAsIDB4MjYsIDB4N2ZdLFxuICAgICAgICBbMHhiZCwgMHgwMCwgMHgyNiwgMHhmZl0sXG4gICAgICAgIFsweGUzLCAweDFhLCAweDFjLCAweGZmXSxcbiAgICAgICAgWzB4ZmMsIDB4NGUsIDB4MmEsIDB4ZmZdLFxuICAgICAgICBbMHhmZCwgMHg4ZCwgMHgzYywgMHhmZl0sXG4gICAgICAgIFsweGZlLCAweGIyLCAweDRjLCAweGZmXSxcbiAgICAgICAgWzB4ZmUsIDB4ZDksIDB4NzYsIDB4ZmZdLFxuICAgICAgICBbMHhmZiwgMHhlZCwgMHhhMCwgMHhmZl1cbiAgICBdKTtcblxuICAgIHZhciBWRVJEQU5UID0gYnVpbGRQZXJjZXB0dWFsTG9va3VwVGFibGUoW1xuICAgICAgICBbMHgwMCwgMHg0MCwgMHgyNiwgMHg1MF0sXG4gICAgICAgIFsweDAwLCAweDVhLCAweDMyLCAweDdmXSxcbiAgICAgICAgWzB4MjMsIDB4ODQsIDB4NDMsIDB4ZmZdLFxuICAgICAgICBbMHg0MSwgMHhhYiwgMHg1ZCwgMHhmZl0sXG4gICAgICAgIFsweDc4LCAweGM2LCAweDc5LCAweGZmXSxcbiAgICAgICAgWzB4YWQsIDB4ZGQsIDB4OGUsIDB4ZmZdLFxuICAgICAgICBbMHhkOSwgMHhmMCwgMHhhMywgMHhmZl0sXG4gICAgICAgIFsweGY3LCAweGZjLCAweGI5LCAweGZmXSxcbiAgICAgICAgWzB4ZmYsIDB4ZmYsIDB4ZTUsIDB4ZmZdXG4gICAgXSk7XG5cbiAgICB2YXIgU1BFQ1RSQUwgPSBidWlsZFBlcmNlcHR1YWxMb29rdXBUYWJsZShbXG4gICAgICAgIFsweDI2LCAweDFhLCAweDQwLCAweDUwXSxcbiAgICAgICAgWzB4NDQsIDB4MmYsIDB4NzIsIDB4N2ZdLFxuICAgICAgICBbMHhlMSwgMHgyYiwgMHgwMiwgMHhmZl0sXG4gICAgICAgIFsweDAyLCAweGRjLCAweDAxLCAweGZmXSxcbiAgICAgICAgWzB4ZmYsIDB4ZDIsIDB4MDIsIDB4ZmZdLFxuICAgICAgICBbMHhmZiwgMHhmZiwgMHhmZiwgMHhmZl1cbiAgICBdKTtcblxuICAgIHZhciBURU1QRVJBVFVSRSA9IGJ1aWxkUGVyY2VwdHVhbExvb2t1cFRhYmxlKFtcbiAgICAgICAgWzB4MDAsIDB4MTYsIDB4NDAsIDB4NTBdLFxuICAgICAgICBbMHgwMCwgMHgzOSwgMHg2NiwgMHg3Zl0sIC8vYmx1ZVxuICAgICAgICBbMHgzMSwgMHgzZCwgMHg2NiwgMHhmZl0sIC8vcHVycGxlXG4gICAgICAgIFsweGUxLCAweDJiLCAweDAyLCAweGZmXSwgLy9yZWRcbiAgICAgICAgWzB4ZmYsIDB4ZDIsIDB4MDIsIDB4ZmZdLCAvL3llbGxvd1xuICAgICAgICBbMHhmZiwgMHhmZiwgMHhmZiwgMHhmZl0gLy93aGl0ZVxuICAgIF0pO1xuXG4gICAgdmFyIEdSRVlTQ0FMRSA9IGJ1aWxkUGVyY2VwdHVhbExvb2t1cFRhYmxlKFtcbiAgICAgICAgWzB4MDAsIDB4MDAsIDB4MDAsIDB4N2ZdLFxuICAgICAgICBbMHg0MCwgMHg0MCwgMHg0MCwgMHhmZl0sXG4gICAgICAgIFsweGZmLCAweGZmLCAweGZmLCAweGZmXVxuICAgIF0pO1xuXG4gICAgdmFyIFBPTEFSX0hPVCA9IGJ1aWxkUGVyY2VwdHVhbExvb2t1cFRhYmxlKFtcbiAgICAgICAgWyAweGZmLCAweDQ0LCAweDAwLCAweGZmIF0sXG4gICAgICAgIFsgMHhiZCwgMHhiZCwgMHhiZCwgMHhiMCBdXG4gICAgXSk7XG5cbiAgICB2YXIgUE9MQVJfQ09MRCA9IGJ1aWxkUGVyY2VwdHVhbExvb2t1cFRhYmxlKFtcbiAgICAgICAgWyAweGJkLCAweGJkLCAweGJkLCAweGIwIF0sXG4gICAgICAgIFsgMHgzMiwgMHhhNSwgMHhmOSwgMHhmZiBdXG4gICAgXSk7XG5cbiAgICB2YXIgYnVpbGRMb29rdXBGdW5jdGlvbiA9IGZ1bmN0aW9uKFJBTVApIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHNjYWxlZFZhbHVlLCBpbkNvbG9yKSB7XG4gICAgICAgICAgICB2YXIgY29sb3IgPSBSQU1QW01hdGguZmxvb3Ioc2NhbGVkVmFsdWUgKiAoUkFNUC5sZW5ndGggLSAxKSldO1xuICAgICAgICAgICAgaW5Db2xvclswXSA9IGNvbG9yWzBdO1xuICAgICAgICAgICAgaW5Db2xvclsxXSA9IGNvbG9yWzFdO1xuICAgICAgICAgICAgaW5Db2xvclsyXSA9IGNvbG9yWzJdO1xuICAgICAgICAgICAgaW5Db2xvclszXSA9IGNvbG9yWzNdO1xuICAgICAgICAgICAgcmV0dXJuIGluQ29sb3I7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHZhciBDb2xvclJhbXAgPSB7XG4gICAgICAgIGNvb2w6IGJ1aWxkTG9va3VwRnVuY3Rpb24oQ09PTCksXG4gICAgICAgIGhvdDogYnVpbGRMb29rdXBGdW5jdGlvbihIT1QpLFxuICAgICAgICB2ZXJkYW50OiBidWlsZExvb2t1cEZ1bmN0aW9uKFZFUkRBTlQpLFxuICAgICAgICBzcGVjdHJhbDogYnVpbGRMb29rdXBGdW5jdGlvbihTUEVDVFJBTCksXG4gICAgICAgIHRlbXBlcmF0dXJlOiBidWlsZExvb2t1cEZ1bmN0aW9uKFRFTVBFUkFUVVJFKSxcbiAgICAgICAgZ3JleTogYnVpbGRMb29rdXBGdW5jdGlvbihHUkVZU0NBTEUpLFxuICAgICAgICBwb2xhcjogYnVpbGRMb29rdXBGdW5jdGlvbihQT0xBUl9IT1QuY29uY2F0KFBPTEFSX0NPTEQpKVxuICAgIH07XG5cbiAgICB2YXIgc2V0Q29sb3JSYW1wID0gZnVuY3Rpb24odHlwZSkge1xuICAgICAgICB2YXIgZnVuYyA9IENvbG9yUmFtcFt0eXBlLnRvTG93ZXJDYXNlKCldO1xuICAgICAgICBpZiAoZnVuYykge1xuICAgICAgICAgICAgdGhpcy5fY29sb3JSYW1wID0gZnVuYztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIGdldENvbG9yUmFtcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29sb3JSYW1wO1xuICAgIH07XG5cbiAgICB2YXIgaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9jb2xvclJhbXAgPSBDb2xvclJhbXAudmVyZGFudDtcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIGluaXRpYWxpemU6IGluaXRpYWxpemUsXG4gICAgICAgIHNldENvbG9yUmFtcDogc2V0Q29sb3JSYW1wLFxuICAgICAgICBnZXRDb2xvclJhbXA6IGdldENvbG9yUmFtcFxuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgU0lHTU9JRF9TQ0FMRSA9IDAuMTU7XG5cbiAgICAvLyBsb2cxMFxuXG4gICAgZnVuY3Rpb24gbG9nMTBUcmFuc2Zvcm0odmFsLCBtaW4sIG1heCkge1xuICAgICAgICB2YXIgbG9nTWluID0gTWF0aC5sb2cxMChtaW4gfHwgMSk7XG4gICAgICAgIHZhciBsb2dNYXggPSBNYXRoLmxvZzEwKG1heCB8fCAxKTtcbiAgICAgICAgdmFyIGxvZ1ZhbCA9IE1hdGgubG9nMTAodmFsIHx8IDEpO1xuICAgICAgICByZXR1cm4gKGxvZ1ZhbCAtIGxvZ01pbikgLyAoKGxvZ01heCAtIGxvZ01pbikgfHwgMSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW52ZXJzZUxvZzEwVHJhbnNmb3JtKG52YWwsIG1pbiwgbWF4KSB7XG4gICAgICAgIHZhciBsb2dNaW4gPSBNYXRoLmxvZzEwKG1pbiB8fCAxKTtcbiAgICAgICAgdmFyIGxvZ01heCA9IE1hdGgubG9nMTAobWF4IHx8IDEpO1xuICAgICAgICByZXR1cm4gTWF0aC5wb3coMTAsIChudmFsICogbG9nTWF4IC0gbnZhbCAqIGxvZ01pbikgKyBsb2dNaW4pO1xuICAgIH1cblxuICAgIC8vIHNpZ21vaWRcblxuICAgIGZ1bmN0aW9uIHNpZ21vaWRUcmFuc2Zvcm0odmFsLCBtaW4sIG1heCkge1xuICAgICAgICB2YXIgYWJzTWluID0gTWF0aC5hYnMobWluKTtcbiAgICAgICAgdmFyIGFic01heCA9IE1hdGguYWJzKG1heCk7XG4gICAgICAgIHZhciBkaXN0YW5jZSA9IE1hdGgubWF4KGFic01pbiwgYWJzTWF4KTtcbiAgICAgICAgdmFyIHNjYWxlZFZhbCA9IHZhbCAvIChTSUdNT0lEX1NDQUxFICogZGlzdGFuY2UpO1xuICAgICAgICByZXR1cm4gMSAvICgxICsgTWF0aC5leHAoLXNjYWxlZFZhbCkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGludmVyc2VTaWdtb2lkVHJhbnNmb3JtKG52YWwsIG1pbiwgbWF4KSB7XG4gICAgICAgIHZhciBhYnNNaW4gPSBNYXRoLmFicyhtaW4pO1xuICAgICAgICB2YXIgYWJzTWF4ID0gTWF0aC5hYnMobWF4KTtcbiAgICAgICAgdmFyIGRpc3RhbmNlID0gTWF0aC5tYXgoYWJzTWluLCBhYnNNYXgpO1xuICAgICAgICByZXR1cm4gTWF0aC5sb2coKDEvbnZhbCkgLSAxKSAqIC0oU0lHTU9JRF9TQ0FMRSAqIGRpc3RhbmNlKTtcbiAgICB9XG5cbiAgICAvLyBsaW5lYXJcblxuICAgIGZ1bmN0aW9uIGxpbmVhclRyYW5zZm9ybSh2YWwsIG1pbiwgbWF4KSB7XG4gICAgICAgIHZhciByYW5nZSA9IG1heCAtIG1pbjtcbiAgICAgICAgcmV0dXJuICh2YWwgLSBtaW4pIC8gcmFuZ2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW52ZXJzZUxpbmVhclRyYW5zZm9ybShudmFsLCBtaW4sIG1heCkge1xuICAgICAgICB2YXIgcmFuZ2UgPSBtYXggLSBtaW47XG4gICAgICAgIHJldHVybiBtaW4gKyBudmFsICogcmFuZ2U7XG4gICAgfVxuXG4gICAgdmFyIFRyYW5zZm9ybSA9IHtcbiAgICAgICAgbGluZWFyOiBsaW5lYXJUcmFuc2Zvcm0sXG4gICAgICAgIGxvZzEwOiBsb2cxMFRyYW5zZm9ybSxcbiAgICAgICAgc2lnbW9pZDogc2lnbW9pZFRyYW5zZm9ybVxuICAgIH07XG5cbiAgICB2YXIgSW52ZXJzZSA9IHtcbiAgICAgICAgbGluZWFyOiBpbnZlcnNlTGluZWFyVHJhbnNmb3JtLFxuICAgICAgICBsb2cxMDogaW52ZXJzZUxvZzEwVHJhbnNmb3JtLFxuICAgICAgICBzaWdtb2lkOiBpbnZlcnNlU2lnbW9pZFRyYW5zZm9ybVxuICAgIH07XG5cbiAgICB2YXIgaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9yYW5nZSA9IHtcbiAgICAgICAgICAgIG1pbjogMCxcbiAgICAgICAgICAgIG1heDogMVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLl90cmFuc2Zvcm1GdW5jID0gbG9nMTBUcmFuc2Zvcm07XG4gICAgICAgIHRoaXMuX2ludmVyc2VGdW5jID0gaW52ZXJzZUxvZzEwVHJhbnNmb3JtO1xuICAgIH07XG5cbiAgICB2YXIgc2V0VHJhbnNmb3JtRnVuYyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgdmFyIGZ1bmMgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHRoaXMuX3RyYW5zZm9ybUZ1bmMgPSBUcmFuc2Zvcm1bZnVuY107XG4gICAgICAgIHRoaXMuX2ludmVyc2VGdW5jID0gSW52ZXJzZVtmdW5jXTtcbiAgICB9O1xuXG4gICAgdmFyIHNldFZhbHVlUmFuZ2UgPSBmdW5jdGlvbihyYW5nZSkge1xuICAgICAgICB0aGlzLl9yYW5nZS5taW4gPSByYW5nZS5taW47XG4gICAgICAgIHRoaXMuX3JhbmdlLm1heCA9IHJhbmdlLm1heDtcbiAgICB9O1xuXG4gICAgdmFyIGdldFZhbHVlUmFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JhbmdlO1xuICAgIH07XG5cbiAgICB2YXIgaW50ZXJwb2xhdGVUb1JhbmdlID0gZnVuY3Rpb24obnZhbCkge1xuICAgICAgICAvLyBpbnRlcnBvbGF0ZSBiZXR3ZWVuIHRoZSBmaWx0ZXIgcmFuZ2VcbiAgICAgICAgdmFyIHJNaW4gPSB0aGlzLl9yYW5nZS5taW47XG4gICAgICAgIHZhciByTWF4ID0gdGhpcy5fcmFuZ2UubWF4O1xuICAgICAgICB2YXIgcnZhbCA9IChudmFsIC0gck1pbikgLyAock1heCAtIHJNaW4pO1xuICAgICAgICAvLyBlbnN1cmUgb3V0cHV0IGlzIFswOjFdXG4gICAgICAgIHJldHVybiBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBydmFsKSk7XG4gICAgfTtcblxuICAgIHZhciB0cmFuc2Zvcm1WYWx1ZSA9IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICAvLyBjbGFtcCB0aGUgdmFsdWUgYmV0d2VlbiB0aGUgZXh0cmVtZSAoc2hvdWxkbid0IGJlIG5lY2Vzc2FyeSlcbiAgICAgICAgdmFyIG1pbiA9IHRoaXMuX2V4dHJlbWEubWluO1xuICAgICAgICB2YXIgbWF4ID0gdGhpcy5fZXh0cmVtYS5tYXg7XG4gICAgICAgIHZhciBjbGFtcGVkID0gTWF0aC5tYXgoTWF0aC5taW4odmFsLCBtYXgpLCBtaW4pO1xuICAgICAgICAvLyBub3JtYWxpemUgdGhlIHZhbHVlXG4gICAgICAgIHJldHVybiB0aGlzLl90cmFuc2Zvcm1GdW5jKGNsYW1wZWQsIG1pbiwgbWF4KTtcbiAgICB9O1xuXG4gICAgdmFyIHVudHJhbnNmb3JtVmFsdWUgPSBmdW5jdGlvbihudmFsKSB7XG4gICAgICAgIHZhciBtaW4gPSB0aGlzLl9leHRyZW1hLm1pbjtcbiAgICAgICAgdmFyIG1heCA9IHRoaXMuX2V4dHJlbWEubWF4O1xuICAgICAgICAvLyBjbGFtcCB0aGUgdmFsdWUgYmV0d2VlbiB0aGUgZXh0cmVtZSAoc2hvdWxkbid0IGJlIG5lY2Vzc2FyeSlcbiAgICAgICAgdmFyIGNsYW1wZWQgPSBNYXRoLm1heChNYXRoLm1pbihudmFsLCAxKSwgMCk7XG4gICAgICAgIC8vIHVubm9ybWFsaXplIHRoZSB2YWx1ZVxuICAgICAgICByZXR1cm4gdGhpcy5faW52ZXJzZUZ1bmMoY2xhbXBlZCwgbWluLCBtYXgpO1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgaW5pdGlhbGl6ZTogaW5pdGlhbGl6ZSxcbiAgICAgICAgc2V0VHJhbnNmb3JtRnVuYzogc2V0VHJhbnNmb3JtRnVuYyxcbiAgICAgICAgc2V0VmFsdWVSYW5nZTogc2V0VmFsdWVSYW5nZSxcbiAgICAgICAgZ2V0VmFsdWVSYW5nZTogZ2V0VmFsdWVSYW5nZSxcbiAgICAgICAgdHJhbnNmb3JtVmFsdWU6IHRyYW5zZm9ybVZhbHVlLFxuICAgICAgICB1bnRyYW5zZm9ybVZhbHVlOiB1bnRyYW5zZm9ybVZhbHVlLFxuICAgICAgICBpbnRlcnBvbGF0ZVRvUmFuZ2U6IGludGVycG9sYXRlVG9SYW5nZVxuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgVGlsaW5nID0gcmVxdWlyZSgnLi9UaWxpbmcnKTtcblxuICAgIHZhciBzZXRSZXNvbHV0aW9uID0gZnVuY3Rpb24ocmVzb2x1dGlvbikge1xuICAgICAgICBpZiAocmVzb2x1dGlvbiAhPT0gdGhpcy5fcGFyYW1zLmJpbm5pbmcucmVzb2x1dGlvbikge1xuICAgICAgICAgICAgdGhpcy5fcGFyYW1zLmJpbm5pbmcucmVzb2x1dGlvbiA9IHJlc29sdXRpb247XG4gICAgICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0UmVzb2x1dGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyYW1zLmJpbm5pbmcucmVzb2x1dGlvbjtcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIC8vIHRpbGluZ1xuICAgICAgICBzZXRYRmllbGQ6IFRpbGluZy5zZXRYRmllbGQsXG4gICAgICAgIGdldFhGaWVsZDogVGlsaW5nLmdldFhGaWVsZCxcbiAgICAgICAgc2V0WUZpZWxkOiBUaWxpbmcuc2V0WUZpZWxkLFxuICAgICAgICBnZXRZRmllbGQ6IFRpbGluZy5nZXRZRmllbGQsXG4gICAgICAgIC8vIGJpbm5pbmdcbiAgICAgICAgc2V0UmVzb2x1dGlvbjogc2V0UmVzb2x1dGlvbixcbiAgICAgICAgZ2V0UmVzb2x1dGlvbjogZ2V0UmVzb2x1dGlvblxuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKXtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIGNoZWNrRmllbGQgPSBmdW5jdGlvbihtZXRhLCBmaWVsZCkge1xuICAgIGlmIChtZXRhICYmIG1ldGEudHlwZSkge1xuXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWRkQm9vbFF1ZXJ5KHF1ZXJ5KXtcblxuICAgIC8vIGRvIHNvbWUgdmFsaWRhdGlvbiBvbiB0aGUgcXVlcnkgb2JqZWN0XG4gICAgLy8gZS5nLiBtYWtlIHN1cmUgdGhhdCBhbGwgb2YgdGhlIGZpZWxkcyByZWZlcmVuY2VkIGFyZSBhY3R1YWxseSBwYXJ0IG9mIHRoZSBtZXRhZGF0YSBmb3IgdGhlIGxheWVyXG4gICAgdGhpcy5fcGFyYW1zLmJvb2xfcXVlcnkgPSBxdWVyeTtcbiAgICBjb25zb2xlLmxvZygnYWRkaW5nIGZvcnJlYWxzJyk7XG4gICAgcmV0dXJuIHt9O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlQm9vbFF1ZXJ5KCl7XG4gICAgdGhpcy5fcGFyYW1zLmJvb2xfcXVlcnkgPSBudWxsO1xuICAgIGNvbnNvbGUubG9nKCdyZW1vdmluZyBmb3JyZWFscycpO1xuICAgIHJldHVybiB7fTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEJvb2xRdWVyeSgpe1xuXG4gICAgY29uc29sZS5sb2coJ2dldHRpbmcgZm9ycmVhbHMnKTtcbiAgICByZXR1cm4gdGhpcy5fcGFyYW1zLmJvb2xfcXVlcnk7XG4gIH1cblxuICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhZGRCb29sUXVlcnkgOiBhZGRCb29sUXVlcnksXG4gICAgcmVtb3ZlQm9vbFF1ZXJ5IDogcmVtb3ZlQm9vbFF1ZXJ5LFxuICAgIGdldEJvb2xRdWVyeSA6IGdldEJvb2xRdWVyeVxuICB9XG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIHNldERhdGVIaXN0b2dyYW0gPSBmdW5jdGlvbihmaWVsZCwgZnJvbSwgdG8sIGludGVydmFsKSB7XG4gICAgICAgIGlmICghZmllbGQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignRGF0ZUhpc3RvZ3JhbSBgZmllbGRgIGlzIG1pc3NpbmcgZnJvbSBhcmd1bWVudC4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZnJvbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0RhdGVIaXN0b2dyYW0gYGZyb21gIGFyZSBtaXNzaW5nIGZyb20gYXJndW1lbnQuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRvID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignRGF0ZUhpc3RvZ3JhbSBgdG9gIGFyZSBtaXNzaW5nIGZyb20gYXJndW1lbnQuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcGFyYW1zLmRhdGVfaGlzdG9ncmFtID0ge1xuICAgICAgICAgICAgZmllbGQ6IGZpZWxkLFxuICAgICAgICAgICAgZnJvbTogZnJvbSxcbiAgICAgICAgICAgIHRvOiB0byxcbiAgICAgICAgICAgIGludGVydmFsOiBpbnRlcnZhbFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIGdldERhdGVIaXN0b2dyYW0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmFtcy5kYXRlX2hpc3RvZ3JhbTtcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIHNldERhdGVIaXN0b2dyYW06IHNldERhdGVIaXN0b2dyYW0sXG4gICAgICAgIGdldERhdGVIaXN0b2dyYW06IGdldERhdGVIaXN0b2dyYW1cbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIHNldEhpc3RvZ3JhbSA9IGZ1bmN0aW9uKGZpZWxkLCBpbnRlcnZhbCkge1xuICAgICAgICBpZiAoIWZpZWxkKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0hpc3RvZ3JhbSBgZmllbGRgIGlzIG1pc3NpbmcgZnJvbSBhcmd1bWVudC4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWludGVydmFsKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0hpc3RvZ3JhbSBgaW50ZXJ2YWxgIGFyZSBtaXNzaW5nIGZyb20gYXJndW1lbnQuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcGFyYW1zLmhpc3RvZ3JhbSA9IHtcbiAgICAgICAgICAgIGZpZWxkOiBmaWVsZCxcbiAgICAgICAgICAgIGludGVydmFsOiBpbnRlcnZhbFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIGdldEhpc3RvZ3JhbSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyYW1zLmhpc3RvZ3JhbTtcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIHNldEhpc3RvZ3JhbTogc2V0SGlzdG9ncmFtLFxuICAgICAgICBnZXRIaXN0b2dyYW06IGdldEhpc3RvZ3JhbVxuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgTUVUUklDUyA9IHtcbiAgICAgICAgJ21pbic6IHRydWUsXG4gICAgICAgICdtYXgnOiB0cnVlLFxuICAgICAgICAnc3VtJzogdHJ1ZSxcbiAgICAgICAgJ2F2Zyc6IHRydWVcbiAgICB9O1xuXG4gICAgdmFyIGNoZWNrRmllbGQgPSBmdW5jdGlvbihtZXRhLCBmaWVsZCkge1xuICAgICAgICBpZiAobWV0YSkge1xuICAgICAgICAgICAgaWYgKG1ldGEuZXh0cmVtYSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZpZWxkIGAnICsgZmllbGQgKyAnYCBpcyBub3Qgb3JkaW5hbCBpbiBtZXRhIGRhdGEuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZpZWxkIGAnICsgZmllbGQgKyAnYCBpcyBub3QgcmVjb2duaXplZCBpbiBtZXRhIGRhdGEuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICB2YXIgc2V0TWV0cmljQWdnID0gZnVuY3Rpb24oZmllbGQsIHR5cGUpIHtcbiAgICAgICAgaWYgKCFmaWVsZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdNZXRyaWNBZ2cgYGZpZWxkYCBpcyBtaXNzaW5nIGZyb20gYXJndW1lbnQuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0eXBlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ01ldHJpY0FnZyBgdHlwZWAgaXMgbWlzc2luZyBmcm9tIGFyZ3VtZW50LiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBtZXRhID0gdGhpcy5fbWV0YVtmaWVsZF07XG4gICAgICAgIGlmIChjaGVja0ZpZWxkKG1ldGEsIGZpZWxkKSkge1xuICAgICAgICAgICAgaWYgKCFNRVRSSUNTW3R5cGVdKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdNZXRyaWNBZ2cgdHlwZSBgJyArIHR5cGUgKyAnYCBpcyBub3Qgc3VwcG9ydGVkLiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3BhcmFtcy5tZXRyaWNfYWdnID0ge1xuICAgICAgICAgICAgICAgIGZpZWxkOiBmaWVsZCxcbiAgICAgICAgICAgICAgICB0eXBlOiB0eXBlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIGdldE1ldHJpY0FnZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyYW1zLm1ldHJpY19hZ2c7XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICAvLyB0aWxpbmdcbiAgICAgICAgc2V0TWV0cmljQWdnOiBzZXRNZXRyaWNBZ2csXG4gICAgICAgIGdldE1ldHJpY0FnZzogZ2V0TWV0cmljQWdnLFxuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgY2hlY2tGaWVsZCA9IGZ1bmN0aW9uKG1ldGEsIGZpZWxkKSB7XG4gICAgICAgIGlmIChtZXRhKSB7XG4gICAgICAgICAgICBpZiAobWV0YS50eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZpZWxkIGAnICsgZmllbGQgKyAnYCBpcyBub3Qgb2YgdHlwZSBgc3RyaW5nYCBpbiBtZXRhIGRhdGEuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZpZWxkIGAnICsgZmllbGQgKyAnYCBpcyBub3QgcmVjb2duaXplZCBpbiBtZXRhIGRhdGEuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICB2YXIgbm9ybWFsaXplVGVybXMgPSBmdW5jdGlvbihwcmVmaXhlcykge1xuICAgICAgICBwcmVmaXhlcy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIGlmIChhIDwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhID4gYikge1xuICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcHJlZml4ZXM7XG4gICAgfTtcblxuICAgIHZhciBhZGRQcmVmaXhGaWx0ZXIgPSBmdW5jdGlvbihmaWVsZCwgcHJlZml4ZXMpIHtcbiAgICAgICAgaWYgKCFmaWVsZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdQcmVmaXhGaWx0ZXIgYGZpZWxkYCBpcyBtaXNzaW5nIGZyb20gYXJndW1lbnQuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByZWZpeGVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignUHJlZml4RmlsdGVyIGBwcmVmaXhlc2AgYXJlIG1pc3NpbmcgZnJvbSBhcmd1bWVudC4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbWV0YSA9IHRoaXMuX21ldGFbZmllbGRdO1xuICAgICAgICBpZiAoY2hlY2tGaWVsZChtZXRhLCBmaWVsZCkpIHtcbiAgICAgICAgICAgIHZhciBmaWx0ZXIgPSBfLmZpbmQodGhpcy5fcGFyYW1zLnByZWZpeF9maWx0ZXIsIGZ1bmN0aW9uKGZpbHRlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXIuZmllbGQgPT09IGZpZWxkO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdSYW5nZSB3aXRoIGBmaWVsZGAgb2YgYCcgKyBmaWVsZCArICdgIGFscmVhZHkgZXhpc3RzLCB1c2VkIGB1cGRhdGVSYW5nZWAgaW5zdGVhZC4nKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9wYXJhbXMucHJlZml4X2ZpbHRlciA9IHRoaXMuX3BhcmFtcy5wcmVmaXhfZmlsdGVyIHx8IFtdO1xuICAgICAgICAgICAgdGhpcy5fcGFyYW1zLnByZWZpeF9maWx0ZXIucHVzaCh7XG4gICAgICAgICAgICAgICAgZmllbGQ6IGZpZWxkLFxuICAgICAgICAgICAgICAgIHByZWZpeGVzOiBub3JtYWxpemVUZXJtcyhwcmVmaXhlcylcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIHVwZGF0ZVByZWZpeEZpbHRlciA9IGZ1bmN0aW9uKGZpZWxkLCBwcmVmaXhlcykge1xuICAgICAgICB2YXIgZmlsdGVyID0gXy5maW5kKHRoaXMuX3BhcmFtcy5wcmVmaXhfZmlsdGVyLCBmdW5jdGlvbihmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXIuZmllbGQgPT09IGZpZWxkO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignUmFuZ2Ugd2l0aCBgZmllbGRgIG9mIGAnICsgZmllbGQgKyAnYCBkb2VzIG5vdCBleGlzdC4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJlZml4ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZmlsdGVyLnByZWZpeGVzID0gbm9ybWFsaXplVGVybXMocHJlZml4ZXMpO1xuICAgICAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIHJlbW92ZVByZWZpeEZpbHRlciA9IGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgICAgIHZhciBmaWx0ZXIgPSBfLmZpbmQodGhpcy5fcGFyYW1zLnByZWZpeF9maWx0ZXIsIGZ1bmN0aW9uKGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlci5maWVsZCA9PT0gZmllbGQ7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIWZpbHRlcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdSYW5nZSB3aXRoIGBmaWVsZGAgb2YgYCcgKyBmaWVsZCArICdgIGRvZXMgbm90IGV4aXN0LiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3BhcmFtcy5wcmVmaXhfZmlsdGVyID0gXy5maWx0ZXIodGhpcy5fcGFyYW1zLnByZWZpeF9maWx0ZXIsIGZ1bmN0aW9uKGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlci5maWVsZCAhPT0gZmllbGQ7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIGdldFByZWZpeEZpbHRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyYW1zLnByZWZpeF9maWx0ZXI7XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICBhZGRQcmVmaXhGaWx0ZXI6IGFkZFByZWZpeEZpbHRlcixcbiAgICAgICAgdXBkYXRlUHJlZml4RmlsdGVyOiB1cGRhdGVQcmVmaXhGaWx0ZXIsXG4gICAgICAgIHJlbW92ZVByZWZpeEZpbHRlcjogcmVtb3ZlUHJlZml4RmlsdGVyLFxuICAgICAgICBnZXRQcmVmaXhGaWx0ZXI6IGdldFByZWZpeEZpbHRlclxuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgY2hlY2tGaWVsZCA9IGZ1bmN0aW9uKG1ldGEsIGZpZWxkKSB7XG4gICAgICAgIGlmIChtZXRhKSB7XG4gICAgICAgICAgICBpZiAobWV0YS50eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZpZWxkIGAnICsgZmllbGQgKyAnYCBpcyBub3QgYHN0cmluZ2AgaW4gbWV0YSBkYXRhLiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdGaWVsZCBgJyArIGZpZWxkICsgJ2AgaXMgbm90IHJlY29nbml6ZWQgaW4gbWV0YSBkYXRhLiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgdmFyIGFkZFF1ZXJ5U3RyaW5nID0gZnVuY3Rpb24oZmllbGQsIHN0cikge1xuICAgICAgICBpZiAoIWZpZWxkKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1F1ZXJ5U3RyaW5nIGBmaWVsZGAgaXMgbWlzc2luZyBmcm9tIGFyZ3VtZW50LiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghc3RyKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1F1ZXJ5U3RyaW5nIGBzdHJpbmdgIGlzIG1pc3NpbmcgZnJvbSBhcmd1bWVudC4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbWV0YSA9IHRoaXMuX21ldGFbZmllbGRdO1xuICAgICAgICBpZiAoY2hlY2tGaWVsZChtZXRhLCBmaWVsZCkpIHtcbiAgICAgICAgICAgIHZhciBxdWVyeSA9IF8uZmluZCh0aGlzLl9wYXJhbXMucXVlcnlfc3RyaW5nLCBmdW5jdGlvbihxdWVyeSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBxdWVyeS5maWVsZCA9PT0gZmllbGQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChxdWVyeSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignUXVlcnlTdHJpbmcgd2l0aCBgZmllbGRgIG9mIGAnICsgZmllbGQgKyAnYCBhbHJlYWR5IGV4aXN0cywgdXNlZCBgdXBkYXRlUXVlcnlTdHJpbmdgIGluc3RlYWQuJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcGFyYW1zLnF1ZXJ5X3N0cmluZyA9IHRoaXMuX3BhcmFtcy5xdWVyeV9zdHJpbmcgfHwgW107XG4gICAgICAgICAgICB0aGlzLl9wYXJhbXMucXVlcnlfc3RyaW5nLnB1c2goe1xuICAgICAgICAgICAgICAgIGZpZWxkOiBmaWVsZCxcbiAgICAgICAgICAgICAgICBzdHJpbmc6IHN0clxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICB2YXIgdXBkYXRlUXVlcnlTdHJpbmcgPSBmdW5jdGlvbihmaWVsZCwgc3RyKSB7XG4gICAgICAgIHZhciBxdWVyeSA9IF8uZmluZCh0aGlzLl9wYXJhbXMucXVlcnlfc3RyaW5nLCBmdW5jdGlvbihxdWVyeSkge1xuICAgICAgICAgICAgcmV0dXJuIHF1ZXJ5LmZpZWxkID09PSBmaWVsZDtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghcXVlcnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignUXVlcnlTdHJpbmcgd2l0aCBgZmllbGRgIG9mIGAnICsgZmllbGQgKyAnYCBkb2VzIG5vdCBleGlzdC4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICBpZiAoc3RyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgcXVlcnkuc3RyaW5nID0gc3RyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICB2YXIgcmVtb3ZlUXVlcnlTdHJpbmcgPSBmdW5jdGlvbihmaWVsZCkge1xuICAgICAgICB2YXIgcXVlcnkgPSBfLmZpbmQodGhpcy5fcGFyYW1zLnF1ZXJ5X3N0cmluZywgZnVuY3Rpb24ocXVlcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBxdWVyeS5maWVsZCA9PT0gZmllbGQ7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIXF1ZXJ5KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1F1ZXJ5U3RyaW5nIHdpdGggYGZpZWxkYCBvZiBgJyArIGZpZWxkICsgJ2AgZG9lcyBub3QgZXhpc3QuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcGFyYW1zLnF1ZXJ5X3N0cmluZyA9IF8uZmlsdGVyKHRoaXMuX3BhcmFtcy5xdWVyeV9zdHJpbmcsIGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4gcXVlcnkuZmllbGQgIT09IGZpZWxkO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciBnZXRRdWVyeVN0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyYW1zLnF1ZXJ5X3N0cmluZztcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIGFkZFF1ZXJ5U3RyaW5nOiBhZGRRdWVyeVN0cmluZyxcbiAgICAgICAgdXBkYXRlUXVlcnlTdHJpbmc6IHVwZGF0ZVF1ZXJ5U3RyaW5nLFxuICAgICAgICByZW1vdmVRdWVyeVN0cmluZzogcmVtb3ZlUXVlcnlTdHJpbmcsXG4gICAgICAgIGdldFF1ZXJ5U3RyaW5nOiBnZXRRdWVyeVN0cmluZ1xuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgY2hlY2tGaWVsZCA9IGZ1bmN0aW9uKG1ldGEsIGZpZWxkKSB7XG4gICAgICAgIGlmIChtZXRhKSB7XG4gICAgICAgICAgICBpZiAobWV0YS5leHRyZW1hKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignRmllbGQgYCcgKyBmaWVsZCArICdgIGlzIG5vdCBvcmRpbmFsIGluIG1ldGEgZGF0YS4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignRmllbGQgYCcgKyBmaWVsZCArICdgIGlzIG5vdCByZWNvZ25pemVkIGluIG1ldGEgZGF0YS4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIHZhciBhZGRSYW5nZSA9IGZ1bmN0aW9uKGZpZWxkLCBmcm9tLCB0bykge1xuICAgICAgICBpZiAoIWZpZWxkKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1JhbmdlIGBmaWVsZGAgaXMgbWlzc2luZyBmcm9tIGFyZ3VtZW50LiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmcm9tID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignUmFuZ2UgYGZyb21gIGlzIG1pc3NpbmcgZnJvbSBhcmd1bWVudC4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodG8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdSYW5nZSBgdG9gIGlzIG1pc3NpbmcgZnJvbSBhcmd1bWVudC4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbWV0YSA9IHRoaXMuX21ldGFbZmllbGRdO1xuICAgICAgICBpZiAoY2hlY2tGaWVsZChtZXRhLCBmaWVsZCkpIHtcbiAgICAgICAgICAgIHZhciByYW5nZSA9IF8uZmluZCh0aGlzLl9wYXJhbXMucmFuZ2UsIGZ1bmN0aW9uKHJhbmdlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJhbmdlLmZpZWxkID09PSBmaWVsZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHJhbmdlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdSYW5nZSB3aXRoIGBmaWVsZGAgb2YgYCcgKyBmaWVsZCArICdgIGFscmVhZHkgZXhpc3RzLCB1c2VkIGB1cGRhdGVSYW5nZWAgaW5zdGVhZC4nKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9wYXJhbXMucmFuZ2UgPSB0aGlzLl9wYXJhbXMucmFuZ2UgfHwgW107XG4gICAgICAgICAgICB0aGlzLl9wYXJhbXMucmFuZ2UucHVzaCh7XG4gICAgICAgICAgICAgICAgZmllbGQ6IGZpZWxkLFxuICAgICAgICAgICAgICAgIGZyb206IGZyb20sXG4gICAgICAgICAgICAgICAgdG86IHRvXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJFeHRyZW1hKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciB1cGRhdGVSYW5nZSA9IGZ1bmN0aW9uKGZpZWxkLCBmcm9tLCB0bykge1xuICAgICAgICB2YXIgcmFuZ2UgPSBfLmZpbmQodGhpcy5fcGFyYW1zLnJhbmdlLCBmdW5jdGlvbihyYW5nZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJhbmdlLmZpZWxkID09PSBmaWVsZDtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghcmFuZ2UpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignUmFuZ2Ugd2l0aCBgZmllbGRgIG9mIGAnICsgZmllbGQgKyAnYCBkb2VzIG5vdCBleGlzdC4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICBpZiAoZnJvbSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJhbmdlLmZyb20gPSBmcm9tO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0byAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJhbmdlLnRvID0gdG87XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJFeHRyZW1hKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciByZW1vdmVSYW5nZSA9IGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgICAgIHZhciByYW5nZSA9IF8uZmluZCh0aGlzLl9wYXJhbXMucmFuZ2UsIGZ1bmN0aW9uKHJhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmFuZ2UuZmllbGQgPT09IGZpZWxkO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFyYW5nZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdSYW5nZSB3aXRoIGBmaWVsZGAgb2YgYCcgKyBmaWVsZCArICdgIGRvZXMgbm90IGV4aXN0LiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3BhcmFtcy5yYW5nZSA9IF8uZmlsdGVyKHRoaXMuX3BhcmFtcy5yYW5nZSwgZnVuY3Rpb24ocmFuZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiByYW5nZS5maWVsZCAhPT0gZmllbGQ7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIGdldFJhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJhbXMucmFuZ2U7XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICBhZGRSYW5nZTogYWRkUmFuZ2UsXG4gICAgICAgIHVwZGF0ZVJhbmdlOiB1cGRhdGVSYW5nZSxcbiAgICAgICAgcmVtb3ZlUmFuZ2U6IHJlbW92ZVJhbmdlLFxuICAgICAgICBnZXRSYW5nZTogZ2V0UmFuZ2VcbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGNoZWNrRmllbGQgPSBmdW5jdGlvbihtZXRhLCBmaWVsZCkge1xuICAgICAgICBpZiAobWV0YSkge1xuICAgICAgICAgICAgaWYgKG1ldGEudHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdGaWVsZCBgJyArIGZpZWxkICsgJ2AgaXMgbm90IG9mIHR5cGUgYHN0cmluZ2AgaW4gbWV0YSBkYXRhLiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdGaWVsZCBgJyArIGZpZWxkICsgJ2AgaXMgbm90IHJlY29nbml6ZWQgaW4gbWV0YSBkYXRhLiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgdmFyIG5vcm1hbGl6ZVRlcm1zID0gZnVuY3Rpb24odGVybXMpIHtcbiAgICAgICAgdGVybXMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICBpZiAoYSA8IGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYSA+IGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRlcm1zO1xuICAgIH07XG5cbiAgICB2YXIgc2V0VGVybXNBZ2cgPSBmdW5jdGlvbihmaWVsZCwgdGVybXMpIHtcbiAgICAgICAgaWYgKCFmaWVsZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdUZXJtc0FnZyBgZmllbGRgIGlzIG1pc3NpbmcgZnJvbSBhcmd1bWVudC4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGVybXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdUZXJtc0FnZyBgdGVybXNgIGFyZSBtaXNzaW5nIGZyb20gYXJndW1lbnQuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG1ldGEgPSB0aGlzLl9tZXRhW2ZpZWxkXTtcbiAgICAgICAgaWYgKGNoZWNrRmllbGQobWV0YSwgZmllbGQpKSB7XG4gICAgICAgICAgICB0aGlzLl9wYXJhbXMudGVybXNfYWdnID0ge1xuICAgICAgICAgICAgICAgIGZpZWxkOiBmaWVsZCxcbiAgICAgICAgICAgICAgICB0ZXJtczogbm9ybWFsaXplVGVybXModGVybXMpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIGdldFRlcm1zQWdnID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJhbXMudGVybXNfYWdnO1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgc2V0VGVybXNBZ2c6IHNldFRlcm1zQWdnLFxuICAgICAgICBnZXRUZXJtc0FnZzogZ2V0VGVybXNBZ2dcbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGNoZWNrRmllbGQgPSBmdW5jdGlvbihtZXRhLCBmaWVsZCkge1xuICAgICAgICBpZiAobWV0YSkge1xuICAgICAgICAgICAgaWYgKG1ldGEudHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdGaWVsZCBgJyArIGZpZWxkICsgJ2AgaXMgbm90IG9mIHR5cGUgYHN0cmluZ2AgaW4gbWV0YSBkYXRhLiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdGaWVsZCBgJyArIGZpZWxkICsgJ2AgaXMgbm90IHJlY29nbml6ZWQgaW4gbWV0YSBkYXRhLiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgdmFyIG5vcm1hbGl6ZVRlcm1zID0gZnVuY3Rpb24odGVybXMpIHtcbiAgICAgICAgdGVybXMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICBpZiAoYSA8IGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYSA+IGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRlcm1zO1xuICAgIH07XG5cbiAgICB2YXIgYWRkVGVybXNGaWx0ZXIgPSBmdW5jdGlvbihmaWVsZCwgdGVybXMpIHtcbiAgICAgICAgaWYgKCFmaWVsZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdUZXJtc0ZpbHRlciBgZmllbGRgIGlzIG1pc3NpbmcgZnJvbSBhcmd1bWVudC4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGVybXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdUZXJtc0ZpbHRlciBgdGVybXNgIGFyZSBtaXNzaW5nIGZyb20gYXJndW1lbnQuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG1ldGEgPSB0aGlzLl9tZXRhW2ZpZWxkXTtcbiAgICAgICAgaWYgKGNoZWNrRmllbGQobWV0YSwgZmllbGQpKSB7XG4gICAgICAgICAgICB2YXIgZmlsdGVyID0gXy5maW5kKHRoaXMuX3BhcmFtcy50ZXJtc19maWx0ZXIsIGZ1bmN0aW9uKGZpbHRlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXIuZmllbGQgPT09IGZpZWxkO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdUZXJtc0ZpbHRlciB3aXRoIGBmaWVsZGAgb2YgYCcgKyBmaWVsZCArICdgIGFscmVhZHkgZXhpc3RzLCB1c2VkIGB1cGRhdGVSYW5nZWAgaW5zdGVhZC4nKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9wYXJhbXMudGVybXNfZmlsdGVyID0gdGhpcy5fcGFyYW1zLnRlcm1zX2ZpbHRlciB8fCBbXTtcbiAgICAgICAgICAgIHRoaXMuX3BhcmFtcy50ZXJtc19maWx0ZXIucHVzaCh7XG4gICAgICAgICAgICAgICAgZmllbGQ6IGZpZWxkLFxuICAgICAgICAgICAgICAgIHRlcm1zOiBub3JtYWxpemVUZXJtcyh0ZXJtcylcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIHVwZGF0ZVRlcm1zRmlsdGVyID0gZnVuY3Rpb24oZmllbGQsIHRlcm1zKSB7XG4gICAgICAgIHZhciBmaWx0ZXIgPSBfLmZpbmQodGhpcy5fcGFyYW1zLnRlcm1zX2ZpbHRlciwgZnVuY3Rpb24oZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyLmZpZWxkID09PSBmaWVsZDtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1JhbmdlIHdpdGggYGZpZWxkYCBvZiBgJyArIGZpZWxkICsgJ2AgZG9lcyBub3QgZXhpc3QuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRlcm1zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGZpbHRlci50ZXJtcyA9IG5vcm1hbGl6ZVRlcm1zKHRlcm1zKTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJFeHRyZW1hKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciByZW1vdmVUZXJtc0ZpbHRlciA9IGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgICAgIHZhciBmaWx0ZXIgPSBfLmZpbmQodGhpcy5fcGFyYW1zLnRlcm1zX2ZpbHRlciwgZnVuY3Rpb24oZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyLmZpZWxkID09PSBmaWVsZDtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1JhbmdlIHdpdGggYGZpZWxkYCBvZiBgJyArIGZpZWxkICsgJ2AgZG9lcyBub3QgZXhpc3QuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcGFyYW1zLnRlcm1zX2ZpbHRlciA9IF8uZmlsdGVyKHRoaXMuX3BhcmFtcy50ZXJtc19maWx0ZXIsIGZ1bmN0aW9uKGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlci5maWVsZCAhPT0gZmllbGQ7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIGdldFRlcm1zRmlsdGVyID0gZnVuY3Rpb24oZmllbGQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmFtcy50ZXJtc19maWx0ZXJbZmllbGRdO1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgYWRkVGVybXNGaWx0ZXI6IGFkZFRlcm1zRmlsdGVyLFxuICAgICAgICB1cGRhdGVUZXJtc0ZpbHRlcjogdXBkYXRlVGVybXNGaWx0ZXIsXG4gICAgICAgIHJlbW92ZVRlcm1zRmlsdGVyOiByZW1vdmVUZXJtc0ZpbHRlcixcbiAgICAgICAgZ2V0VGVybXNGaWx0ZXI6IGdldFRlcm1zRmlsdGVyXG4gICAgfTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBERUZBVUxUX1hfRklFTEQgPSAncGl4ZWwueCc7XG4gICAgdmFyIERFRkFVTFRfWV9GSUVMRCA9ICdwaXhlbC55JztcblxuICAgIHZhciBjaGVja0ZpZWxkID0gZnVuY3Rpb24obWV0YSwgZmllbGQpIHtcbiAgICAgICAgaWYgKG1ldGEpIHtcbiAgICAgICAgICAgIGlmIChtZXRhLmV4dHJlbWEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdGaWVsZCBgJyArIGZpZWxkICsgJ2AgaXMgbm90IG9yZGluYWwgaW4gbWV0YSBkYXRhLiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdGaWVsZCBgJyArIGZpZWxkICsgJ2AgaXMgbm90IHJlY29nbml6ZWQgaW4gbWV0YSBkYXRhLiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgdmFyIHNldFhGaWVsZCA9IGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgICAgIGlmIChmaWVsZCAhPT0gdGhpcy5fcGFyYW1zLmJpbm5pbmcueCkge1xuICAgICAgICAgICAgaWYgKGZpZWxkID09PSBERUZBVUxUX1hfRklFTEQpIHtcbiAgICAgICAgICAgICAgICAvLyByZXNldCBpZiBkZWZhdWx0XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1zLmJpbm5pbmcueCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbXMuYmlubmluZy5sZWZ0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtcy5iaW5uaW5nLnJpZ2h0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJFeHRyZW1hKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBtZXRhID0gdGhpcy5fbWV0YVtmaWVsZF07XG4gICAgICAgICAgICAgICAgaWYgKGNoZWNrRmllbGQobWV0YSwgZmllbGQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtcy5iaW5uaW5nLnggPSBmaWVsZDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1zLmJpbm5pbmcubGVmdCA9IG1ldGEuZXh0cmVtYS5taW47XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtcy5iaW5uaW5nLnJpZ2h0ID0gbWV0YS5leHRyZW1hLm1heDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciBnZXRYRmllbGQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmFtcy5iaW5uaW5nLng7XG4gICAgfTtcblxuICAgIHZhciBzZXRZRmllbGQgPSBmdW5jdGlvbihmaWVsZCkge1xuICAgICAgICBpZiAoZmllbGQgIT09IHRoaXMuX3BhcmFtcy5iaW5uaW5nLnkpIHtcbiAgICAgICAgICAgIGlmIChmaWVsZCA9PT0gREVGQVVMVF9ZX0ZJRUxEKSB7XG4gICAgICAgICAgICAgICAgLy8gcmVzZXQgaWYgZGVmYXVsdFxuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtcy5iaW5uaW5nLnkgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1zLmJpbm5pbmcuYm90dG9tID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtcy5iaW5uaW5nLnRvcCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgbWV0YSA9IHRoaXMuX21ldGFbZmllbGRdO1xuICAgICAgICAgICAgICAgIGlmIChjaGVja0ZpZWxkKG1ldGEsIGZpZWxkKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbXMuYmlubmluZy55ID0gZmllbGQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtcy5iaW5uaW5nLmJvdHRvbSA9IG1ldGEuZXh0cmVtYS5taW47XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtcy5iaW5uaW5nLnRvcCA9IG1ldGEuZXh0cmVtYS5tYXg7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJFeHRyZW1hKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0WUZpZWxkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJhbXMuYmlubmluZy55O1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgc2V0WEZpZWxkOiBzZXRYRmllbGQsXG4gICAgICAgIGdldFhGaWVsZDogZ2V0WEZpZWxkLFxuICAgICAgICBzZXRZRmllbGQ6IHNldFlGaWVsZCxcbiAgICAgICAgZ2V0WUZpZWxkOiBnZXRZRmllbGQsXG4gICAgICAgIERFRkFVTFRfWF9GSUVMRDogREVGQVVMVF9YX0ZJRUxELFxuICAgICAgICBERUZBVUxUX1lfRklFTEQ6IERFRkFVTFRfWV9GSUVMRFxuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgY2hlY2tGaWVsZCA9IGZ1bmN0aW9uKG1ldGEsIGZpZWxkKSB7XG4gICAgICAgIGlmIChtZXRhKSB7XG4gICAgICAgICAgICBpZiAobWV0YS50eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZpZWxkIGAnICsgZmllbGQgKyAnYCBpcyBub3Qgb2YgdHlwZSBgc3RyaW5nYCBpbiBtZXRhIGRhdGEuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZpZWxkIGAnICsgZmllbGQgKyAnYCBpcyBub3QgcmVjb2duaXplZCBpbiBtZXRhIGRhdGEuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICB2YXIgc2V0VG9wVGVybXMgPSBmdW5jdGlvbihmaWVsZCwgc2l6ZSkge1xuICAgICAgICBpZiAoIWZpZWxkKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1RvcFRlcm1zIGBmaWVsZGAgaXMgbWlzc2luZyBmcm9tIGFyZ3VtZW50LiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBtZXRhID0gdGhpcy5fbWV0YVtmaWVsZF07XG4gICAgICAgIGlmIChjaGVja0ZpZWxkKG1ldGEsIGZpZWxkKSkge1xuICAgICAgICAgICAgdGhpcy5fcGFyYW1zLnRvcF90ZXJtcyA9IHtcbiAgICAgICAgICAgICAgICBmaWVsZDogZmllbGQsXG4gICAgICAgICAgICAgICAgc2l6ZTogc2l6ZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJFeHRyZW1hKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciBnZXRUb3BUZXJtcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyYW1zLnRvcF90ZXJtcztcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIHNldFRvcFRlcm1zOiBzZXRUb3BUZXJtcyxcbiAgICAgICAgZ2V0VG9wVGVybXM6IGdldFRvcFRlcm1zXG4gICAgfTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBMaXZlID0gcmVxdWlyZSgnLi4vY29yZS9MaXZlJyk7XG4gICAgdmFyIEJpbm5pbmcgPSByZXF1aXJlKCcuLi9wYXJhbXMvQmlubmluZycpO1xuICAgIHZhciBNZXRyaWNBZ2cgPSByZXF1aXJlKCcuLi9wYXJhbXMvTWV0cmljQWdnJyk7XG4gICAgdmFyIFRlcm1zRmlsdGVyID0gcmVxdWlyZSgnLi4vcGFyYW1zL1Rlcm1zRmlsdGVyJyk7XG4gICAgdmFyIEJvb2xRdWVyeSA9IHJlcXVpcmUoJy4uL3BhcmFtcy9Cb29sUXVlcnknKTtcbiAgICB2YXIgUHJlZml4RmlsdGVyID0gcmVxdWlyZSgnLi4vcGFyYW1zL1ByZWZpeEZpbHRlcicpO1xuICAgIHZhciBSYW5nZSA9IHJlcXVpcmUoJy4uL3BhcmFtcy9SYW5nZScpO1xuICAgIHZhciBRdWVyeVN0cmluZyA9IHJlcXVpcmUoJy4uL3BhcmFtcy9RdWVyeVN0cmluZycpO1xuICAgIHZhciBDb2xvclJhbXAgPSByZXF1aXJlKCcuLi9taXhpbnMvQ29sb3JSYW1wJyk7XG4gICAgdmFyIFZhbHVlVHJhbnNmb3JtID0gcmVxdWlyZSgnLi4vbWl4aW5zL1ZhbHVlVHJhbnNmb3JtJyk7XG5cbiAgICB2YXIgSGVhdG1hcCA9IExpdmUuZXh0ZW5kKHtcblxuICAgICAgICBpbmNsdWRlczogW1xuICAgICAgICAgICAgLy8gcGFyYW1zXG4gICAgICAgICAgICBCaW5uaW5nLFxuICAgICAgICAgICAgTWV0cmljQWdnLFxuICAgICAgICAgICAgVGVybXNGaWx0ZXIsXG4gICAgICAgICAgICBCb29sUXVlcnksXG4gICAgICAgICAgICBQcmVmaXhGaWx0ZXIsXG4gICAgICAgICAgICBSYW5nZSxcbiAgICAgICAgICAgIFF1ZXJ5U3RyaW5nLFxuICAgICAgICAgICAgLy8gbWl4aW5zXG4gICAgICAgICAgICBDb2xvclJhbXAsXG4gICAgICAgICAgICBWYWx1ZVRyYW5zZm9ybVxuICAgICAgICBdLFxuXG4gICAgICAgIHR5cGU6ICdoZWF0bWFwJyxcblxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIENvbG9yUmFtcC5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICBWYWx1ZVRyYW5zZm9ybS5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAvLyBiYXNlXG4gICAgICAgICAgICBMaXZlLnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZXh0cmFjdEV4dHJlbWE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHZhciBiaW5zID0gbmV3IEZsb2F0NjRBcnJheShkYXRhKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbWluOiBfLm1pbihiaW5zKSxcbiAgICAgICAgICAgICAgICBtYXg6IF8ubWF4KGJpbnMpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gSGVhdG1hcDtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBMaXZlID0gcmVxdWlyZSgnLi4vY29yZS9MaXZlJyk7XG4gICAgdmFyIFRpbGluZyA9IHJlcXVpcmUoJy4uL3BhcmFtcy9UaWxpbmcnKTtcbiAgICB2YXIgVGVybXNGaWx0ZXIgPSByZXF1aXJlKCcuLi9wYXJhbXMvVGVybXNGaWx0ZXInKTtcbiAgICB2YXIgUHJlZml4RmlsdGVyID0gcmVxdWlyZSgnLi4vcGFyYW1zL1ByZWZpeEZpbHRlcicpO1xuICAgIHZhciBUb3BUZXJtcyA9IHJlcXVpcmUoJy4uL3BhcmFtcy9Ub3BUZXJtcycpO1xuICAgIHZhciBSYW5nZSA9IHJlcXVpcmUoJy4uL3BhcmFtcy9SYW5nZScpO1xuICAgIHZhciBIaXN0b2dyYW0gPSByZXF1aXJlKCcuLi9wYXJhbXMvSGlzdG9ncmFtJyk7XG4gICAgdmFyIFZhbHVlVHJhbnNmb3JtID0gcmVxdWlyZSgnLi4vbWl4aW5zL1ZhbHVlVHJhbnNmb3JtJyk7XG5cbiAgICB2YXIgVG9wQ291bnQgPSBMaXZlLmV4dGVuZCh7XG5cbiAgICAgICAgaW5jbHVkZXM6IFtcbiAgICAgICAgICAgIC8vIHBhcmFtc1xuICAgICAgICAgICAgVGlsaW5nLFxuICAgICAgICAgICAgVG9wVGVybXMsXG4gICAgICAgICAgICBUZXJtc0ZpbHRlcixcbiAgICAgICAgICAgIFByZWZpeEZpbHRlcixcbiAgICAgICAgICAgIFJhbmdlLFxuICAgICAgICAgICAgSGlzdG9ncmFtLFxuICAgICAgICAgICAgLy8gbWl4aW5zXG4gICAgICAgICAgICBWYWx1ZVRyYW5zZm9ybVxuICAgICAgICBdLFxuXG4gICAgICAgIHR5cGU6ICd0b3BfY291bnQnLFxuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgVmFsdWVUcmFuc2Zvcm0uaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgLy8gYmFzZVxuICAgICAgICAgICAgTGl2ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LFxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRvcENvdW50O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIExpdmUgPSByZXF1aXJlKCcuLi9jb3JlL0xpdmUnKTtcbiAgICB2YXIgVGlsaW5nID0gcmVxdWlyZSgnLi4vcGFyYW1zL1RpbGluZycpO1xuICAgIHZhciBUb3BUZXJtcyA9IHJlcXVpcmUoJy4uL3BhcmFtcy9Ub3BUZXJtcycpO1xuICAgIHZhciBUZXJtc0ZpbHRlciA9IHJlcXVpcmUoJy4uL3BhcmFtcy9UZXJtc0ZpbHRlcicpO1xuICAgIHZhciBQcmVmaXhGaWx0ZXIgPSByZXF1aXJlKCcuLi9wYXJhbXMvUHJlZml4RmlsdGVyJyk7XG4gICAgdmFyIFJhbmdlID0gcmVxdWlyZSgnLi4vcGFyYW1zL1JhbmdlJyk7XG4gICAgdmFyIERhdGVIaXN0b2dyYW0gPSByZXF1aXJlKCcuLi9wYXJhbXMvRGF0ZUhpc3RvZ3JhbScpO1xuICAgIHZhciBIaXN0b2dyYW0gPSByZXF1aXJlKCcuLi9wYXJhbXMvSGlzdG9ncmFtJyk7XG4gICAgdmFyIFZhbHVlVHJhbnNmb3JtID0gcmVxdWlyZSgnLi4vbWl4aW5zL1ZhbHVlVHJhbnNmb3JtJyk7XG5cbiAgICB2YXIgVG9wRnJlcXVlbmN5ID0gTGl2ZS5leHRlbmQoe1xuXG4gICAgICAgIGluY2x1ZGVzOiBbXG4gICAgICAgICAgICAvLyBwYXJhbXNcbiAgICAgICAgICAgIFRpbGluZyxcbiAgICAgICAgICAgIFRvcFRlcm1zLFxuICAgICAgICAgICAgVGVybXNGaWx0ZXIsXG4gICAgICAgICAgICBQcmVmaXhGaWx0ZXIsXG4gICAgICAgICAgICBSYW5nZSxcbiAgICAgICAgICAgIERhdGVIaXN0b2dyYW0sXG4gICAgICAgICAgICBIaXN0b2dyYW0sXG4gICAgICAgICAgICAvLyBtaXhpbnNcbiAgICAgICAgICAgIFZhbHVlVHJhbnNmb3JtXG4gICAgICAgIF0sXG5cbiAgICAgICAgdHlwZTogJ3RvcF9mcmVxdWVuY3knLFxuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgVmFsdWVUcmFuc2Zvcm0uaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgLy8gYmFzZVxuICAgICAgICAgICAgTGl2ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LFxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRvcEZyZXF1ZW5jeTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBMaXZlID0gcmVxdWlyZSgnLi4vY29yZS9MaXZlJyk7XG4gICAgdmFyIFRpbGluZyA9IHJlcXVpcmUoJy4uL3BhcmFtcy9UaWxpbmcnKTtcbiAgICB2YXIgVGVybXNBZ2cgPSByZXF1aXJlKCcuLi9wYXJhbXMvVGVybXNBZ2cnKTtcbiAgICB2YXIgUmFuZ2UgPSByZXF1aXJlKCcuLi9wYXJhbXMvUmFuZ2UnKTtcbiAgICB2YXIgSGlzdG9ncmFtID0gcmVxdWlyZSgnLi4vcGFyYW1zL0hpc3RvZ3JhbScpO1xuICAgIHZhciBWYWx1ZVRyYW5zZm9ybSA9IHJlcXVpcmUoJy4uL21peGlucy9WYWx1ZVRyYW5zZm9ybScpO1xuXG4gICAgdmFyIFRvcGljQ291bnQgPSBMaXZlLmV4dGVuZCh7XG5cbiAgICAgICAgaW5jbHVkZXM6IFtcbiAgICAgICAgICAgIC8vIHBhcmFtc1xuICAgICAgICAgICAgVGlsaW5nLFxuICAgICAgICAgICAgVGVybXNBZ2csXG4gICAgICAgICAgICBSYW5nZSxcbiAgICAgICAgICAgIEhpc3RvZ3JhbSxcbiAgICAgICAgICAgIC8vIG1peGluc1xuICAgICAgICAgICAgVmFsdWVUcmFuc2Zvcm1cbiAgICAgICAgXSxcblxuICAgICAgICB0eXBlOiAndG9waWNfY291bnQnLFxuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgVmFsdWVUcmFuc2Zvcm0uaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgLy8gYmFzZVxuICAgICAgICAgICAgTGl2ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LFxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRvcGljQ291bnQ7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgTGl2ZSA9IHJlcXVpcmUoJy4uL2NvcmUvTGl2ZScpO1xuICAgIHZhciBUaWxpbmcgPSByZXF1aXJlKCcuLi9wYXJhbXMvVGlsaW5nJyk7XG4gICAgdmFyIFRlcm1zQWdnID0gcmVxdWlyZSgnLi4vcGFyYW1zL1Rlcm1zQWdnJyk7XG4gICAgdmFyIFJhbmdlID0gcmVxdWlyZSgnLi4vcGFyYW1zL1JhbmdlJyk7XG4gICAgdmFyIERhdGVIaXN0b2dyYW0gPSByZXF1aXJlKCcuLi9wYXJhbXMvRGF0ZUhpc3RvZ3JhbScpO1xuICAgIHZhciBIaXN0b2dyYW0gPSByZXF1aXJlKCcuLi9wYXJhbXMvSGlzdG9ncmFtJyk7XG4gICAgdmFyIFZhbHVlVHJhbnNmb3JtID0gcmVxdWlyZSgnLi4vbWl4aW5zL1ZhbHVlVHJhbnNmb3JtJyk7XG5cbiAgICB2YXIgVG9waWNGcmVxdWVuY3kgPSBMaXZlLmV4dGVuZCh7XG5cbiAgICAgICAgaW5jbHVkZXM6IFtcbiAgICAgICAgICAgIC8vIHBhcmFtc1xuICAgICAgICAgICAgVGlsaW5nLFxuICAgICAgICAgICAgVGVybXNBZ2csXG4gICAgICAgICAgICBSYW5nZSxcbiAgICAgICAgICAgIERhdGVIaXN0b2dyYW0sXG4gICAgICAgICAgICBIaXN0b2dyYW0sXG4gICAgICAgICAgICAvLyBtaXhpbnNcbiAgICAgICAgICAgIFZhbHVlVHJhbnNmb3JtXG4gICAgICAgIF0sXG5cbiAgICAgICAgdHlwZTogJ3RvcGljX2ZyZXF1ZW5jeScsXG5cbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBWYWx1ZVRyYW5zZm9ybS5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAvLyBiYXNlXG4gICAgICAgICAgICBMaXZlLnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sXG5cbiAgICB9KTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gVG9waWNGcmVxdWVuY3k7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgRE9NID0gcmVxdWlyZSgnLi9ET00nKTtcblxuICAgIHZhciBDYW52YXMgPSBET00uZXh0ZW5kKHtcblxuICAgICAgICBfY3JlYXRlVGlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdGlsZSA9IEwuRG9tVXRpbC5jcmVhdGUoJ2NhbnZhcycsICdsZWFmbGV0LXRpbGUnKTtcbiAgICAgICAgICAgIHRpbGUud2lkdGggPSB0aWxlLmhlaWdodCA9IHRoaXMub3B0aW9ucy50aWxlU2l6ZTtcbiAgICAgICAgICAgIHRpbGUub25zZWxlY3RzdGFydCA9IHRpbGUub25tb3VzZW1vdmUgPSBMLlV0aWwuZmFsc2VGbjtcbiAgICAgICAgICAgIHJldHVybiB0aWxlO1xuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gQ2FudmFzO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIEltYWdlID0gcmVxdWlyZSgnLi4vLi4vbGF5ZXIvY29yZS9JbWFnZScpO1xuXG4gICAgdmFyIERPTSA9IEltYWdlLmV4dGVuZCh7XG5cbiAgICAgICAgb25BZGQ6IGZ1bmN0aW9uKG1hcCkge1xuICAgICAgICAgICAgTC5UaWxlTGF5ZXIucHJvdG90eXBlLm9uQWRkLmNhbGwodGhpcywgbWFwKTtcbiAgICAgICAgICAgIG1hcC5vbignem9vbXN0YXJ0JywgdGhpcy5jbGVhckV4dHJlbWEsIHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uUmVtb3ZlOiBmdW5jdGlvbihtYXApIHtcbiAgICAgICAgICAgIG1hcC5vZmYoJ3pvb21zdGFydCcsIHRoaXMuY2xlYXJFeHRyZW1hLCB0aGlzKTtcbiAgICAgICAgICAgIEwuVGlsZUxheWVyLnByb3RvdHlwZS5vblJlbW92ZS5jYWxsKHRoaXMsIG1hcCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVkcmF3OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9tYXApIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNldCh7XG4gICAgICAgICAgICAgICAgICAgIGhhcmQ6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9jcmVhdGVUaWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRlXG4gICAgICAgIH0sXG5cbiAgICAgICAgX2xvYWRUaWxlOiBmdW5jdGlvbih0aWxlLCB0aWxlUG9pbnQpIHtcbiAgICAgICAgICAgIHRpbGUuX2xheWVyID0gdGhpcztcbiAgICAgICAgICAgIHRpbGUuX3RpbGVQb2ludCA9IHRpbGVQb2ludDtcbiAgICAgICAgICAgIHRpbGUuX3VuYWRqdXN0ZWRUaWxlUG9pbnQgPSB7XG4gICAgICAgICAgICAgICAgeDogdGlsZVBvaW50LngsXG4gICAgICAgICAgICAgICAgeTogdGlsZVBvaW50LnlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aWxlLmRhdGFzZXQueCA9IHRpbGVQb2ludC54O1xuICAgICAgICAgICAgdGlsZS5kYXRhc2V0LnkgPSB0aWxlUG9pbnQueTtcbiAgICAgICAgICAgIHRoaXMuX2FkanVzdFRpbGVQb2ludCh0aWxlUG9pbnQpO1xuICAgICAgICAgICAgdGhpcy5fcmVkcmF3VGlsZSh0aWxlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfYWRqdXN0VGlsZUtleTogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICAvLyB3aGVuIGRlYWxpbmcgd2l0aCB3cmFwcGVkIHRpbGVzLCBpbnRlcm5hbGx5IGxlYWZldCB3aWxsIHVzZVxuICAgICAgICAgICAgLy8gY29vcmRpbmF0ZXMgbiA8IDAgYW5kIG4gPiAoMl56KSB0byBwb3NpdGlvbiB0aGVtIGNvcnJlY3RseS5cbiAgICAgICAgICAgIC8vIHRoaXMgZnVuY3Rpb24gY29udmVydHMgdGhhdCB0byB0aGUgbW9kdWxvcyBrZXkgdXNlZCB0byBjYWNoZSB0aGVtXG4gICAgICAgICAgICAvLyBkYXRhLlxuICAgICAgICAgICAgLy8gRXguICctMTozJyBhdCB6ID0gMiBiZWNvbWVzICczOjMnXG4gICAgICAgICAgICB2YXIga0FyciA9IGtleS5zcGxpdCgnOicpO1xuICAgICAgICAgICAgdmFyIHggPSBwYXJzZUludChrQXJyWzBdLCAxMCk7XG4gICAgICAgICAgICB2YXIgeSA9IHBhcnNlSW50KGtBcnJbMV0sIDEwKTtcbiAgICAgICAgICAgIHZhciB0aWxlUG9pbnQgPSB7XG4gICAgICAgICAgICAgICAgeDogeCxcbiAgICAgICAgICAgICAgICB5OiB5XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5fYWRqdXN0VGlsZVBvaW50KHRpbGVQb2ludCk7XG4gICAgICAgICAgICByZXR1cm4gdGlsZVBvaW50LnggKyAnOicgKyB0aWxlUG9pbnQueSArICc6JyArIHRpbGVQb2ludC56O1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZW1vdmVUaWxlOiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgIHZhciBhZGp1c3RlZEtleSA9IHRoaXMuX2FkanVzdFRpbGVLZXkoa2V5KTtcbiAgICAgICAgICAgIHZhciBjYWNoZWQgPSB0aGlzLl9jYWNoZVthZGp1c3RlZEtleV07XG4gICAgICAgICAgICAvLyByZW1vdmUgdGhlIHRpbGUgZnJvbSB0aGUgY2FjaGVcbiAgICAgICAgICAgIGRlbGV0ZSBjYWNoZWQudGlsZXNba2V5XTtcbiAgICAgICAgICAgIGlmIChfLmtleXMoY2FjaGVkLnRpbGVzKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyBubyBtb3JlIHRpbGVzIHVzZSB0aGlzIGNhY2hlZCBkYXRhLCBzbyBkZWxldGUgaXRcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fY2FjaGVbYWRqdXN0ZWRLZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY2FsbCBwYXJlbnQgbWV0aG9kXG4gICAgICAgICAgICBMLlRpbGVMYXllci5wcm90b3R5cGUuX3JlbW92ZVRpbGUuY2FsbCh0aGlzLCBrZXkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZWRyYXdUaWxlOiBmdW5jdGlvbih0aWxlKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgY2FjaGUgPSB0aGlzLl9jYWNoZTtcbiAgICAgICAgICAgIHZhciBjb29yZCA9IHtcbiAgICAgICAgICAgICAgICB4OiB0aWxlLl90aWxlUG9pbnQueCxcbiAgICAgICAgICAgICAgICB5OiB0aWxlLl90aWxlUG9pbnQueSxcbiAgICAgICAgICAgICAgICB6OiB0aGlzLl9tYXAuX3pvb21cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvLyB1c2UgdGhlIGFkanVzdGVkIGNvb3JkaW5hdGVzIHRvIGhhc2ggdGhlIHRoZSBjYWNoZSB2YWx1ZXMsIHRoaXNcbiAgICAgICAgICAgIC8vIGlzIGJlY2F1c2Ugd2Ugd2FudCB0byBvbmx5IGhhdmUgb25lIGNvcHkgb2YgdGhlIGRhdGFcbiAgICAgICAgICAgIHZhciBoYXNoID0gY29vcmQueCArICc6JyArIGNvb3JkLnkgKyAnOicgKyBjb29yZC56O1xuICAgICAgICAgICAgLy8gdXNlIHRoZSB1bmFkanN1dGVkIGNvb3JkaW5hdGVzIHRvIHRyYWNrIHdoaWNoICd3cmFwcGVkJyB0aWxlc1xuICAgICAgICAgICAgLy8gdXNlZCB0aGUgY2FjaGVkIGRhdGFcbiAgICAgICAgICAgIHZhciB1bmFkanVzdGVkSGFzaCA9IHRpbGUuX3VuYWRqdXN0ZWRUaWxlUG9pbnQueCArICc6JyArIHRpbGUuX3VuYWRqdXN0ZWRUaWxlUG9pbnQueTtcbiAgICAgICAgICAgIC8vIGNoZWNrIGNhY2hlXG4gICAgICAgICAgICB2YXIgY2FjaGVkID0gY2FjaGVbaGFzaF07XG4gICAgICAgICAgICBpZiAoY2FjaGVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNhY2hlZC5pc1BlbmRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY3VycmVudGx5IHBlbmRpbmdcbiAgICAgICAgICAgICAgICAgICAgLy8gc3RvcmUgdGhlIHRpbGUgaW4gdGhlIGNhY2hlIHRvIGRyYXcgdG8gbGF0ZXJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGVkLnRpbGVzW3VuYWRqdXN0ZWRIYXNoXSA9IHRpbGU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxyZWFkeSByZXF1ZXN0ZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gc3RvcmUgdGhlIHRpbGUgaW4gdGhlIGNhY2hlXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlZC50aWxlc1t1bmFkanVzdGVkSGFzaF0gPSB0aWxlO1xuICAgICAgICAgICAgICAgICAgICAvLyBkcmF3IHRoZSB0aWxlXG4gICAgICAgICAgICAgICAgICAgIHNlbGYucmVuZGVyVGlsZSh0aWxlLCBjYWNoZWQuZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGlsZURyYXduKHRpbGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIGEgY2FjaGUgZW50cnlcbiAgICAgICAgICAgICAgICBjYWNoZVtoYXNoXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgaXNQZW5kaW5nOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB0aWxlczoge30sXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IG51bGxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIC8vIGFkZCB0aWxlIHRvIHRoZSBjYWNoZSBlbnRyeVxuICAgICAgICAgICAgICAgIGNhY2hlW2hhc2hdLnRpbGVzW3VuYWRqdXN0ZWRIYXNoXSA9IHRpbGU7XG4gICAgICAgICAgICAgICAgLy8gcmVxdWVzdCB0aGUgdGlsZVxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdFRpbGUoY29vcmQsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhY2hlZCA9IGNhY2hlW2hhc2hdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWNhY2hlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGlsZSBpcyBubyBsb25nZXIgYmVpbmcgdHJhY2tlZCwgaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2FjaGVkLmlzUGVuZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBjYWNoZWQuZGF0YSA9IGRhdGE7XG4gICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgZXh0cmVtYVxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBzZWxmLnVwZGF0ZUV4dHJlbWEoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV4dHJlbWEgY2hhbmdlZCwgcmVkcmF3IGFsbCB0aWxlc1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZWRyYXcoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNhbWUgZXh0cmVtYSwgd2UgYXJlIGdvb2QgdG8gcmVuZGVyIHRoZSB0aWxlcy4gSW5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZSBjYXNlIG9mIGEgbWFwIHdpdGggd3JhcGFyb3VuZCwgd2UgbWF5IGhhdmVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG11bHRpcGxlIHRpbGVzIGRlcGVuZGVudCBvbiB0aGUgcmVzcG9uc2UsIHNvIGl0ZXJhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG92ZXIgZWFjaCB0aWxlIGFuZCBkcmF3IGl0LlxuICAgICAgICAgICAgICAgICAgICAgICAgXy5mb3JJbihjYWNoZWQudGlsZXMsIGZ1bmN0aW9uKHRpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnJlbmRlclRpbGUodGlsZSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi50aWxlRHJhd24odGlsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHRpbGVEcmF3bjogZnVuY3Rpb24odGlsZSkge1xuICAgICAgICAgICAgdGhpcy5fdGlsZU9uTG9hZC5jYWxsKHRpbGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlcXVlc3RUaWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRlXG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVuZGVyVGlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBvdmVycmlkZVxuICAgICAgICB9LFxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IERPTTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBET00gPSByZXF1aXJlKCcuL0RPTScpO1xuXG4gICAgdmFyIEhUTUwgPSBET00uZXh0ZW5kKHtcblxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBoYW5kbGVyczoge31cbiAgICAgICAgfSxcblxuICAgICAgICBvbkFkZDogZnVuY3Rpb24obWFwKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICBET00ucHJvdG90eXBlLm9uQWRkLmNhbGwodGhpcywgbWFwKTtcbiAgICAgICAgICAgIG1hcC5vbignY2xpY2snLCB0aGlzLm9uQ2xpY2ssIHRoaXMpO1xuICAgICAgICAgICAgJCh0aGlzLl9jb250YWluZXIpLm9uKCdtb3VzZW92ZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5vbk1vdXNlT3ZlcihlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJCh0aGlzLl9jb250YWluZXIpLm9uKCdtb3VzZW91dCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICBzZWxmLm9uTW91c2VPdXQoZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBvblJlbW92ZTogZnVuY3Rpb24obWFwKSB7XG4gICAgICAgICAgICBtYXAub2ZmKCdjbGljaycsIHRoaXMub25DbGljaywgdGhpcyk7XG4gICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikub2ZmKCdtb3VzZW92ZXInKTtcbiAgICAgICAgICAgICQodGhpcy5fY29udGFpbmVyKS5vZmYoJ21vdXNlb3V0Jyk7XG4gICAgICAgICAgICBET00ucHJvdG90eXBlLm9uUmVtb3ZlLmNhbGwodGhpcywgbWFwKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfY3JlYXRlVGlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdGlsZSA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdsZWFmbGV0LXRpbGUgbGVhZmxldC1odG1sLXRpbGUnKTtcbiAgICAgICAgICAgIHRpbGUud2lkdGggPSB0aGlzLm9wdGlvbnMudGlsZVNpemU7XG4gICAgICAgICAgICB0aWxlLmhlaWdodCA9IHRoaXMub3B0aW9ucy50aWxlU2l6ZTtcbiAgICAgICAgICAgIHRpbGUub25zZWxlY3RzdGFydCA9IEwuVXRpbC5mYWxzZUZuO1xuICAgICAgICAgICAgdGlsZS5vbm1vdXNlbW92ZSA9IEwuVXRpbC5mYWxzZUZuO1xuICAgICAgICAgICAgcmV0dXJuIHRpbGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25Nb3VzZU92ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gb3ZlcnJpZGVcbiAgICAgICAgfSxcblxuICAgICAgICBvbk1vdXNlT3V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRlXG4gICAgICAgIH0sXG5cblxuICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRlXG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBIVE1MO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGVzcGVyID0gcmVxdWlyZSgnZXNwZXInKTtcblxuICAgIGZ1bmN0aW9uIHRyYW5zbGF0aW9uTWF0cml4KHRyYW5zbGF0aW9uKSB7XG4gICAgICAgIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KFtcbiAgICAgICAgICAgIDEsIDAsIDAsIDAsXG4gICAgICAgICAgICAwLCAxLCAwLCAwLFxuICAgICAgICAgICAgMCwgMCwgMSwgMCxcbiAgICAgICAgICAgIHRyYW5zbGF0aW9uWzBdLCB0cmFuc2xhdGlvblsxXSwgdHJhbnNsYXRpb25bMl0sIDFcbiAgICAgICAgXSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb3J0aG9NYXRyaXgobGVmdCwgcmlnaHQsIGJvdHRvbSwgdG9wLCBuZWFyLCBmYXIpIHtcbiAgICAgICAgdmFyIG1hdCA9IG5ldyBGbG9hdDMyQXJyYXkoMTYpO1xuICAgICAgICBtYXRbMF0gPSAyIC8gKCByaWdodCAtIGxlZnQgKTtcbiAgICAgICAgbWF0WzFdID0gMDtcbiAgICAgICAgbWF0WzJdID0gMDtcbiAgICAgICAgbWF0WzNdID0gMDtcbiAgICAgICAgbWF0WzRdID0gMDtcbiAgICAgICAgbWF0WzVdID0gMiAvICggdG9wIC0gYm90dG9tICk7XG4gICAgICAgIG1hdFs2XSA9IDA7XG4gICAgICAgIG1hdFs3XSA9IDA7XG4gICAgICAgIG1hdFs4XSA9IDA7XG4gICAgICAgIG1hdFs5XSA9IDA7XG4gICAgICAgIG1hdFsxMF0gPSAtMiAvICggZmFyIC0gbmVhciApO1xuICAgICAgICBtYXRbMTFdID0gMDtcbiAgICAgICAgbWF0WzEyXSA9IC0oICggcmlnaHQgKyBsZWZ0ICkgLyAoIHJpZ2h0IC0gbGVmdCApICk7XG4gICAgICAgIG1hdFsxM10gPSAtKCAoIHRvcCArIGJvdHRvbSApIC8gKCB0b3AgLSBib3R0b20gKSApO1xuICAgICAgICBtYXRbMTRdID0gLSggKCBmYXIgKyBuZWFyICkgLyAoIGZhciAtIG5lYXIgKSApO1xuICAgICAgICBtYXRbMTVdID0gMTtcbiAgICAgICAgcmV0dXJuIG1hdDtcbiAgICB9XG5cbiAgICAvLyBUT0RPOlxuICAgIC8vICAgICAtIGZpeCB6b29tIHRyYW5zaXRpb24gYW5pbWF0aW9uIGJ1Z1xuICAgIC8vICAgICAtIGZpeCBzaG93IC8gaGlkZSBidWdcblxuICAgIHZhciBXZWJHTCA9IEwuQ2xhc3MuZXh0ZW5kKHtcblxuICAgICAgICBpbmNsdWRlczogW1xuICAgICAgICAgICAgTC5NaXhpbi5FdmVudHNcbiAgICAgICAgXSxcblxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBtaW5ab29tOiAwLFxuICAgICAgICAgICAgbWF4Wm9vbTogMTgsXG4gICAgICAgICAgICB6b29tT2Zmc2V0OiAwLFxuICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgIHNoYWRlcnM6IHtcbiAgICAgICAgICAgICAgICB2ZXJ0OiBudWxsLFxuICAgICAgICAgICAgICAgIGZyYWc6IG51bGxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1bmxvYWRJbnZpc2libGVUaWxlczogTC5Ccm93c2VyLm1vYmlsZSxcbiAgICAgICAgICAgIHVwZGF0ZVdoZW5JZGxlOiBMLkJyb3dzZXIubW9iaWxlXG4gICAgICAgIH0sXG5cbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24obWV0YSwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmJvdW5kcykge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuYm91bmRzID0gTC5sYXRMbmdCb3VuZHMob3B0aW9ucy5ib3VuZHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGdldE9wYWNpdHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5vcGFjaXR5O1xuICAgICAgICB9LFxuXG4gICAgICAgIHNob3c6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5faGlkZGVuID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl9wcmV2TWFwLmFkZExheWVyKHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhpZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5faGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3ByZXZNYXAgPSB0aGlzLl9tYXA7XG4gICAgICAgICAgICB0aGlzLl9tYXAucmVtb3ZlTGF5ZXIodGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNIaWRkZW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2hpZGRlbjtcbiAgICAgICAgfSxcblxuICAgICAgICBvbkFkZDogZnVuY3Rpb24obWFwKSB7XG4gICAgICAgICAgICB0aGlzLl9tYXAgPSBtYXA7XG4gICAgICAgICAgICB0aGlzLl9hbmltYXRlZCA9IG1hcC5fem9vbUFuaW1hdGVkO1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9jYW52YXMpIHtcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgY2FudmFzXG4gICAgICAgICAgICAgICAgdGhpcy5faW5pdENhbnZhcygpO1xuICAgICAgICAgICAgICAgIG1hcC5fcGFuZXMudGlsZVBhbmUuYXBwZW5kQ2hpbGQodGhpcy5fY2FudmFzKTtcbiAgICAgICAgICAgICAgICAvLyBpbml0aWFsaXplIHRoZSB3ZWJnbCBjb250ZXh0XG4gICAgICAgICAgICAgICAgdGhpcy5faW5pdEdMKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1hcC5fcGFuZXMudGlsZVBhbmUuYXBwZW5kQ2hpbGQodGhpcy5fY2FudmFzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHNldCB1cCBldmVudHNcbiAgICAgICAgICAgIG1hcC5vbih7XG4gICAgICAgICAgICAgICAgJ3Jlc2l6ZSc6IHRoaXMuX3Jlc2l6ZSxcbiAgICAgICAgICAgICAgICAndmlld3Jlc2V0JzogdGhpcy5fcmVzZXQsXG4gICAgICAgICAgICAgICAgJ21vdmVlbmQnOiB0aGlzLl91cGRhdGUsXG4gICAgICAgICAgICAgICAgJ3pvb21zdGFydCc6IHRoaXMuY2xlYXJFeHRyZW1hXG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIGlmIChtYXAub3B0aW9ucy56b29tQW5pbWF0aW9uICYmIEwuQnJvd3Nlci5hbnkzZCkge1xuICAgICAgICAgICAgICAgIG1hcC5vbih7XG4gICAgICAgICAgICAgICAgICAgICd6b29tc3RhcnQnOiB0aGlzLl9lbmFibGVab29taW5nLFxuICAgICAgICAgICAgICAgICAgICAnem9vbWFuaW0nOiB0aGlzLl9hbmltYXRlWm9vbSxcbiAgICAgICAgICAgICAgICAgICAgJ3pvb21lbmQnOiB0aGlzLl9kaXNhYmxlWm9vbWluZyxcbiAgICAgICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdGhpcy5vcHRpb25zLnVwZGF0ZVdoZW5JZGxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGltaXRlZFVwZGF0ZSA9IEwuVXRpbC5saW1pdEV4ZWNCeUludGVydmFsKHRoaXMuX3VwZGF0ZSwgMTUwLCB0aGlzKTtcbiAgICAgICAgICAgICAgICBtYXAub24oJ21vdmUnLCB0aGlzLl9saW1pdGVkVXBkYXRlLCB0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3Jlc2V0KCk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGUoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGRUbzogZnVuY3Rpb24obWFwKSB7XG4gICAgICAgICAgICBtYXAuYWRkTGF5ZXIodGhpcyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBvblJlbW92ZTogZnVuY3Rpb24obWFwKSB7XG4gICAgICAgICAgICAvLyBjbGVhciB0aGUgY3VycmVudCBidWZmZXJcbiAgICAgICAgICAgIHRoaXMuX2NsZWFyQmFja0J1ZmZlcigpO1xuICAgICAgICAgICAgbWFwLmdldFBhbmVzKCkudGlsZVBhbmUucmVtb3ZlQ2hpbGQodGhpcy5fY2FudmFzKTtcbiAgICAgICAgICAgIG1hcC5vZmYoe1xuICAgICAgICAgICAgICAgICdyZXNpemUnOiB0aGlzLl9yZXNpemUsXG4gICAgICAgICAgICAgICAgJ3ZpZXdyZXNldCc6IHRoaXMuX3Jlc2V0LFxuICAgICAgICAgICAgICAgICdtb3ZlZW5kJzogdGhpcy5fdXBkYXRlLFxuICAgICAgICAgICAgICAgICd6b29tc3RhcnQnOiB0aGlzLmNsZWFyRXh0cmVtYVxuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICBpZiAobWFwLm9wdGlvbnMuem9vbUFuaW1hdGlvbikge1xuICAgICAgICAgICAgICAgIG1hcC5vZmYoe1xuICAgICAgICAgICAgICAgICAgICAnem9vbXN0YXJ0JzogdGhpcy5fZW5hYmxlWm9vbWluZyxcbiAgICAgICAgICAgICAgICAgICAgJ3pvb21hbmltJzogdGhpcy5fYW5pbWF0ZVpvb20sXG4gICAgICAgICAgICAgICAgICAgICd6b29tZW5kJzogdGhpcy5fZGlzYWJsZVpvb21pbmdcbiAgICAgICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdGhpcy5vcHRpb25zLnVwZGF0ZVdoZW5JZGxlKSB7XG4gICAgICAgICAgICAgICAgbWFwLm9mZignbW92ZScsIHRoaXMuX2xpbWl0ZWRVcGRhdGUsIHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fbWFwID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX2FuaW1hdGVkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX2lzWm9vbWluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5fY2FjaGUgPSB7fTtcbiAgICAgICAgfSxcblxuICAgICAgICBfZW5hYmxlWm9vbWluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLl9pc1pvb21pbmcgPSB0cnVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9kaXNhYmxlWm9vbWluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLl9pc1pvb21pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX2NsZWFyQmFja0J1ZmZlcigpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGJyaW5nVG9Gcm9udDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgcGFuZSA9IHRoaXMuX21hcC5fcGFuZXMudGlsZVBhbmU7XG4gICAgICAgICAgICBpZiAodGhpcy5fY2FudmFzKSB7XG4gICAgICAgICAgICAgICAgcGFuZS5hcHBlbmRDaGlsZCh0aGlzLl9jYW52YXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3NldEF1dG9aSW5kZXgocGFuZSwgTWF0aC5tYXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYnJpbmdUb0JhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHBhbmUgPSB0aGlzLl9tYXAuX3BhbmVzLnRpbGVQYW5lO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2NhbnZhcykge1xuICAgICAgICAgICAgICAgIHBhbmUuaW5zZXJ0QmVmb3JlKHRoaXMuX2NhbnZhcywgcGFuZS5maXJzdENoaWxkKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRBdXRvWkluZGV4KHBhbmUsIE1hdGgubWluKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9zZXRBdXRvWkluZGV4OiBmdW5jdGlvbihwYW5lLCBjb21wYXJlKSB7XG4gICAgICAgICAgICB2YXIgbGF5ZXJzID0gcGFuZS5jaGlsZHJlbjtcbiAgICAgICAgICAgIHZhciBlZGdlWkluZGV4ID0gLWNvbXBhcmUoSW5maW5pdHksIC1JbmZpbml0eSk7IC8vIC1JbmZpbml0eSBmb3IgbWF4LCBJbmZpbml0eSBmb3IgbWluXG4gICAgICAgICAgICB2YXIgekluZGV4O1xuICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICB2YXIgbGVuO1xuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gbGF5ZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxheWVyc1tpXSAhPT0gdGhpcy5fY2FudmFzKSB7XG4gICAgICAgICAgICAgICAgICAgIHpJbmRleCA9IHBhcnNlSW50KGxheWVyc1tpXS5zdHlsZS56SW5kZXgsIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc05hTih6SW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlZGdlWkluZGV4ID0gY29tcGFyZShlZGdlWkluZGV4LCB6SW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnpJbmRleCA9IHRoaXMuX2NhbnZhcy5zdHlsZS56SW5kZXggPSAoaXNGaW5pdGUoZWRnZVpJbmRleCkgPyBlZGdlWkluZGV4IDogMCkgKyBjb21wYXJlKDEsIC0xKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRPcGFjaXR5OiBmdW5jdGlvbihvcGFjaXR5KSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMub3BhY2l0eSA9IG9wYWNpdHk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRaSW5kZXg6IGZ1bmN0aW9uKHpJbmRleCkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnpJbmRleCA9IHpJbmRleDtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVpJbmRleCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3VwZGF0ZVpJbmRleDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fY2FudmFzICYmIHRoaXMub3B0aW9ucy56SW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS56SW5kZXggPSB0aGlzLm9wdGlvbnMuekluZGV4O1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9yZXNldDogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgXy5mb3JJbih0aGlzLl90aWxlcywgZnVuY3Rpb24odGlsZSkge1xuICAgICAgICAgICAgICAgIHNlbGYuZmlyZSgndGlsZXVubG9hZCcsIHtcbiAgICAgICAgICAgICAgICAgICAgdGlsZTogdGlsZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl90aWxlcyA9IHt9O1xuICAgICAgICAgICAgdGhpcy5fdGlsZXNUb0xvYWQgPSAwO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2FuaW1hdGVkICYmIGUgJiYgZS5oYXJkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY2xlYXJCYWNrQnVmZmVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3VwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX21hcCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBtYXAgPSB0aGlzLl9tYXA7XG4gICAgICAgICAgICB2YXIgYm91bmRzID0gbWFwLmdldFBpeGVsQm91bmRzKCk7XG4gICAgICAgICAgICB2YXIgem9vbSA9IG1hcC5nZXRab29tKCk7XG4gICAgICAgICAgICB2YXIgdGlsZVNpemUgPSB0aGlzLl9nZXRUaWxlU2l6ZSgpO1xuICAgICAgICAgICAgaWYgKHpvb20gPiB0aGlzLm9wdGlvbnMubWF4Wm9vbSB8fFxuICAgICAgICAgICAgICAgIHpvb20gPCB0aGlzLm9wdGlvbnMubWluWm9vbSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0aWxlQm91bmRzID0gTC5ib3VuZHMoXG4gICAgICAgICAgICAgICAgYm91bmRzLm1pbi5kaXZpZGVCeSh0aWxlU2l6ZSkuX2Zsb29yKCksXG4gICAgICAgICAgICAgICAgYm91bmRzLm1heC5kaXZpZGVCeSh0aWxlU2l6ZSkuX2Zsb29yKCkpO1xuICAgICAgICAgICAgdGhpcy5fYWRkVGlsZXNGcm9tQ2VudGVyT3V0KHRpbGVCb3VuZHMpO1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy51bmxvYWRJbnZpc2libGVUaWxlcykge1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbW92ZU90aGVyVGlsZXModGlsZUJvdW5kcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2FkZFRpbGVzRnJvbUNlbnRlck91dDogZnVuY3Rpb24oYm91bmRzKSB7XG4gICAgICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgICAgIHZhciBjZW50ZXIgPSBib3VuZHMuZ2V0Q2VudGVyKCk7XG4gICAgICAgICAgICB2YXIgajtcbiAgICAgICAgICAgIHZhciBpO1xuICAgICAgICAgICAgdmFyIHBvaW50O1xuICAgICAgICAgICAgZm9yIChqID0gYm91bmRzLm1pbi55OyBqIDw9IGJvdW5kcy5tYXgueTsgaisrKSB7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gYm91bmRzLm1pbi54OyBpIDw9IGJvdW5kcy5tYXgueDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHBvaW50ID0gbmV3IEwuUG9pbnQoaSwgaik7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl90aWxlU2hvdWxkQmVMb2FkZWQocG9pbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZS5wdXNoKHBvaW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0aWxlc1RvTG9hZCA9IHF1ZXVlLmxlbmd0aDtcbiAgICAgICAgICAgIGlmICh0aWxlc1RvTG9hZCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGxvYWQgdGlsZXMgaW4gb3JkZXIgb2YgdGhlaXIgZGlzdGFuY2UgdG8gY2VudGVyXG4gICAgICAgICAgICBxdWV1ZS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYS5kaXN0YW5jZVRvKGNlbnRlcikgLSBiLmRpc3RhbmNlVG8oY2VudGVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gaWYgaXRzIHRoZSBmaXJzdCBiYXRjaCBvZiB0aWxlcyB0byBsb2FkXG4gICAgICAgICAgICBpZiAoIXRoaXMuX3RpbGVzVG9Mb2FkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdsb2FkaW5nJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl90aWxlc1RvTG9hZCArPSB0aWxlc1RvTG9hZDtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aWxlc1RvTG9hZDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWRkVGlsZShxdWV1ZVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3RpbGVTaG91bGRCZUxvYWRlZDogZnVuY3Rpb24odGlsZVBvaW50KSB7XG4gICAgICAgICAgICBpZiAoKHRpbGVQb2ludC54ICsgJzonICsgdGlsZVBvaW50LnkpIGluIHRoaXMuX3RpbGVzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBhbHJlYWR5IGxvYWRlZFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMuY29udGludW91c1dvcmxkKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpbWl0ID0gdGhpcy5fZ2V0V3JhcFRpbGVOdW0oKTtcbiAgICAgICAgICAgICAgICAvLyBkb24ndCBsb2FkIGlmIGV4Y2VlZHMgd29ybGQgYm91bmRzXG4gICAgICAgICAgICAgICAgaWYgKChvcHRpb25zLm5vV3JhcCAmJiAodGlsZVBvaW50LnggPCAwIHx8IHRpbGVQb2ludC54ID49IGxpbWl0LngpKSB8fFxuICAgICAgICAgICAgICAgICAgICB0aWxlUG9pbnQueSA8IDAgfHwgdGlsZVBvaW50LnkgPj0gbGltaXQueSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYm91bmRzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRpbGVTaXplID0gdGhpcy5fZ2V0VGlsZVNpemUoKTtcbiAgICAgICAgICAgICAgICB2YXIgbndQb2ludCA9IHRpbGVQb2ludC5tdWx0aXBseUJ5KHRpbGVTaXplKTtcbiAgICAgICAgICAgICAgICB2YXIgc2VQb2ludCA9IG53UG9pbnQuYWRkKFt0aWxlU2l6ZSwgdGlsZVNpemVdKTtcbiAgICAgICAgICAgICAgICB2YXIgbncgPSB0aGlzLl9tYXAudW5wcm9qZWN0KG53UG9pbnQpO1xuICAgICAgICAgICAgICAgIHZhciBzZSA9IHRoaXMuX21hcC51bnByb2plY3Qoc2VQb2ludCk7XG4gICAgICAgICAgICAgICAgLy8gVE9ETyB0ZW1wb3JhcnkgaGFjaywgd2lsbCBiZSByZW1vdmVkIGFmdGVyIHJlZmFjdG9yaW5nIHByb2plY3Rpb25zXG4gICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0xlYWZsZXQvTGVhZmxldC9pc3N1ZXMvMTYxOFxuICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5jb250aW51b3VzV29ybGQgJiYgIW9wdGlvbnMubm9XcmFwKSB7XG4gICAgICAgICAgICAgICAgICAgIG53ID0gbncud3JhcCgpO1xuICAgICAgICAgICAgICAgICAgICBzZSA9IHNlLndyYXAoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLmJvdW5kcy5pbnRlcnNlY3RzKFtudywgc2VdKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3JlbW92ZU90aGVyVGlsZXM6IGZ1bmN0aW9uKGJvdW5kcykge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgXy5mb3JJbih0aGlzLl90aWxlcywgZnVuY3Rpb24odGlsZSwga2V5KSB7XG4gICAgICAgICAgICAgICAgdmFyIGtBcnIgPSBrZXkuc3BsaXQoJzonKTtcbiAgICAgICAgICAgICAgICB2YXIgeCA9IHBhcnNlSW50KGtBcnJbMF0sIDEwKTtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IHBhcnNlSW50KGtBcnJbMV0sIDEwKTtcbiAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGlsZSBpZiBpdCdzIG91dCBvZiBib3VuZHNcbiAgICAgICAgICAgICAgICBpZiAoeCA8IGJvdW5kcy5taW4ueCB8fFxuICAgICAgICAgICAgICAgICAgICB4ID4gYm91bmRzLm1heC54IHx8XG4gICAgICAgICAgICAgICAgICAgIHkgPCBib3VuZHMubWluLnkgfHxcbiAgICAgICAgICAgICAgICAgICAgeSA+IGJvdW5kcy5tYXgueSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9yZW1vdmVUaWxlKGtleSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2dldFRpbGVTaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBtYXAgPSB0aGlzLl9tYXA7XG4gICAgICAgICAgICB2YXIgem9vbSA9IG1hcC5nZXRab29tKCkgKyB0aGlzLm9wdGlvbnMuem9vbU9mZnNldDtcbiAgICAgICAgICAgIHZhciB6b29tTiA9IHRoaXMub3B0aW9ucy5tYXhOYXRpdmVab29tO1xuICAgICAgICAgICAgdmFyIHRpbGVTaXplID0gMjU2O1xuICAgICAgICAgICAgaWYgKHpvb21OICYmIHpvb20gPiB6b29tTikge1xuICAgICAgICAgICAgICAgIHRpbGVTaXplID0gTWF0aC5yb3VuZChtYXAuZ2V0Wm9vbVNjYWxlKHpvb20pIC8gbWFwLmdldFpvb21TY2FsZSh6b29tTikgKiB0aWxlU2l6ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGlsZVNpemU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVkcmF3OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9tYXApIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNldCh7XG4gICAgICAgICAgICAgICAgICAgIGhhcmQ6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9jcmVhdGVUaWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgfSxcblxuICAgICAgICBfYWRkVGlsZTogZnVuY3Rpb24odGlsZVBvaW50KSB7XG4gICAgICAgICAgICAvLyBjcmVhdGUgYSBuZXcgdGlsZVxuICAgICAgICAgICAgdmFyIHRpbGUgPSB0aGlzLl9jcmVhdGVUaWxlKCk7XG4gICAgICAgICAgICB0aGlzLl90aWxlc1t0aWxlUG9pbnQueCArICc6JyArIHRpbGVQb2ludC55XSA9IHRpbGU7XG4gICAgICAgICAgICB0aGlzLl9sb2FkVGlsZSh0aWxlLCB0aWxlUG9pbnQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9sb2FkVGlsZTogZnVuY3Rpb24odGlsZSwgdGlsZVBvaW50KSB7XG4gICAgICAgICAgICB0aWxlLl9sYXllciA9IHRoaXM7XG4gICAgICAgICAgICB0aWxlLl90aWxlUG9pbnQgPSB0aWxlUG9pbnQ7XG4gICAgICAgICAgICB0aWxlLl91bmFkanVzdGVkVGlsZVBvaW50ID0ge1xuICAgICAgICAgICAgICAgIHg6IHRpbGVQb2ludC54LFxuICAgICAgICAgICAgICAgIHk6IHRpbGVQb2ludC55XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5fYWRqdXN0VGlsZVBvaW50KHRpbGVQb2ludCk7XG4gICAgICAgICAgICB0aGlzLl9yZWRyYXdUaWxlKHRpbGUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9hZGp1c3RUaWxlS2V5OiBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgIC8vIHdoZW4gZGVhbGluZyB3aXRoIHdyYXBwZWQgdGlsZXMsIGludGVybmFsbHkgbGVhZmV0IHdpbGwgdXNlXG4gICAgICAgICAgICAvLyBjb29yZGluYXRlcyBuIDwgMCBhbmQgbiA+ICgyXnopIHRvIHBvc2l0aW9uIHRoZW0gY29ycmVjdGx5LlxuICAgICAgICAgICAgLy8gdGhpcyBmdW5jdGlvbiBjb252ZXJ0cyB0aGF0IHRvIHRoZSBtb2R1bG9zIGtleSB1c2VkIHRvIGNhY2hlIHRoZW1cbiAgICAgICAgICAgIC8vIGRhdGEuXG4gICAgICAgICAgICAvLyBFeC4gJy0xOjMnIGF0IHogPSAyIGJlY29tZXMgJzM6MydcbiAgICAgICAgICAgIHZhciBrQXJyID0ga2V5LnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICB2YXIgeCA9IHBhcnNlSW50KGtBcnJbMF0sIDEwKTtcbiAgICAgICAgICAgIHZhciB5ID0gcGFyc2VJbnQoa0FyclsxXSwgMTApO1xuICAgICAgICAgICAgdmFyIHRpbGVQb2ludCA9IHtcbiAgICAgICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgICAgIHk6IHlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLl9hZGp1c3RUaWxlUG9pbnQodGlsZVBvaW50KTtcbiAgICAgICAgICAgIHJldHVybiB0aWxlUG9pbnQueCArICc6JyArIHRpbGVQb2ludC55ICsgJzonICsgdGlsZVBvaW50Lno7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2dldFpvb21Gb3JVcmw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICAgICAgICB2YXIgem9vbSA9IHRoaXMuX21hcC5nZXRab29tKCk7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy56b29tUmV2ZXJzZSkge1xuICAgICAgICAgICAgICAgIHpvb20gPSBvcHRpb25zLm1heFpvb20gLSB6b29tO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgem9vbSArPSBvcHRpb25zLnpvb21PZmZzZXQ7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5tYXhOYXRpdmVab29tID8gTWF0aC5taW4oem9vbSwgb3B0aW9ucy5tYXhOYXRpdmVab29tKSA6IHpvb207XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2dldFRpbGVQb3M6IGZ1bmN0aW9uKHRpbGVQb2ludCkge1xuICAgICAgICAgICAgdmFyIG9yaWdpbiA9IHRoaXMuX21hcC5nZXRQaXhlbE9yaWdpbigpO1xuICAgICAgICAgICAgdmFyIHRpbGVTaXplID0gdGhpcy5fZ2V0VGlsZVNpemUoKTtcbiAgICAgICAgICAgIHJldHVybiB0aWxlUG9pbnQubXVsdGlwbHlCeSh0aWxlU2l6ZSkuc3VidHJhY3Qob3JpZ2luKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfZ2V0V3JhcFRpbGVOdW06IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGNycyA9IHRoaXMuX21hcC5vcHRpb25zLmNycztcbiAgICAgICAgICAgIHZhciBzaXplID0gY3JzLmdldFNpemUodGhpcy5fbWFwLmdldFpvb20oKSk7XG4gICAgICAgICAgICByZXR1cm4gc2l6ZS5kaXZpZGVCeSh0aGlzLl9nZXRUaWxlU2l6ZSgpKS5fZmxvb3IoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfYWRqdXN0VGlsZVBvaW50OiBmdW5jdGlvbih0aWxlUG9pbnQpIHtcbiAgICAgICAgICAgIHZhciBsaW1pdCA9IHRoaXMuX2dldFdyYXBUaWxlTnVtKCk7XG4gICAgICAgICAgICAvLyB3cmFwIHRpbGUgY29vcmRpbmF0ZXNcbiAgICAgICAgICAgIGlmICghdGhpcy5vcHRpb25zLmNvbnRpbnVvdXNXb3JsZCAmJiAhdGhpcy5vcHRpb25zLm5vV3JhcCkge1xuICAgICAgICAgICAgICAgIHRpbGVQb2ludC54ID0gKCh0aWxlUG9pbnQueCAlIGxpbWl0LngpICsgbGltaXQueCkgJSBsaW1pdC54O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50bXMpIHtcbiAgICAgICAgICAgICAgICB0aWxlUG9pbnQueSA9IGxpbWl0LnkgLSB0aWxlUG9pbnQueSAtIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aWxlUG9pbnQueiA9IHRoaXMuX2dldFpvb21Gb3JVcmwoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfcmVtb3ZlVGlsZTogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICB2YXIgYWRqdXN0ZWRLZXkgPSB0aGlzLl9hZGp1c3RUaWxlS2V5KGtleSk7XG4gICAgICAgICAgICB2YXIgY2FjaGVkID0gdGhpcy5fY2FjaGVbYWRqdXN0ZWRLZXldO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSB0aWxlIGZyb20gdGhlIGNhY2hlXG4gICAgICAgICAgICBkZWxldGUgY2FjaGVkLnRpbGVzW2tleV07XG4gICAgICAgICAgICBpZiAoXy5rZXlzKGNhY2hlZC50aWxlcykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgLy8gbm8gbW9yZSB0aWxlcyB1c2UgdGhpcyBjYWNoZWQgZGF0YSwgc28gZGVsZXRlIGl0XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2NhY2hlW2FkanVzdGVkS2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHVubG9hZCB0aGUgdGlsZVxuICAgICAgICAgICAgdmFyIHRpbGUgPSB0aGlzLl90aWxlc1trZXldO1xuICAgICAgICAgICAgdGhpcy5maXJlKCd0aWxldW5sb2FkJywge1xuICAgICAgICAgICAgICAgIHRpbGU6IHRpbGVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3RpbGVzW2tleV07XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3RpbGVMb2FkZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5fdGlsZXNUb0xvYWQtLTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9hbmltYXRlZCkge1xuICAgICAgICAgICAgICAgIEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLl9jYW52YXMsICdsZWFmbGV0LXpvb20tYW5pbWF0ZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdGhpcy5fdGlsZXNUb0xvYWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ2xvYWQnKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fYW5pbWF0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2xlYXIgc2NhbGVkIHRpbGVzIGFmdGVyIGFsbCBuZXcgdGlsZXMgYXJlIGxvYWRlZCAoZm9yIHBlcmZvcm1hbmNlKVxuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fY2xlYXJCdWZmZXJUaW1lcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NsZWFyQnVmZmVyVGltZXIgPSBzZXRUaW1lb3V0KEwuYmluZCh0aGlzLl9jbGVhckJhY2tCdWZmZXIsIHRoaXMpLCA1MDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBfdGlsZU9uTG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbGF5ZXIgPSB0aGlzLl9sYXllcjtcbiAgICAgICAgICAgIEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLCAnbGVhZmxldC10aWxlLWxvYWRlZCcpO1xuICAgICAgICAgICAgbGF5ZXIuZmlyZSgndGlsZWxvYWQnLCB7XG4gICAgICAgICAgICAgICAgdGlsZTogdGhpc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBsYXllci5fdGlsZUxvYWRlZCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF90aWxlT25FcnJvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbGF5ZXIgPSB0aGlzLl9sYXllcjtcbiAgICAgICAgICAgIGxheWVyLmZpcmUoJ3RpbGVlcnJvcicsIHtcbiAgICAgICAgICAgICAgICB0aWxlOiB0aGlzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGxheWVyLl90aWxlTG9hZGVkKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2VuY29kZUZsb2F0QXNVaW50ODogZnVuY3Rpb24obnVtKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoW1xuICAgICAgICAgICAgICAgIChudW0gJiAweGZmMDAwMDAwKSA+PiAyNCxcbiAgICAgICAgICAgICAgICAobnVtICYgMHgwMGZmMDAwMCkgPj4gMTYsXG4gICAgICAgICAgICAgICAgKG51bSAmIDB4MDAwMGZmMDApID4+IDgsXG4gICAgICAgICAgICAgICAgKG51bSAmIDB4MDAwMDAwZmYpXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfY3JlYXRlRGF0YVRleHR1cmU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHZhciBkb3VibGVzID0gbmV3IEZsb2F0NjRBcnJheShkYXRhKTtcbiAgICAgICAgICAgIHZhciByZXNvbHV0aW9uID0gTWF0aC5zcXJ0KGRvdWJsZXMubGVuZ3RoKTtcbiAgICAgICAgICAgIHZhciBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIocmVzb2x1dGlvbiAqIHJlc29sdXRpb24gKiA0KTtcbiAgICAgICAgICAgIHZhciBlbmNvZGVkQmlucyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc29sdXRpb24gKiByZXNvbHV0aW9uOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyBjYXN0IGZyb20gZmxvYXQ2NCB0byBmbG9hdDMyXG4gICAgICAgICAgICAgICAgdmFyIGVuYyA9IHRoaXMuX2VuY29kZUZsb2F0QXNVaW50OChkb3VibGVzW2ldKTtcbiAgICAgICAgICAgICAgICBlbmNvZGVkQmluc1tpICogNF0gPSBlbmNbMF07XG4gICAgICAgICAgICAgICAgZW5jb2RlZEJpbnNbaSAqIDQgKyAxXSA9IGVuY1sxXTtcbiAgICAgICAgICAgICAgICBlbmNvZGVkQmluc1tpICogNCArIDJdID0gZW5jWzJdO1xuICAgICAgICAgICAgICAgIGVuY29kZWRCaW5zW2kgKiA0ICsgM10gPSBlbmNbM107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IGVzcGVyLlRleHR1cmUyRCh7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiByZXNvbHV0aW9uLFxuICAgICAgICAgICAgICAgIHdpZHRoOiByZXNvbHV0aW9uLFxuICAgICAgICAgICAgICAgIGRhdGE6IGVuY29kZWRCaW5zLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ1JHQkEnLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdVTlNJR05FRF9CWVRFJyxcbiAgICAgICAgICAgICAgICB3cmFwOiAnQ0xBTVBfVE9fRURHRScsXG4gICAgICAgICAgICAgICAgZmlsdGVyOiAnTkVBUkVTVCcsXG4gICAgICAgICAgICAgICAgaW52ZXJ0WTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3JlZHJhd1RpbGU6IGZ1bmN0aW9uKHRpbGUpIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHZhciBjYWNoZSA9IHRoaXMuX2NhY2hlO1xuICAgICAgICAgICAgdmFyIGNvb3JkID0ge1xuICAgICAgICAgICAgICAgIHg6IHRpbGUuX3RpbGVQb2ludC54LFxuICAgICAgICAgICAgICAgIHk6IHRpbGUuX3RpbGVQb2ludC55LFxuICAgICAgICAgICAgICAgIHo6IHRoaXMuX21hcC5fem9vbVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vIHVzZSB0aGUgYWRqdXN0ZWQgY29vcmRpbmF0ZXMgdG8gaGFzaCB0aGUgdGhlIGNhY2hlIHZhbHVlcywgdGhpc1xuICAgICAgICAgICAgLy8gaXMgYmVjYXVzZSB3ZSB3YW50IHRvIG9ubHkgaGF2ZSBvbmUgY29weSBvZiB0aGUgZGF0YVxuICAgICAgICAgICAgdmFyIGhhc2ggPSBjb29yZC54ICsgJzonICsgY29vcmQueSArICc6JyArIGNvb3JkLno7XG4gICAgICAgICAgICAvLyB1c2UgdGhlIHVuYWRqc3V0ZWQgY29vcmRpbmF0ZXMgdG8gdHJhY2sgd2hpY2ggJ3dyYXBwZWQnIHRpbGVzXG4gICAgICAgICAgICAvLyB1c2VkIHRoZSBjYWNoZWQgZGF0YVxuICAgICAgICAgICAgdmFyIHVuYWRqdXN0ZWRIYXNoID0gdGlsZS5fdW5hZGp1c3RlZFRpbGVQb2ludC54ICsgJzonICsgdGlsZS5fdW5hZGp1c3RlZFRpbGVQb2ludC55O1xuICAgICAgICAgICAgLy8gY2hlY2sgY2FjaGVcbiAgICAgICAgICAgIHZhciBjYWNoZWQgPSBjYWNoZVtoYXNoXTtcbiAgICAgICAgICAgIGlmIChjYWNoZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBzdG9yZSB0aGUgdGlsZSBpbiB0aGUgY2FjaGUgdG8gZHJhdyB0byBsYXRlclxuICAgICAgICAgICAgICAgIGNhY2hlZC50aWxlc1t1bmFkanVzdGVkSGFzaF0gPSB0aWxlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgYSBjYWNoZSBlbnRyeVxuICAgICAgICAgICAgICAgIGNhY2hlW2hhc2hdID0ge1xuICAgICAgICAgICAgICAgICAgICBpc1BlbmRpbmc6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHRpbGVzOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogbnVsbFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLy8gYWRkIHRpbGUgdG8gdGhlIGNhY2hlIGVudHJ5XG4gICAgICAgICAgICAgICAgY2FjaGVbaGFzaF0udGlsZXNbdW5hZGp1c3RlZEhhc2hdID0gdGlsZTtcbiAgICAgICAgICAgICAgICAvLyByZXF1ZXN0IHRoZSB0aWxlXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0VGlsZShjb29yZCwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FjaGVkID0gY2FjaGVbaGFzaF07XG4gICAgICAgICAgICAgICAgICAgIGlmICghY2FjaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aWxlIGlzIG5vIGxvbmdlciBiZWluZyB0cmFja2VkLCBpZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYWNoZWQuaXNQZW5kaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIGRhdGEgaXMgbnVsbCwgZXhpdCBlYXJseVxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgZXh0cmVtYVxuICAgICAgICAgICAgICAgICAgICBzZWxmLnVwZGF0ZUV4dHJlbWEoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIGNhY2hlZC5kYXRhID0gc2VsZi5fY3JlYXRlRGF0YVRleHR1cmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2luaXRHTDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgZ2wgPSB0aGlzLl9nbCA9IGVzcGVyLldlYkdMQ29udGV4dC5nZXQodGhpcy5fY2FudmFzKTtcbiAgICAgICAgICAgIC8vIGhhbmRsZSBtaXNzaW5nIGNvbnRleHRcbiAgICAgICAgICAgIGlmICghZ2wpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdVbmFibGUgdG8gYWNxdWlyZSBhIFdlYkdMIGNvbnRleHQuJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaW5pdCB0aGUgd2ViZ2wgc3RhdGVcbiAgICAgICAgICAgIGdsLmNsZWFyQ29sb3IoMCwgMCwgMCwgMCk7XG4gICAgICAgICAgICBnbC5lbmFibGUoZ2wuQkxFTkQpO1xuICAgICAgICAgICAgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSwgZ2wuT05FKTtcbiAgICAgICAgICAgIGdsLmRpc2FibGUoZ2wuREVQVEhfVEVTVCk7XG4gICAgICAgICAgICAvLyBjcmVhdGUgdGlsZSByZW5kZXJhYmxlXG4gICAgICAgICAgICBzZWxmLl9yZW5kZXJhYmxlID0gbmV3IGVzcGVyLlJlbmRlcmFibGUoe1xuICAgICAgICAgICAgICAgIHZlcnRpY2VzOiB7XG4gICAgICAgICAgICAgICAgICAgIDA6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFswLCAtMjU2XSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFsyNTYsIC0yNTZdLFxuICAgICAgICAgICAgICAgICAgICAgICAgWzI1NiwgMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbMCwgMF1cbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgMTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgWzAsIDBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgWzEsIDBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgWzEsIDFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgWzAsIDFdXG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGluZGljZXM6IFtcbiAgICAgICAgICAgICAgICAgICAgMCwgMSwgMixcbiAgICAgICAgICAgICAgICAgICAgMCwgMiwgM1xuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gbG9hZCBzaGFkZXJzXG4gICAgICAgICAgICB0aGlzLl9zaGFkZXIgPSBuZXcgZXNwZXIuU2hhZGVyKHtcbiAgICAgICAgICAgICAgICB2ZXJ0OiB0aGlzLm9wdGlvbnMuc2hhZGVycy52ZXJ0LFxuICAgICAgICAgICAgICAgIGZyYWc6IHRoaXMub3B0aW9ucy5zaGFkZXJzLmZyYWdcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIGV4ZWN1dGUgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICB2YXIgd2lkdGggPSBzZWxmLl9jYW52YXMud2lkdGg7XG4gICAgICAgICAgICAgICAgdmFyIGhlaWdodCA9IHNlbGYuX2NhbnZhcy5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgc2VsZi5fdmlld3BvcnQgPSBuZXcgZXNwZXIuVmlld3BvcnQoe1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgc2VsZi5faW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNlbGYuX2RyYXcoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9pbml0Q2FudmFzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX2NhbnZhcyA9IEwuRG9tVXRpbC5jcmVhdGUoJ2NhbnZhcycsICdsZWFmbGV0LXdlYmdsLWxheWVyIGxlYWZsZXQtbGF5ZXInKTtcbiAgICAgICAgICAgIHZhciBzaXplID0gdGhpcy5fbWFwLmdldFNpemUoKTtcbiAgICAgICAgICAgIHRoaXMuX2NhbnZhcy53aWR0aCA9IHNpemUueDtcbiAgICAgICAgICAgIHRoaXMuX2NhbnZhcy5oZWlnaHQgPSBzaXplLnk7XG4gICAgICAgICAgICB2YXIgYW5pbWF0ZWQgPSB0aGlzLl9tYXAub3B0aW9ucy56b29tQW5pbWF0aW9uICYmIEwuQnJvd3Nlci5hbnkzZDtcbiAgICAgICAgICAgIEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLl9jYW52YXMsICdsZWFmbGV0LXpvb20tJyArIChhbmltYXRlZCA/ICdhbmltYXRlZCcgOiAnaGlkZScpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfZ2V0UHJvamVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgYm91bmRzID0gdGhpcy5fbWFwLmdldFBpeGVsQm91bmRzKCk7XG4gICAgICAgICAgICB2YXIgZGltID0gTWF0aC5wb3coMiwgdGhpcy5fbWFwLmdldFpvb20oKSkgKiAyNTY7XG4gICAgICAgICAgICByZXR1cm4gb3J0aG9NYXRyaXgoXG4gICAgICAgICAgICAgICAgYm91bmRzLm1pbi54LFxuICAgICAgICAgICAgICAgIGJvdW5kcy5tYXgueCxcbiAgICAgICAgICAgICAgICAoZGltIC0gYm91bmRzLm1heC55KSxcbiAgICAgICAgICAgICAgICAoZGltIC0gYm91bmRzLm1pbi55KSxcbiAgICAgICAgICAgICAgICAtMSwgMSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2NsZWFyQmFja0J1ZmZlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2dsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGdsID0gdGhpcy5fZ2w7XG4gICAgICAgICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfYW5pbWF0ZVpvb206IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciBzY2FsZSA9IHRoaXMuX21hcC5nZXRab29tU2NhbGUoZS56b29tKTtcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB0aGlzLl9tYXAuX2dldENlbnRlck9mZnNldChlLmNlbnRlcikuX211bHRpcGx5QnkoLXNjYWxlKS5zdWJ0cmFjdCh0aGlzLl9tYXAuX2dldE1hcFBhbmVQb3MoKSk7XG4gICAgICAgICAgICB0aGlzLl9jYW52YXMuc3R5bGVbTC5Eb21VdGlsLlRSQU5TRk9STV0gPSBMLkRvbVV0aWwuZ2V0VHJhbnNsYXRlU3RyaW5nKG9mZnNldCkgKyAnIHNjYWxlKCcgKyBzY2FsZSArICcpJztcbiAgICAgICAgfSxcblxuICAgICAgICBfcmVzaXplOiBmdW5jdGlvbihyZXNpemVFdmVudCkge1xuICAgICAgICAgICAgdmFyIHdpZHRoID0gcmVzaXplRXZlbnQubmV3U2l6ZS54O1xuICAgICAgICAgICAgdmFyIGhlaWdodCA9IHJlc2l6ZUV2ZW50Lm5ld1NpemUueTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pbml0aWFsaXplZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3ZpZXdwb3J0LnJlc2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBfZHJhdzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5faW5pdGlhbGl6ZWQgJiYgdGhpcy5fZ2wpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaXNIaWRkZW4oKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyByZS1wb3NpdGlvbiBjYW52YXNcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9pc1pvb21pbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0b3BMZWZ0ID0gdGhpcy5fbWFwLmNvbnRhaW5lclBvaW50VG9MYXllclBvaW50KFswLCAwXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBMLkRvbVV0aWwuc2V0UG9zaXRpb24odGhpcy5fY2FudmFzLCB0b3BMZWZ0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9iZWZvcmVEcmF3KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYmVmb3JlRHJhdygpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXcoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZnRlckRyYXcoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWZ0ZXJEcmF3KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLl9kcmF3LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGJlZm9yZURyYXc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gb3ZlcnJpZGVcbiAgICAgICAgfSxcblxuICAgICAgICBfYmVmb3JlRHJhdzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLl92aWV3cG9ydC5wdXNoKCk7XG4gICAgICAgICAgICB0aGlzLl9zaGFkZXIucHVzaCgpO1xuICAgICAgICAgICAgdGhpcy5fc2hhZGVyLnNldFVuaWZvcm0oJ3VQcm9qZWN0aW9uTWF0cml4JywgdGhpcy5fZ2V0UHJvamVjdGlvbigpKTtcbiAgICAgICAgICAgIHRoaXMuX3NoYWRlci5zZXRVbmlmb3JtKCd1T3BhY2l0eScsIHRoaXMuZ2V0T3BhY2l0eSgpKTtcbiAgICAgICAgICAgIHRoaXMuX3NoYWRlci5zZXRVbmlmb3JtKCd1VGV4dHVyZVNhbXBsZXInLCAwKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZnRlckRyYXc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gb3ZlcnJpZGVcbiAgICAgICAgfSxcblxuICAgICAgICBfYWZ0ZXJEcmF3OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX3NoYWRlci5wb3AoKTtcbiAgICAgICAgICAgIHRoaXMuX3ZpZXdwb3J0LnBvcCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRyYXc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGRpbSA9IE1hdGgucG93KDIsIHRoaXMuX21hcC5nZXRab29tKCkpICogMjU2O1xuICAgICAgICAgICAgLy8gZm9yIGVhY2ggdGlsZVxuICAgICAgICAgICAgXy5mb3JJbih0aGlzLl9jYWNoZSwgZnVuY3Rpb24oY2FjaGVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNhY2hlZC5pc1BlbmRpbmcgfHwgIWNhY2hlZC5kYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gYmluZCB0aWxlIHRleHR1cmUgdG8gdGV4dHVyZSB1bml0IDBcbiAgICAgICAgICAgICAgICBjYWNoZWQuZGF0YS5wdXNoKDApO1xuICAgICAgICAgICAgICAgIF8uZm9ySW4oY2FjaGVkLnRpbGVzLCBmdW5jdGlvbih0aWxlLCBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZmluZCB0aGUgdGlsZXMgcG9zaXRpb24gZnJvbSBpdHMga2V5XG4gICAgICAgICAgICAgICAgICAgIHZhciBrQXJyID0ga2V5LnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB4ID0gcGFyc2VJbnQoa0FyclswXSwgMTApO1xuICAgICAgICAgICAgICAgICAgICB2YXIgeSA9IHBhcnNlSW50KGtBcnJbMV0sIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gY3JlYXRlIG1vZGVsIG1hdHJpeFxuICAgICAgICAgICAgICAgICAgICB2YXIgbW9kZWwgPSBuZXcgdHJhbnNsYXRpb25NYXRyaXgoW1xuICAgICAgICAgICAgICAgICAgICAgICAgMjU2ICogeCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpbSAtICgyNTYgKiB5KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3NoYWRlci5zZXRVbmlmb3JtKCd1TW9kZWxNYXRyaXgnLCBtb2RlbCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGRyYXcgdGhlIHRpbGVcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fcmVuZGVyYWJsZS5kcmF3KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBubyBuZWVkIHRvIHVuYmluZCB0ZXh0dXJlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICByZXF1ZXN0VGlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBvdmVycmlkZVxuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gV2ViR0w7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBjYW52YXMgcmVuZGVyZXJzXG4gICAgdmFyIENhbnZhcyA9IHtcbiAgICAgICAgSGVhdG1hcDogcmVxdWlyZSgnLi90eXBlcy9jYW52YXMvSGVhdG1hcCcpXG4gICAgfTtcblxuICAgIC8vIGh0bWwgcmVuZGVyZXJzXG4gICAgdmFyIEhUTUwgPSB7XG4gICAgICAgIEhlYXRtYXA6IHJlcXVpcmUoJy4vdHlwZXMvaHRtbC9IZWF0bWFwJyksXG4gICAgICAgIFJpbmc6IHJlcXVpcmUoJy4vdHlwZXMvaHRtbC9SaW5nJyksXG4gICAgICAgIFdvcmRDbG91ZDogcmVxdWlyZSgnLi90eXBlcy9odG1sL1dvcmRDbG91ZCcpLFxuICAgICAgICBXb3JkSGlzdG9ncmFtOiByZXF1aXJlKCcuL3R5cGVzL2h0bWwvV29yZEhpc3RvZ3JhbScpXG4gICAgfTtcblxuICAgIC8vIHdlYmdsIHJlbmRlcmVyc1xuICAgIHZhciBXZWJHTCA9IHtcbiAgICAgICAgSGVhdG1hcDogcmVxdWlyZSgnLi90eXBlcy93ZWJnbC9IZWF0bWFwJylcbiAgICB9O1xuXG4gICAgLy8gcGVuZGluZyBsYXllciByZW5kZXJlcnNcbiAgICB2YXIgUGVuZGluZyA9IHtcbiAgICAgICAgQmxpbms6IHJlcXVpcmUoJy4vdHlwZXMvcGVuZGluZy9CbGluaycpLFxuICAgICAgICBTcGluOiByZXF1aXJlKCcuL3R5cGVzL3BlbmRpbmcvU3BpbicpLFxuICAgICAgICBCbGlua1NwaW46IHJlcXVpcmUoJy4vdHlwZXMvcGVuZGluZy9CbGlua1NwaW4nKSxcbiAgICB9O1xuXG4gICAgLy8gcGVuZGluZyBsYXllciByZW5kZXJlcnNcbiAgICB2YXIgRGVidWcgPSB7XG4gICAgICAgIENvb3JkOiByZXF1aXJlKCcuL3R5cGVzL2RlYnVnL0Nvb3JkJylcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIEhUTUw6IEhUTUwsXG4gICAgICAgIENhbnZhczogQ2FudmFzLFxuICAgICAgICBXZWJHTDogV2ViR0wsXG4gICAgICAgIERlYnVnOiBEZWJ1ZyxcbiAgICAgICAgUGVuZGluZzogUGVuZGluZ1xuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgUE9TSVRJVkUgPSAnMSc7XG4gICAgdmFyIE5FVVRSQUwgPSAnMCc7XG4gICAgdmFyIE5FR0FUSVZFID0gJy0xJztcblxuICAgIGZ1bmN0aW9uIGdldENsYXNzRnVuYyhtaW4sIG1heCkge1xuICAgICAgICBtaW4gPSBtaW4gIT09IHVuZGVmaW5lZCA/IG1pbiA6IC0xO1xuICAgICAgICBtYXggPSBtYXggIT09IHVuZGVmaW5lZCA/IG1heCA6IDE7XG4gICAgICAgIHZhciBwb3NpdGl2ZSA9IFswLjI1ICogbWF4LCAwLjUgKiBtYXgsIDAuNzUgKiBtYXhdO1xuICAgICAgICB2YXIgbmVnYXRpdmUgPSBbLTAuMjUgKiBtaW4sIC0wLjUgKiBtaW4sIC0wLjc1ICogbWluXTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHNlbnRpbWVudCkge1xuICAgICAgICAgICAgdmFyIHByZWZpeDtcbiAgICAgICAgICAgIHZhciByYW5nZTtcbiAgICAgICAgICAgIGlmIChzZW50aW1lbnQgPCAwKSB7XG4gICAgICAgICAgICAgICAgcHJlZml4ID0gJ25lZy0nO1xuICAgICAgICAgICAgICAgIHJhbmdlID0gbmVnYXRpdmU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHByZWZpeCA9ICdwb3MtJztcbiAgICAgICAgICAgICAgICByYW5nZSA9IHBvc2l0aXZlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGFicyA9IE1hdGguYWJzKHNlbnRpbWVudCk7XG4gICAgICAgICAgICBpZiAoYWJzID4gcmFuZ2VbMl0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJlZml4ICsgJzQnO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhYnMgPiByYW5nZVsxXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcmVmaXggKyAnMyc7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFicyA+IHJhbmdlWzBdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZWZpeCArICcyJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcmVmaXggKyAnMSc7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0VG90YWwoY291bnQpIHtcbiAgICAgICAgaWYgKCFjb3VudCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBvcyA9IGNvdW50W1BPU0lUSVZFXSA/IGNvdW50W1BPU0lUSVZFXSA6IDA7XG4gICAgICAgIHZhciBuZXUgPSBjb3VudFtORVVUUkFMXSA/IGNvdW50W05FVVRSQUxdIDogMDtcbiAgICAgICAgdmFyIG5lZyA9IGNvdW50W05FR0FUSVZFXSA/IGNvdW50W05FR0FUSVZFXSA6IDA7XG4gICAgICAgIHJldHVybiBwb3MgKyBuZXUgKyBuZWc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0QXZnKGNvdW50KSB7XG4gICAgICAgIGlmICghY291bnQpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwb3MgPSBjb3VudFtQT1NJVElWRV0gPyBjb3VudFtQT1NJVElWRV0gOiAwO1xuICAgICAgICB2YXIgbmV1ID0gY291bnRbTkVVVFJBTF0gPyBjb3VudFtORVVUUkFMXSA6IDA7XG4gICAgICAgIHZhciBuZWcgPSBjb3VudFtORUdBVElWRV0gPyBjb3VudFtORUdBVElWRV0gOiAwO1xuICAgICAgICB2YXIgdG90YWwgPSBwb3MgKyBuZXUgKyBuZWc7XG4gICAgICAgIHJldHVybiAodG90YWwgIT09IDApID8gKHBvcyAtIG5lZykgLyB0b3RhbCA6IDA7XG4gICAgfVxuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIGdldENsYXNzRnVuYzogZ2V0Q2xhc3NGdW5jLFxuICAgICAgICBnZXRUb3RhbDogZ2V0VG90YWwsXG4gICAgICAgIGdldEF2ZzogZ2V0QXZnXG4gICAgfTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBDYW52YXMgPSByZXF1aXJlKCcuLi8uLi9jb3JlL0NhbnZhcycpO1xuXG4gICAgdmFyIEhlYXRtYXAgPSBDYW52YXMuZXh0ZW5kKHtcblxuICAgICAgICByZW5kZXJDYW52YXM6IGZ1bmN0aW9uKGJpbnMsIHJlc29sdXRpb24sIHJhbXBGdW5jKSB7XG4gICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gcmVzb2x1dGlvbjtcbiAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHJlc29sdXRpb247XG4gICAgICAgICAgICB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICB2YXIgaW1hZ2VEYXRhID0gY3R4LmdldEltYWdlRGF0YSgwLCAwLCByZXNvbHV0aW9uLCByZXNvbHV0aW9uKTtcbiAgICAgICAgICAgIHZhciBkYXRhID0gaW1hZ2VEYXRhLmRhdGE7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgY29sb3IgPSBbMCwgMCwgMCwgMF07XG4gICAgICAgICAgICB2YXIgbnZhbCwgcnZhbCwgYmluLCBpO1xuICAgICAgICAgICAgZm9yIChpPTA7IGk8Ymlucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGJpbiA9IGJpbnNbaV07XG4gICAgICAgICAgICAgICAgaWYgKGJpbiA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb2xvclswXSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGNvbG9yWzFdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JbMl0gPSAwO1xuICAgICAgICAgICAgICAgICAgICBjb2xvclszXSA9IDA7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbnZhbCA9IHNlbGYudHJhbnNmb3JtVmFsdWUoYmluKTtcbiAgICAgICAgICAgICAgICAgICAgcnZhbCA9IHNlbGYuaW50ZXJwb2xhdGVUb1JhbmdlKG52YWwpO1xuICAgICAgICAgICAgICAgICAgICByYW1wRnVuYyhydmFsLCBjb2xvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRhdGFbaSAqIDRdID0gY29sb3JbMF07XG4gICAgICAgICAgICAgICAgZGF0YVtpICogNCArIDFdID0gY29sb3JbMV07XG4gICAgICAgICAgICAgICAgZGF0YVtpICogNCArIDJdID0gY29sb3JbMl07XG4gICAgICAgICAgICAgICAgZGF0YVtpICogNCArIDNdID0gY29sb3JbM107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKGltYWdlRGF0YSwgMCwgMCk7XG4gICAgICAgICAgICByZXR1cm4gY2FudmFzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlbmRlclRpbGU6IGZ1bmN0aW9uKGNhbnZhcywgZGF0YSkge1xuICAgICAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGJpbnMgPSBuZXcgRmxvYXQ2NEFycmF5KGRhdGEpO1xuICAgICAgICAgICAgdmFyIHJlc29sdXRpb24gPSBNYXRoLnNxcnQoYmlucy5sZW5ndGgpO1xuICAgICAgICAgICAgdmFyIHJhbXAgPSB0aGlzLmdldENvbG9yUmFtcCgpO1xuICAgICAgICAgICAgdmFyIHRpbGVDYW52YXMgPSB0aGlzLnJlbmRlckNhbnZhcyhiaW5zLCByZXNvbHV0aW9uLCByYW1wKTtcbiAgICAgICAgICAgIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICAgIGN0eC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoXG4gICAgICAgICAgICAgICAgdGlsZUNhbnZhcyxcbiAgICAgICAgICAgICAgICAwLCAwLFxuICAgICAgICAgICAgICAgIHJlc29sdXRpb24sIHJlc29sdXRpb24sXG4gICAgICAgICAgICAgICAgMCwgMCxcbiAgICAgICAgICAgICAgICBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gSGVhdG1hcDtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgICAgIHJlbmRlclRpbGU6IGZ1bmN0aW9uKGVsZW0sIGNvb3JkKSB7XG4gICAgICAgICAgICAkKGVsZW0pLmVtcHR5KCk7XG4gICAgICAgICAgICAkKGVsZW0pLmFwcGVuZCgnPGRpdiBzdHlsZT1cInRvcDowOyBsZWZ0OjA7XCI+JyArIGNvb3JkLnogKyAnLCAnICsgY29vcmQueCArICcsICcgKyBjb29yZC55ICsgJzwvZGl2PicpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIEhUTUwgPSByZXF1aXJlKCcuLi8uLi9jb3JlL0hUTUwnKTtcblxuICAgIHZhciBUSUxFX1NJWkUgPSAyNTY7XG5cbiAgICB2YXIgSGVhdG1hcCA9IEhUTUwuZXh0ZW5kKHtcblxuICAgICAgICBpc1RhcmdldExheWVyOiBmdW5jdGlvbiggZWxlbSApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250YWluZXIgJiYgJC5jb250YWlucyh0aGlzLl9jb250YWluZXIsIGVsZW0gKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjbGVhclNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikucmVtb3ZlQ2xhc3MoJ2hpZ2hsaWdodCcpO1xuICAgICAgICAgICAgdGhpcy5oaWdobGlnaHQgPSBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uTW91c2VPdmVyOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gJChlLm9yaWdpbmFsRXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRhcmdldC5hdHRyKCdkYXRhLXZhbHVlJyk7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlb3Zlcikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgJHBhcmVudCA9IHRhcmdldC5wYXJlbnRzKCcubGVhZmxldC1odG1sLXRpbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlb3Zlcih0YXJnZXQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwYXJzZUludCh2YWx1ZSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgeDogcGFyc2VJbnQoJHBhcmVudC5hdHRyKCdkYXRhLXgnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogcGFyc2VJbnQoJHBhcmVudC5hdHRyKCdkYXRhLXknKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgejogdGhpcy5fbWFwLmdldFpvb20oKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ4OiBwYXJzZUludCh0YXJnZXQuYXR0cignZGF0YS1ieCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICBieTogcGFyc2VJbnQodGFyZ2V0LmF0dHIoJ2RhdGEtYnknKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2hlYXRtYXAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGF5ZXI6IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG9uTW91c2VPdXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSAkKGUub3JpZ2luYWxFdmVudC50YXJnZXQpO1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gdGFyZ2V0LmF0dHIoJ2RhdGEtdmFsdWUnKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaGFuZGxlcnMubW91c2VvdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyICRwYXJlbnQgPSB0YXJnZXQucGFyZW50cygnLmxlYWZsZXQtaHRtbC10aWxlJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5oYW5kbGVycy5tb3VzZW91dCh0YXJnZXQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS14JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS15JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHo6IHRoaXMuX21hcC5nZXRab29tKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBieDogcGFyc2VJbnQodGFyZ2V0LmF0dHIoJ2RhdGEtYngnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgYnk6IHBhcnNlSW50KHRhcmdldC5hdHRyKCdkYXRhLWJ5JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdoZWF0bWFwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyOiB0aGlzXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAvLyB1bi1zZWxlY3QgYW55IHByZXYgc2VsZWN0ZWQgcGl4ZWxcbiAgICAgICAgICAgICQoJy5oZWF0bWFwLXBpeGVsJykucmVtb3ZlQ2xhc3MoJ2hpZ2hsaWdodCcpO1xuICAgICAgICAgICAgLy8gZ2V0IHRhcmdldFxuICAgICAgICAgICAgdmFyIHRhcmdldCA9ICQoZS5vcmlnaW5hbEV2ZW50LnRhcmdldCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNUYXJnZXRMYXllcihlLm9yaWdpbmFsRXZlbnQudGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgbGF5ZXIgaXMgbm90IHRoZSB0YXJnZXRcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIHRhcmdldC5oYXNDbGFzcygnaGVhdG1hcC1waXhlbCcpICkge1xuICAgICAgICAgICAgICAgIHRhcmdldC5hZGRDbGFzcygnaGlnaGxpZ2h0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB0YXJnZXQuYXR0cignZGF0YS12YWx1ZScpO1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5oYW5kbGVycy5jbGljaykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgJHBhcmVudCA9IHRhcmdldC5wYXJlbnRzKCcubGVhZmxldC1odG1sLXRpbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhhbmRsZXJzLmNsaWNrKHRhcmdldCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgeDogcGFyc2VJbnQoJHBhcmVudC5hdHRyKCdkYXRhLXgnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogcGFyc2VJbnQoJHBhcmVudC5hdHRyKCdkYXRhLXknKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgejogdGhpcy5fbWFwLmdldFpvb20oKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ4OiBwYXJzZUludCh0YXJnZXQuYXR0cignZGF0YS1ieCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICBieTogcGFyc2VJbnQodGFyZ2V0LmF0dHIoJ2RhdGEtYnknKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2hlYXRtYXAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGF5ZXI6IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHJlbmRlclRpbGU6IGZ1bmN0aW9uKGNvbnRhaW5lciwgZGF0YSkge1xuICAgICAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGJpbnMgPSBuZXcgRmxvYXQ2NEFycmF5KGRhdGEpO1xuICAgICAgICAgICAgdmFyIHJlc29sdXRpb24gPSBNYXRoLnNxcnQoYmlucy5sZW5ndGgpO1xuICAgICAgICAgICAgdmFyIHJhbXBGdW5jID0gdGhpcy5nZXRDb2xvclJhbXAoKTtcbiAgICAgICAgICAgIHZhciBwaXhlbFNpemUgPSBUSUxFX1NJWkUgLyByZXNvbHV0aW9uO1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGNvbG9yID0gWzAsIDAsIDAsIDBdO1xuICAgICAgICAgICAgdmFyIGh0bWwgPSAnJztcbiAgICAgICAgICAgIHZhciBudmFsLCBydmFsLCBiaW47XG4gICAgICAgICAgICB2YXIgbGVmdCwgdG9wO1xuICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICBmb3IgKGk9MDsgaTxiaW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgYmluID0gYmluc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoYmluID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxlZnQgPSAoaSAlIHJlc29sdXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0b3AgPSBNYXRoLmZsb29yKGkgLyByZXNvbHV0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgbnZhbCA9IHNlbGYudHJhbnNmb3JtVmFsdWUoYmluKTtcbiAgICAgICAgICAgICAgICAgICAgcnZhbCA9IHNlbGYuaW50ZXJwb2xhdGVUb1JhbmdlKG52YWwpO1xuICAgICAgICAgICAgICAgICAgICByYW1wRnVuYyhydmFsLCBjb2xvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciByZ2JhID0gJ3JnYmEoJyArXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yWzBdICsgJywnICtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JbMV0gKyAnLCcgK1xuICAgICAgICAgICAgICAgICAgICBjb2xvclsyXSArICcsJyArXG4gICAgICAgICAgICAgICAgICAgIChjb2xvclszXSAvIDI1NSkgKyAnKSc7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPGRpdiBjbGFzcz1cImhlYXRtYXAtcGl4ZWxcIiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEtdmFsdWU9XCInICsgYmluICsgJ1wiICcgK1xuICAgICAgICAgICAgICAgICAgICAnZGF0YS1ieD1cIicgKyBsZWZ0ICsgJ1wiICcgK1xuICAgICAgICAgICAgICAgICAgICAnZGF0YS1ieT1cIicgKyB0b3AgKyAnXCIgJyArXG4gICAgICAgICAgICAgICAgICAgICdzdHlsZT1cIicgK1xuICAgICAgICAgICAgICAgICAgICAnaGVpZ2h0OicgKyBwaXhlbFNpemUgKyAncHg7JyArXG4gICAgICAgICAgICAgICAgICAgICd3aWR0aDonICsgcGl4ZWxTaXplICsgJ3B4OycgK1xuICAgICAgICAgICAgICAgICAgICAnbGVmdDonICsgKGxlZnQgKiBwaXhlbFNpemUpICsgJ3B4OycgK1xuICAgICAgICAgICAgICAgICAgICAndG9wOicgKyAodG9wICogcGl4ZWxTaXplKSArICdweDsnICtcbiAgICAgICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtY29sb3I6JyArIHJnYmEgKyAnO1wiPjwvZGl2Pic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IEhlYXRtYXA7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgSFRNTCA9IHJlcXVpcmUoJy4uLy4uL2NvcmUvSFRNTCcpO1xuXG4gICAgdmFyIFRJTEVfU0laRSA9IDI1NjtcblxuICAgIHZhciBIZWF0bWFwID0gSFRNTC5leHRlbmQoe1xuXG4gICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSAkKGUub3JpZ2luYWxFdmVudC50YXJnZXQpO1xuICAgICAgICAgICAgJCgnLmhlYXRtYXAtcmluZycpLnJlbW92ZUNsYXNzKCdoaWdobGlnaHQnKTtcbiAgICAgICAgICAgIGlmICggdGFyZ2V0Lmhhc0NsYXNzKCdoZWF0bWFwLXJpbmcnKSApIHtcbiAgICAgICAgICAgICAgICB0YXJnZXQuYWRkQ2xhc3MoJ2hpZ2hsaWdodCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHJlbmRlclRpbGU6IGZ1bmN0aW9uKGNvbnRhaW5lciwgZGF0YSkge1xuICAgICAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGJpbnMgPSBuZXcgRmxvYXQ2NEFycmF5KGRhdGEpO1xuICAgICAgICAgICAgdmFyIHJlc29sdXRpb24gPSBNYXRoLnNxcnQoYmlucy5sZW5ndGgpO1xuICAgICAgICAgICAgdmFyIGJpblNpemUgPSAoVElMRV9TSVpFIC8gcmVzb2x1dGlvbik7XG4gICAgICAgICAgICB2YXIgaHRtbCA9ICcnO1xuICAgICAgICAgICAgYmlucy5mb3JFYWNoKGZ1bmN0aW9uKGJpbiwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWJpbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBwZXJjZW50ID0gc2VsZi50cmFuc2Zvcm1WYWx1ZShiaW4pO1xuICAgICAgICAgICAgICAgIHZhciByYWRpdXMgPSBwZXJjZW50ICogYmluU2l6ZTtcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gKGJpblNpemUgLSByYWRpdXMpIC8gMjtcbiAgICAgICAgICAgICAgICB2YXIgbGVmdCA9IChpbmRleCAlIHJlc29sdXRpb24pICogYmluU2l6ZTtcbiAgICAgICAgICAgICAgICB2YXIgdG9wID0gTWF0aC5mbG9vcihpbmRleCAvIHJlc29sdXRpb24pICogYmluU2l6ZTtcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8ZGl2IGNsYXNzPVwiaGVhdG1hcC1yaW5nXCIgc3R5bGU9XCInICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlZnQ6JyArIChsZWZ0ICsgb2Zmc2V0KSArICdweDsnICtcbiAgICAgICAgICAgICAgICAgICAgJ3RvcDonICsgKHRvcCArIG9mZnNldCkgKyAncHg7JyArXG4gICAgICAgICAgICAgICAgICAgICd3aWR0aDonICsgcmFkaXVzICsgJ3B4OycgK1xuICAgICAgICAgICAgICAgICAgICAnaGVpZ2h0OicgKyByYWRpdXMgKyAncHg7JyArXG4gICAgICAgICAgICAgICAgICAgICdcIj48L2Rpdj4nO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IEhlYXRtYXA7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgSFRNTCA9IHJlcXVpcmUoJy4uLy4uL2NvcmUvSFRNTCcpO1xuICAgIHZhciBzZW50aW1lbnQgPSByZXF1aXJlKCcuLi8uLi9zZW50aW1lbnQvU2VudGltZW50Jyk7XG4gICAgdmFyIHNlbnRpbWVudEZ1bmMgPSBzZW50aW1lbnQuZ2V0Q2xhc3NGdW5jKC0xLCAxKTtcblxuICAgIHZhciBUSUxFX1NJWkUgPSAyNTY7XG4gICAgdmFyIEhBTEZfU0laRSA9IFRJTEVfU0laRSAvIDI7XG4gICAgdmFyIFZFUlRJQ0FMX09GRlNFVCA9IDI0O1xuICAgIHZhciBIT1JJWk9OVEFMX09GRlNFVCA9IDEwO1xuICAgIHZhciBNQVhfTlVNX1dPUkRTID0gMTU7XG4gICAgdmFyIE1JTl9GT05UX1NJWkUgPSAxMDtcbiAgICB2YXIgTUFYX0ZPTlRfU0laRSA9IDIwO1xuICAgIHZhciBOVU1fQVRURU1QVFMgPSAxO1xuXG4gICAgLyoqXG4gICAgICogR2l2ZW4gYW4gaW5pdGlhbCBwb3NpdGlvbiwgcmV0dXJuIGEgbmV3IHBvc2l0aW9uLCBpbmNyZW1lbnRhbGx5IHNwaXJhbGxlZFxuICAgICAqIG91dHdhcmRzLlxuICAgICAqL1xuICAgIHZhciBzcGlyYWxQb3NpdGlvbiA9IGZ1bmN0aW9uKHBvcykge1xuICAgICAgICB2YXIgcGkyID0gMiAqIE1hdGguUEk7XG4gICAgICAgIHZhciBjaXJjID0gcGkyICogcG9zLnJhZGl1cztcbiAgICAgICAgdmFyIGluYyA9IChwb3MuYXJjTGVuZ3RoID4gY2lyYyAvIDEwKSA/IGNpcmMgLyAxMCA6IHBvcy5hcmNMZW5ndGg7XG4gICAgICAgIHZhciBkYSA9IGluYyAvIHBvcy5yYWRpdXM7XG4gICAgICAgIHZhciBudCA9IChwb3MudCArIGRhKTtcbiAgICAgICAgaWYgKG50ID4gcGkyKSB7XG4gICAgICAgICAgICBudCA9IG50ICUgcGkyO1xuICAgICAgICAgICAgcG9zLnJhZGl1cyA9IHBvcy5yYWRpdXMgKyBwb3MucmFkaXVzSW5jO1xuICAgICAgICB9XG4gICAgICAgIHBvcy50ID0gbnQ7XG4gICAgICAgIHBvcy54ID0gcG9zLnJhZGl1cyAqIE1hdGguY29zKG50KTtcbiAgICAgICAgcG9zLnkgPSBwb3MucmFkaXVzICogTWF0aC5zaW4obnQpO1xuICAgICAgICByZXR1cm4gcG9zO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiAgUmV0dXJucyB0cnVlIGlmIGJvdW5kaW5nIGJveCBhIGludGVyc2VjdHMgYm91bmRpbmcgYm94IGJcbiAgICAgKi9cbiAgICB2YXIgaW50ZXJzZWN0VGVzdCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIChNYXRoLmFicyhhLnggLSBiLngpICogMiA8IChhLndpZHRoICsgYi53aWR0aCkpICYmXG4gICAgICAgICAgICAoTWF0aC5hYnMoYS55IC0gYi55KSAqIDIgPCAoYS5oZWlnaHQgKyBiLmhlaWdodCkpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiAgUmV0dXJucyB0cnVlIGlmIGJvdW5kaW5nIGJveCBhIGlzIG5vdCBmdWxseSBjb250YWluZWQgaW5zaWRlIGJvdW5kaW5nIGJveCBiXG4gICAgICovXG4gICAgdmFyIG92ZXJsYXBUZXN0ID0gZnVuY3Rpb24oYSwgYikge1xuICAgICAgICByZXR1cm4gKGEueCArIGEud2lkdGggLyAyID4gYi54ICsgYi53aWR0aCAvIDIgfHxcbiAgICAgICAgICAgIGEueCAtIGEud2lkdGggLyAyIDwgYi54IC0gYi53aWR0aCAvIDIgfHxcbiAgICAgICAgICAgIGEueSArIGEuaGVpZ2h0IC8gMiA+IGIueSArIGIuaGVpZ2h0IC8gMiB8fFxuICAgICAgICAgICAgYS55IC0gYS5oZWlnaHQgLyAyIDwgYi55IC0gYi5oZWlnaHQgLyAyKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgYSB3b3JkIGludGVyc2VjdHMgYW5vdGhlciB3b3JkLCBvciBpcyBub3QgZnVsbHkgY29udGFpbmVkIGluIHRoZVxuICAgICAqIHRpbGUgYm91bmRpbmcgYm94XG4gICAgICovXG4gICAgdmFyIGludGVyc2VjdFdvcmQgPSBmdW5jdGlvbihwb3NpdGlvbiwgd29yZCwgY2xvdWQsIGJiKSB7XG4gICAgICAgIHZhciBib3ggPSB7XG4gICAgICAgICAgICB4OiBwb3NpdGlvbi54LFxuICAgICAgICAgICAgeTogcG9zaXRpb24ueSxcbiAgICAgICAgICAgIGhlaWdodDogd29yZC5oZWlnaHQsXG4gICAgICAgICAgICB3aWR0aDogd29yZC53aWR0aFxuICAgICAgICB9O1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNsb3VkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaW50ZXJzZWN0VGVzdChib3gsIGNsb3VkW2ldKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIG1ha2Ugc3VyZSBpdCBkb2Vzbid0IGludGVyc2VjdCB0aGUgYm9yZGVyO1xuICAgICAgICBpZiAob3ZlcmxhcFRlc3QoYm94LCBiYikpIHtcbiAgICAgICAgICAgIC8vIGlmIGl0IGhpdHMgYSBib3JkZXIsIGluY3JlbWVudCBjb2xsaXNpb24gY291bnRcbiAgICAgICAgICAgIC8vIGFuZCBleHRlbmQgYXJjIGxlbmd0aFxuICAgICAgICAgICAgcG9zaXRpb24uY29sbGlzaW9ucysrO1xuICAgICAgICAgICAgcG9zaXRpb24uYXJjTGVuZ3RoID0gcG9zaXRpb24ucmFkaXVzO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICB2YXIgV29yZENsb3VkID0gSFRNTC5leHRlbmQoe1xuXG4gICAgICAgIGlzVGFyZ2V0TGF5ZXI6IGZ1bmN0aW9uKCBlbGVtICkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRhaW5lciAmJiAkLmNvbnRhaW5zKHRoaXMuX2NvbnRhaW5lciwgZWxlbSApO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNsZWFyU2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQodGhpcy5fY29udGFpbmVyKS5yZW1vdmVDbGFzcygnaGlnaGxpZ2h0Jyk7XG4gICAgICAgICAgICB0aGlzLmhpZ2hsaWdodCA9IG51bGw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25Nb3VzZU92ZXI6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSAkKGUub3JpZ2luYWxFdmVudC50YXJnZXQpO1xuICAgICAgICAgICAgJCgnLndvcmQtY2xvdWQtbGFiZWwnKS5yZW1vdmVDbGFzcygnaG92ZXInKTtcbiAgICAgICAgICAgIHZhciB3b3JkID0gdGFyZ2V0LmF0dHIoJ2RhdGEtd29yZCcpO1xuICAgICAgICAgICAgaWYgKHdvcmQpIHtcbiAgICAgICAgICAgICAgICAkKCcud29yZC1jbG91ZC1sYWJlbFtkYXRhLXdvcmQ9JyArIHdvcmQgKyAnXScpLmFkZENsYXNzKCdob3ZlcicpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaGFuZGxlcnMubW91c2VvdmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciAkcGFyZW50ID0gdGFyZ2V0LnBhcmVudHMoJy5sZWFmbGV0LWh0bWwtdGlsZScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGFuZGxlcnMubW91c2VvdmVyKHRhcmdldCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHdvcmQsXG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBwYXJzZUludCgkcGFyZW50LmF0dHIoJ2RhdGEteCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiBwYXJzZUludCgkcGFyZW50LmF0dHIoJ2RhdGEteScpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICB6OiB0aGlzLl9tYXAuZ2V0Wm9vbSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3dvcmQtY2xvdWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGF5ZXI6IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG9uTW91c2VPdXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSAkKGUub3JpZ2luYWxFdmVudC50YXJnZXQpO1xuICAgICAgICAgICAgJCgnLndvcmQtY2xvdWQtbGFiZWwnKS5yZW1vdmVDbGFzcygnaG92ZXInKTtcbiAgICAgICAgICAgIHZhciB3b3JkID0gdGFyZ2V0LmF0dHIoJ2RhdGEtd29yZCcpO1xuICAgICAgICAgICAgaWYgKHdvcmQpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciAkcGFyZW50ID0gdGFyZ2V0LnBhcmVudHMoJy5sZWFmbGV0LWh0bWwtdGlsZScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGFuZGxlcnMubW91c2VvdXQodGFyZ2V0LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogd29yZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS14JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS15JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHo6IHRoaXMuX21hcC5nZXRab29tKCksXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnd29yZC1jbG91ZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXllcjogdGhpc1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25DbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgLy8gdW4tc2VsZWN0IGFueSBwcmV2IHNlbGVjdGVkIHdvcmRzXG4gICAgICAgICAgICAkKCcud29yZC1jbG91ZC1sYWJlbCcpLnJlbW92ZUNsYXNzKCdoaWdobGlnaHQnKTtcbiAgICAgICAgICAgICQodGhpcy5fY29udGFpbmVyKS5yZW1vdmVDbGFzcygnaGlnaGxpZ2h0Jyk7XG4gICAgICAgICAgICAvLyBnZXQgdGFyZ2V0XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gJChlLm9yaWdpbmFsRXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc1RhcmdldExheWVyKGUub3JpZ2luYWxFdmVudC50YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBsYXllciBpcyBub3QgdGhlIHRhcmdldFxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB3b3JkID0gdGFyZ2V0LmF0dHIoJ2RhdGEtd29yZCcpO1xuICAgICAgICAgICAgaWYgKHdvcmQpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikuYWRkQ2xhc3MoJ2hpZ2hsaWdodCcpO1xuICAgICAgICAgICAgICAgICQoJy53b3JkLWNsb3VkLWxhYmVsW2RhdGEtd29yZD0nICsgd29yZCArICddJykuYWRkQ2xhc3MoJ2hpZ2hsaWdodCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0ID0gd29yZDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZXJzLmNsaWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciAkcGFyZW50ID0gdGFyZ2V0LnBhcmVudHMoJy5sZWFmbGV0LWh0bWwtdGlsZScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGFuZGxlcnMuY2xpY2sodGFyZ2V0LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogd29yZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS14JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS15JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHo6IHRoaXMuX21hcC5nZXRab29tKCksXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnd29yZC1jbG91ZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXllcjogdGhpc1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBfbWVhc3VyZVdvcmRzOiBmdW5jdGlvbih3b3JkQ291bnRzKSB7XG4gICAgICAgICAgICAvLyBzb3J0IHdvcmRzIGJ5IGZyZXF1ZW5jeVxuICAgICAgICAgICAgd29yZENvdW50cyA9IHdvcmRDb3VudHMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGIuY291bnQgLSBhLmNvdW50O1xuICAgICAgICAgICAgfSkuc2xpY2UoMCwgTUFYX05VTV9XT1JEUyk7XG4gICAgICAgICAgICAvLyBidWlsZCBtZWFzdXJlbWVudCBodG1sXG4gICAgICAgICAgICB2YXIgaHRtbCA9ICc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjI1NnB4OyB3aWR0aDoyNTZweDtcIj4nO1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgd29yZENvdW50cy5mb3JFYWNoKGZ1bmN0aW9uKHdvcmQpIHtcbiAgICAgICAgICAgICAgICB3b3JkLnBlcmNlbnQgPSBzZWxmLnRyYW5zZm9ybVZhbHVlKHdvcmQuY291bnQpO1xuICAgICAgICAgICAgICAgIHdvcmQuZm9udFNpemUgPSBNSU5fRk9OVF9TSVpFICsgd29yZC5wZXJjZW50ICogKE1BWF9GT05UX1NJWkUgLSBNSU5fRk9OVF9TSVpFKTtcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8ZGl2IGNsYXNzPVwid29yZC1jbG91ZC1sYWJlbFwiIHN0eWxlPVwiJyArXG4gICAgICAgICAgICAgICAgICAgICd2aXNpYmlsaXR5OmhpZGRlbjsnICtcbiAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtc2l6ZTonICsgd29yZC5mb250U2l6ZSArICdweDtcIj4nICsgd29yZC50ZXh0ICsgJzwvZGl2Pic7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGh0bWwgKz0gJzwvZGl2Pic7XG4gICAgICAgICAgICAvLyBhcHBlbmQgbWVhc3VyZW1lbnRzXG4gICAgICAgICAgICB2YXIgJHRlbXAgPSAkKGh0bWwpO1xuICAgICAgICAgICAgJCgnYm9keScpLmFwcGVuZCgkdGVtcCk7XG4gICAgICAgICAgICAkdGVtcC5jaGlsZHJlbigpLmVhY2goZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgICAgICB3b3JkQ291bnRzW2luZGV4XS53aWR0aCA9IHRoaXMub2Zmc2V0V2lkdGg7XG4gICAgICAgICAgICAgICAgd29yZENvdW50c1tpbmRleF0uaGVpZ2h0ID0gdGhpcy5vZmZzZXRIZWlnaHQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICR0ZW1wLnJlbW92ZSgpO1xuICAgICAgICAgICAgcmV0dXJuIHdvcmRDb3VudHM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2NyZWF0ZVdvcmRDbG91ZDogZnVuY3Rpb24od29yZENvdW50cykge1xuICAgICAgICAgICAgdmFyIGJvdW5kaW5nQm94ID0ge1xuICAgICAgICAgICAgICAgIHdpZHRoOiBUSUxFX1NJWkUgLSBIT1JJWk9OVEFMX09GRlNFVCAqIDIsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBUSUxFX1NJWkUgLSBWRVJUSUNBTF9PRkZTRVQgKiAyLFxuICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgeTogMFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBjbG91ZCA9IFtdO1xuICAgICAgICAgICAgLy8gc29ydCB3b3JkcyBieSBmcmVxdWVuY3lcbiAgICAgICAgICAgIHdvcmRDb3VudHMgPSB0aGlzLl9tZWFzdXJlV29yZHMod29yZENvdW50cyk7XG4gICAgICAgICAgICAvLyBhc3NlbWJsZSB3b3JkIGNsb3VkXG4gICAgICAgICAgICB3b3JkQ291bnRzLmZvckVhY2goZnVuY3Rpb24od29yZENvdW50KSB7XG4gICAgICAgICAgICAgICAgLy8gc3RhcnRpbmcgc3BpcmFsIHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgdmFyIHBvcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgcmFkaXVzOiAxLFxuICAgICAgICAgICAgICAgICAgICByYWRpdXNJbmM6IDUsXG4gICAgICAgICAgICAgICAgICAgIGFyY0xlbmd0aDogMTAsXG4gICAgICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICAgICAgICAgIHQ6IDAsXG4gICAgICAgICAgICAgICAgICAgIGNvbGxpc2lvbnM6IDBcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIC8vIHNwaXJhbCBvdXR3YXJkcyB0byBmaW5kIHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgd2hpbGUgKHBvcy5jb2xsaXNpb25zIDwgTlVNX0FUVEVNUFRTKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGluY3JlbWVudCBwb3NpdGlvbiBpbiBhIHNwaXJhbFxuICAgICAgICAgICAgICAgICAgICBwb3MgPSBzcGlyYWxQb3NpdGlvbihwb3MpO1xuICAgICAgICAgICAgICAgICAgICAvLyB0ZXN0IGZvciBpbnRlcnNlY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpbnRlcnNlY3RXb3JkKHBvcywgd29yZENvdW50LCBjbG91ZCwgYm91bmRpbmdCb3gpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbG91ZC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiB3b3JkQ291bnQudGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogd29yZENvdW50LmZvbnRTaXplLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcmNlbnQ6IE1hdGgucm91bmQoKHdvcmRDb3VudC5wZXJjZW50ICogMTAwKSAvIDEwKSAqIDEwLCAvLyByb3VuZCB0byBuZWFyZXN0IDEwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogcG9zLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogcG9zLnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHdvcmRDb3VudC53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHdvcmRDb3VudC5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VudGltZW50OiB3b3JkQ291bnQuc2VudGltZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF2Zzogd29yZENvdW50LmF2Z1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGNsb3VkO1xuICAgICAgICB9LFxuXG4gICAgICAgIGV4dHJhY3RFeHRyZW1hOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB2YXIgc3VtcyA9IF8ubWFwKGRhdGEsIGZ1bmN0aW9uKGNvdW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKF8uaXNOdW1iZXIoY291bnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb3VudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbnRpbWVudC5nZXRUb3RhbChjb3VudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbWluOiBfLm1pbihzdW1zKSxcbiAgICAgICAgICAgICAgICBtYXg6IF8ubWF4KHN1bXMpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICByZW5kZXJUaWxlOiBmdW5jdGlvbihjb250YWluZXIsIGRhdGEpIHtcbiAgICAgICAgICAgIGlmICghZGF0YSB8fCBfLmlzRW1wdHkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaGlnaGxpZ2h0ID0gdGhpcy5oaWdobGlnaHQ7XG4gICAgICAgICAgICB2YXIgd29yZENvdW50cyA9IF8ubWFwKGRhdGEsIGZ1bmN0aW9uKGNvdW50LCBrZXkpIHtcbiAgICAgICAgICAgICAgICBpZiAoXy5pc051bWJlcihjb3VudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiBjb3VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IGtleVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdG90YWwgPSBzZW50aW1lbnQuZ2V0VG90YWwoY291bnQpO1xuICAgICAgICAgICAgICAgIHZhciBhdmcgPSBzZW50aW1lbnQuZ2V0QXZnKGNvdW50KTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBjb3VudDogdG90YWwsXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IGtleSxcbiAgICAgICAgICAgICAgICAgICAgYXZnOiBhdmcsXG4gICAgICAgICAgICAgICAgICAgIHNlbnRpbWVudDogc2VudGltZW50RnVuYyhhdmcpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gZXhpdCBlYXJseSBpZiBubyB3b3Jkc1xuICAgICAgICAgICAgaWYgKHdvcmRDb3VudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZ2VuZXJlYXRlIHRoZSBjbG91ZFxuICAgICAgICAgICAgdmFyIGNsb3VkID0gdGhpcy5fY3JlYXRlV29yZENsb3VkKHdvcmRDb3VudHMpO1xuICAgICAgICAgICAgLy8gYnVpbGQgaHRtbCBlbGVtZW50c1xuICAgICAgICAgICAgdmFyIGh0bWwgPSAnJztcbiAgICAgICAgICAgIGNsb3VkLmZvckVhY2goZnVuY3Rpb24od29yZCkge1xuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBjbGFzc2VzXG4gICAgICAgICAgICAgICAgdmFyIGNsYXNzTmFtZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICd3b3JkLWNsb3VkLWxhYmVsJyxcbiAgICAgICAgICAgICAgICAgICAgJ3dvcmQtY2xvdWQtbGFiZWwtJyArIHdvcmQucGVyY2VudCxcbiAgICAgICAgICAgICAgICAgICAgd29yZC50ZXh0ID09PSBoaWdobGlnaHQgPyAnaGlnaGxpZ2h0JyA6ICcnLFxuICAgICAgICAgICAgICAgICAgICB3b3JkLnNlbnRpbWVudCA/IHdvcmQuc2VudGltZW50IDogJydcbiAgICAgICAgICAgICAgICBdLmpvaW4oJyAnKTtcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgc3R5bGVzXG4gICAgICAgICAgICAgICAgdmFyIHN0eWxlcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtc2l6ZTonICsgd29yZC5mb250U2l6ZSArICdweCcsXG4gICAgICAgICAgICAgICAgICAgICdsZWZ0OicgKyAoSEFMRl9TSVpFICsgd29yZC54IC0gKHdvcmQud2lkdGggLyAyKSkgKyAncHgnLFxuICAgICAgICAgICAgICAgICAgICAndG9wOicgKyAoSEFMRl9TSVpFICsgd29yZC55IC0gKHdvcmQuaGVpZ2h0IC8gMikpICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgJ3dpZHRoOicgKyB3b3JkLndpZHRoICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgJ2hlaWdodDonICsgd29yZC5oZWlnaHQgKyAncHgnLFxuICAgICAgICAgICAgICAgIF0uam9pbignOycpO1xuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBodG1sIGZvciBlbnRyeVxuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxkaXYgY2xhc3M9XCInICsgY2xhc3NOYW1lcyArICdcIicgK1xuICAgICAgICAgICAgICAgICAgICAnc3R5bGU9XCInICsgc3R5bGVzICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAgICdkYXRhLXNlbnRpbWVudD1cIicgKyB3b3JkLmF2ZyArICdcIicgK1xuICAgICAgICAgICAgICAgICAgICAnZGF0YS13b3JkPVwiJyArIHdvcmQudGV4dCArICdcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgd29yZC50ZXh0ICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2Pic7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gV29yZENsb3VkO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIEhUTUwgPSByZXF1aXJlKCcuLi8uLi9jb3JlL0hUTUwnKTtcbiAgICB2YXIgc2VudGltZW50ID0gcmVxdWlyZSgnLi4vLi4vc2VudGltZW50L1NlbnRpbWVudCcpO1xuICAgIHZhciBzZW50aW1lbnRGdW5jID0gc2VudGltZW50LmdldENsYXNzRnVuYygtMSwgMSk7XG5cbiAgICB2YXIgVElMRV9TSVpFID0gMjU2O1xuICAgIHZhciBIQUxGX1NJWkUgPSBUSUxFX1NJWkUgLyAyO1xuICAgIHZhciBNQVhfTlVNX1dPUkRTID0gODtcbiAgICB2YXIgTUlOX0ZPTlRfU0laRSA9IDE2O1xuICAgIHZhciBNQVhfRk9OVF9TSVpFID0gMjI7XG5cbiAgICB2YXIgaXNTaW5nbGVWYWx1ZSA9IGZ1bmN0aW9uKGNvdW50KSB7XG4gICAgICAgIC8vIHNpbmdsZSB2YWx1ZXMgYXJlIG5ldmVyIG51bGwsIGFuZCBhbHdheXMgbnVtYmVyc1xuICAgICAgICByZXR1cm4gY291bnQgIT09IG51bGwgJiYgXy5pc051bWJlcihjb3VudCk7XG4gICAgfTtcblxuICAgIHZhciBleHRyYWN0Q291bnQgPSBmdW5jdGlvbihjb3VudCkge1xuICAgICAgICBpZiAoaXNTaW5nbGVWYWx1ZShjb3VudCkpIHtcbiAgICAgICAgICAgIHJldHVybiBjb3VudDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2VudGltZW50LmdldFRvdGFsKGNvdW50KTtcbiAgICB9O1xuXG4gICAgdmFyIGV4dHJhY3RTZW50aW1lbnRDbGFzcyA9IGZ1bmN0aW9uKGF2Zykge1xuICAgICAgICBpZiAoYXZnICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBzZW50aW1lbnRGdW5jKGF2Zyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH07XG5cbiAgICB2YXIgZXh0cmFjdEZyZXF1ZW5jeSA9IGZ1bmN0aW9uKGNvdW50KSB7XG4gICAgICAgIGlmIChpc1NpbmdsZVZhbHVlKGNvdW50KSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb3VudDogY291bnRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvdW50OiBzZW50aW1lbnQuZ2V0VG90YWwoY291bnQpLFxuICAgICAgICAgICAgYXZnOiBzZW50aW1lbnQuZ2V0QXZnKGNvdW50KVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICB2YXIgZXh0cmFjdEF2ZyA9IGZ1bmN0aW9uKGZyZXF1ZW5jaWVzKSB7XG4gICAgICAgIGlmIChmcmVxdWVuY2llc1swXS5hdmcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzdW0gPSBfLnN1bUJ5KGZyZXF1ZW5jaWVzLCBmdW5jdGlvbihmcmVxdWVuY3kpIHtcbiAgICAgICAgICAgIHJldHVybiBmcmVxdWVuY3kuYXZnO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHN1bSAvIGZyZXF1ZW5jaWVzLmxlbmd0aDtcbiAgICB9O1xuXG4gICAgdmFyIGV4dHJhY3RWYWx1ZXMgPSBmdW5jdGlvbihkYXRhLCBrZXkpIHtcbiAgICAgICAgdmFyIGZyZXF1ZW5jaWVzID0gXy5tYXAoZGF0YSwgZXh0cmFjdEZyZXF1ZW5jeSk7XG4gICAgICAgIHZhciBhdmcgPSBleHRyYWN0QXZnKGZyZXF1ZW5jaWVzKTtcbiAgICAgICAgdmFyIG1heCA9IF8ubWF4QnkoZnJlcXVlbmNpZXMsIGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbC5jb3VudDtcbiAgICAgICAgfSkuY291bnQ7XG4gICAgICAgIHZhciB0b3RhbCA9IF8uc3VtQnkoZnJlcXVlbmNpZXMsIGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbC5jb3VudDtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0b3BpYzoga2V5LFxuICAgICAgICAgICAgZnJlcXVlbmNpZXM6IGZyZXF1ZW5jaWVzLFxuICAgICAgICAgICAgbWF4OiBtYXgsXG4gICAgICAgICAgICB0b3RhbDogdG90YWwsXG4gICAgICAgICAgICBhdmc6IGF2Z1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICB2YXIgV29yZEhpc3RvZ3JhbSA9IEhUTUwuZXh0ZW5kKHtcblxuICAgICAgICBpc1RhcmdldExheWVyOiBmdW5jdGlvbiggZWxlbSApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250YWluZXIgJiYgJC5jb250YWlucyh0aGlzLl9jb250YWluZXIsIGVsZW0gKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjbGVhclNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikucmVtb3ZlQ2xhc3MoJ2hpZ2hsaWdodCcpO1xuICAgICAgICAgICAgdGhpcy5oaWdobGlnaHQgPSBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uTW91c2VPdmVyOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gJChlLm9yaWdpbmFsRXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgICQoJy53b3JkLWhpc3RvZ3JhbS1lbnRyeScpLnJlbW92ZUNsYXNzKCdob3ZlcicpO1xuICAgICAgICAgICAgdmFyIHdvcmQgPSB0YXJnZXQuYXR0cignZGF0YS13b3JkJyk7XG4gICAgICAgICAgICBpZiAod29yZCkge1xuICAgICAgICAgICAgICAgICQoJy53b3JkLWhpc3RvZ3JhbS1lbnRyeVtkYXRhLXdvcmQ9JyArIHdvcmQgKyAnXScpLmFkZENsYXNzKCdob3ZlcicpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaGFuZGxlcnMubW91c2VvdmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciAkcGFyZW50ID0gdGFyZ2V0LnBhcmVudHMoJy5sZWFmbGV0LWh0bWwtdGlsZScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGFuZGxlcnMubW91c2VvdmVyKHRhcmdldCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHdvcmQsXG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBwYXJzZUludCgkcGFyZW50LmF0dHIoJ2RhdGEteCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiBwYXJzZUludCgkcGFyZW50LmF0dHIoJ2RhdGEteScpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICB6OiB0aGlzLl9tYXAuZ2V0Wm9vbSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3dvcmQtaGlzdG9ncmFtJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyOiB0aGlzXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBvbk1vdXNlT3V0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gJChlLm9yaWdpbmFsRXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgICQoJy53b3JkLWhpc3RvZ3JhbS1lbnRyeScpLnJlbW92ZUNsYXNzKCdob3ZlcicpO1xuICAgICAgICAgICAgdmFyIHdvcmQgPSB0YXJnZXQuYXR0cignZGF0YS13b3JkJyk7XG4gICAgICAgICAgICBpZiAod29yZCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaGFuZGxlcnMubW91c2VvdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyICRwYXJlbnQgPSB0YXJnZXQucGFyZW50cygnLmxlYWZsZXQtaHRtbC10aWxlJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5oYW5kbGVycy5tb3VzZW91dCh0YXJnZXQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB3b3JkLFxuICAgICAgICAgICAgICAgICAgICAgICAgeDogcGFyc2VJbnQoJHBhcmVudC5hdHRyKCdkYXRhLXgnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogcGFyc2VJbnQoJHBhcmVudC5hdHRyKCdkYXRhLXknKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgejogdGhpcy5fbWFwLmdldFpvb20oKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd3b3JkLWhpc3RvZ3JhbScsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXllcjogdGhpc1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25DbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgLy8gdW4tc2VsZWN0IGFuZCBwcmV2IHNlbGVjdGVkIGhpc3RvZ3JhbVxuICAgICAgICAgICAgJCgnLndvcmQtaGlzdG9ncmFtLWVudHJ5JykucmVtb3ZlQ2xhc3MoJ2hpZ2hsaWdodCcpO1xuICAgICAgICAgICAgJCh0aGlzLl9jb250YWluZXIpLnJlbW92ZUNsYXNzKCdoaWdobGlnaHQnKTtcbiAgICAgICAgICAgIC8vIGdldCB0YXJnZXRcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSAkKGUub3JpZ2luYWxFdmVudC50YXJnZXQpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzVGFyZ2V0TGF5ZXIoZS5vcmlnaW5hbEV2ZW50LnRhcmdldCkpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGxheWVyIGlzIG5vdCB0aGUgdGFyZ2V0XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHdvcmQgPSB0YXJnZXQuYXR0cignZGF0YS13b3JkJyk7XG4gICAgICAgICAgICBpZiAod29yZCkge1xuICAgICAgICAgICAgICAgICQodGhpcy5fY29udGFpbmVyKS5hZGRDbGFzcygnaGlnaGxpZ2h0Jyk7XG4gICAgICAgICAgICAgICAgJCgnLndvcmQtaGlzdG9ncmFtLWVudHJ5W2RhdGEtd29yZD0nICsgd29yZCArICddJykuYWRkQ2xhc3MoJ2hpZ2hsaWdodCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0ID0gd29yZDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZXJzLmNsaWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciAkcGFyZW50ID0gdGFyZ2V0LnBhcmVudHMoJy5sZWFmbGV0LWh0bWwtdGlsZScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGFuZGxlcnMuY2xpY2sodGFyZ2V0LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogd29yZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS14JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS15JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHo6IHRoaXMuX21hcC5nZXRab29tKCksXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnd29yZC1oaXN0b2dyYW0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGF5ZXI6IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZXh0cmFjdEV4dHJlbWE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHZhciBzdW1zID0gXy5tYXAoZGF0YSwgZnVuY3Rpb24oY291bnRzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF8uc3VtQnkoY291bnRzLCBleHRyYWN0Q291bnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG1pbjogXy5taW4oc3VtcyksXG4gICAgICAgICAgICAgICAgbWF4OiBfLm1heChzdW1zKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVuZGVyVGlsZTogZnVuY3Rpb24oY29udGFpbmVyLCBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoIWRhdGEgfHwgXy5pc0VtcHR5KGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGhpZ2hsaWdodCA9IHRoaXMuaGlnaGxpZ2h0O1xuICAgICAgICAgICAgLy8gY29udmVydCBvYmplY3QgdG8gYXJyYXlcbiAgICAgICAgICAgIHZhciB2YWx1ZXMgPSBfLm1hcChkYXRhLCBleHRyYWN0VmFsdWVzKS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYi50b3RhbCAtIGEudG90YWw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGdldCBudW1iZXIgb2YgZW50cmllc1xuICAgICAgICAgICAgdmFyIG51bUVudHJpZXMgPSBNYXRoLm1pbih2YWx1ZXMubGVuZ3RoLCBNQVhfTlVNX1dPUkRTKTtcbiAgICAgICAgICAgIHZhciAkaHRtbCA9ICQoJzxkaXYgY2xhc3M9XCJ3b3JkLWhpc3RvZ3JhbXNcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lLWJsb2NrO1wiPjwvZGl2PicpO1xuICAgICAgICAgICAgdmFyIHRvdGFsSGVpZ2h0ID0gMDtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHZhbHVlcy5zbGljZSgwLCBudW1FbnRyaWVzKS5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRvcGljID0gdmFsdWUudG9waWM7XG4gICAgICAgICAgICAgICAgdmFyIGZyZXF1ZW5jaWVzID0gdmFsdWUuZnJlcXVlbmNpZXM7XG4gICAgICAgICAgICAgICAgdmFyIG1heCA9IHZhbHVlLm1heDtcbiAgICAgICAgICAgICAgICB2YXIgdG90YWwgPSB2YWx1ZS50b3RhbDtcbiAgICAgICAgICAgICAgICB2YXIgYXZnID0gdmFsdWUuYXZnO1xuICAgICAgICAgICAgICAgIHZhciBzZW50aW1lbnRDbGFzcyA9IGV4dHJhY3RTZW50aW1lbnRDbGFzcyhhdmcpO1xuICAgICAgICAgICAgICAgIHZhciBoaWdobGlnaHRDbGFzcyA9ICh0b3BpYyA9PT0gaGlnaGxpZ2h0KSA/ICdoaWdobGlnaHQnIDogJyc7XG4gICAgICAgICAgICAgICAgLy8gc2NhbGUgdGhlIGhlaWdodCBiYXNlZCBvbiBsZXZlbCBtaW4gLyBtYXhcbiAgICAgICAgICAgICAgICB2YXIgcGVyY2VudCA9IHNlbGYudHJhbnNmb3JtVmFsdWUodG90YWwpO1xuICAgICAgICAgICAgICAgIHZhciBwZXJjZW50TGFiZWwgPSBNYXRoLnJvdW5kKChwZXJjZW50ICogMTAwKSAvIDEwKSAqIDEwO1xuICAgICAgICAgICAgICAgIHZhciBoZWlnaHQgPSBNSU5fRk9OVF9TSVpFICsgcGVyY2VudCAqIChNQVhfRk9OVF9TSVpFIC0gTUlOX0ZPTlRfU0laRSk7XG4gICAgICAgICAgICAgICAgdG90YWxIZWlnaHQgKz0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBjb250YWluZXIgJ2VudHJ5JyBmb3IgY2hhcnQgYW5kIGhhc2h0YWdcbiAgICAgICAgICAgICAgICB2YXIgJGVudHJ5ID0gJCgnPGRpdiBjbGFzcz1cIndvcmQtaGlzdG9ncmFtLWVudHJ5ICcgKyBoaWdobGlnaHRDbGFzcyArICdcIiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEtc2VudGltZW50PVwiJyArIGF2ZyArICdcIicgK1xuICAgICAgICAgICAgICAgICAgICAnZGF0YS13b3JkPVwiJyArIHRvcGljICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAgICdzdHlsZT1cIicgK1xuICAgICAgICAgICAgICAgICAgICAnaGVpZ2h0OicgKyBoZWlnaHQgKyAncHg7XCI+PC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIGNoYXJ0XG4gICAgICAgICAgICAgICAgdmFyICRjaGFydCA9ICQoJzxkaXYgY2xhc3M9XCJ3b3JkLWhpc3RvZ3JhbS1sZWZ0XCInICtcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEtc2VudGltZW50PVwiJyArIGF2ZyArICdcIicgK1xuICAgICAgICAgICAgICAgICAgICAnZGF0YS13b3JkPVwiJyArIHRvcGljICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAgICc+PC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgdmFyIGJhcldpZHRoID0gJ2NhbGMoJyArICgxMDAgLyBmcmVxdWVuY2llcy5sZW5ndGgpICsgJyUpJztcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgYmFyc1xuICAgICAgICAgICAgICAgIGZyZXF1ZW5jaWVzLmZvckVhY2goZnVuY3Rpb24oZnJlcXVlbmN5KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb3VudCA9IGZyZXF1ZW5jeS5jb3VudDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF2ZyA9IGZyZXF1ZW5jeS5hdmc7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZW50aW1lbnRDbGFzcyA9IGV4dHJhY3RTZW50aW1lbnRDbGFzcyhhdmcpO1xuICAgICAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIHBlcmNlbnQgcmVsYXRpdmUgdG8gdGhlIGhpZ2hlc3QgY291bnQgaW4gdGhlIHRpbGVcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlbGF0aXZlUGVyY2VudCA9IChtYXggIT09IDApID8gKGNvdW50IC8gbWF4KSAqIDEwMCA6IDA7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1ha2UgaW52aXNpYmxlIGlmIHplcm8gY291bnRcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZpc2liaWxpdHkgPSByZWxhdGl2ZVBlcmNlbnQgPT09IDAgPyAnaGlkZGVuJyA6ICcnO1xuICAgICAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIHN0eWxlIGNsYXNzIG9mIHRoZSBiYXJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBlcmNlbnRMYWJlbCA9IE1hdGgucm91bmQocmVsYXRpdmVQZXJjZW50IC8gMTApICogMTA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiYXJDbGFzc2VzID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgJ3dvcmQtaGlzdG9ncmFtLWJhcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAnd29yZC1oaXN0b2dyYW0tYmFyLScgKyBwZXJjZW50TGFiZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZW50aW1lbnRDbGFzcyArICctZmlsbCdcbiAgICAgICAgICAgICAgICAgICAgXS5qb2luKCcgJyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiYXJIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiYXJUb3A7XG4gICAgICAgICAgICAgICAgICAgIC8vIGVuc3VyZSB0aGVyZSBpcyBhdCBsZWFzdCBhIHNpbmdsZSBwaXhlbCBvZiBjb2xvclxuICAgICAgICAgICAgICAgICAgICBpZiAoKHJlbGF0aXZlUGVyY2VudCAvIDEwMCkgKiBoZWlnaHQgPCAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYXJIZWlnaHQgPSAnM3B4JztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhclRvcCA9ICdjYWxjKDEwMCUgLSAzcHgpJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhckhlaWdodCA9IHJlbGF0aXZlUGVyY2VudCArICclJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhclRvcCA9ICgxMDAgLSByZWxhdGl2ZVBlcmNlbnQpICsgJyUnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBiYXJcbiAgICAgICAgICAgICAgICAgICAgJGNoYXJ0LmFwcGVuZCgnPGRpdiBjbGFzcz1cIicgKyBiYXJDbGFzc2VzICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnZGF0YS13b3JkPVwiJyArIHRvcGljICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3R5bGU9XCInICtcbiAgICAgICAgICAgICAgICAgICAgICAgICd2aXNpYmlsaXR5OicgKyB2aXNpYmlsaXR5ICsgJzsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICd3aWR0aDonICsgYmFyV2lkdGggKyAnOycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2hlaWdodDonICsgYmFySGVpZ2h0ICsgJzsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICd0b3A6JyArIGJhclRvcCArICc7XCI+PC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgJGVudHJ5LmFwcGVuZCgkY2hhcnQpO1xuICAgICAgICAgICAgICAgIHZhciB0b3BpY0NsYXNzZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICd3b3JkLWhpc3RvZ3JhbS1sYWJlbCcsXG4gICAgICAgICAgICAgICAgICAgICd3b3JkLWhpc3RvZ3JhbS1sYWJlbC0nICsgcGVyY2VudExhYmVsLFxuICAgICAgICAgICAgICAgICAgICBzZW50aW1lbnRDbGFzc1xuICAgICAgICAgICAgICAgIF0uam9pbignICcpO1xuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSB0YWcgbGFiZWxcbiAgICAgICAgICAgICAgICB2YXIgJHRvcGljID0gJCgnPGRpdiBjbGFzcz1cIndvcmQtaGlzdG9ncmFtLXJpZ2h0XCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiJyArIHRvcGljQ2xhc3NlcyArICdcIicgK1xuICAgICAgICAgICAgICAgICAgICAnZGF0YS1zZW50aW1lbnQ9XCInICsgYXZnICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAgICdkYXRhLXdvcmQ9XCInICsgdG9waWMgKyAnXCInICtcbiAgICAgICAgICAgICAgICAgICAgJ3N0eWxlPVwiJyArXG4gICAgICAgICAgICAgICAgICAgICdmb250LXNpemU6JyArIGhlaWdodCArICdweDsnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xpbmUtaGVpZ2h0OicgKyBoZWlnaHQgKyAncHg7JyArXG4gICAgICAgICAgICAgICAgICAgICdoZWlnaHQ6JyArIGhlaWdodCArICdweFwiPicgKyB0b3BpYyArICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicpO1xuICAgICAgICAgICAgICAgICRlbnRyeS5hcHBlbmQoJHRvcGljKTtcbiAgICAgICAgICAgICAgICAkaHRtbC5hcHBlbmQoJGVudHJ5KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGh0bWwuY3NzKCd0b3AnLCBIQUxGX1NJWkUgLSAodG90YWxIZWlnaHQgLyAyKSk7XG4gICAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gJGh0bWxbMF0ub3V0ZXJIVE1MO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IFdvcmRIaXN0b2dyYW07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgICAgICByZW5kZXJUaWxlOiBmdW5jdGlvbihlbGVtKSB7XG4gICAgICAgICAgICBlbGVtLmlubmVySHRtbCA9ICc8ZGl2IGNsYXNzPVwiYmxpbmtpbmcgYmxpbmtpbmctdGlsZVwiIHN0eWxlPVwiYW5pbWF0aW9uLWRlbGF5OicgKyAtKE1hdGgucmFuZG9tKCkgKiAxMjAwKSArICdtcztcIj48L2Rpdj4nO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIERFTEFZID0gMTIwMDtcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgICAgIHJlbmRlclRpbGU6IGZ1bmN0aW9uKGVsZW0pIHtcbiAgICAgICAgICAgIHZhciBkZWxheSA9IC0oTWF0aC5yYW5kb20oKSAqIERFTEFZKSArICdtcyc7XG4gICAgICAgICAgICBlbGVtLmlubmVySFRNTCA9XG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJ2ZXJ0aWNhbC1jZW50ZXJlZC1ib3ggYmxpbmtpbmdcIiBzdHlsZT1cImFuaW1hdGlvbi1kZWxheTonICsgZGVsYXkgKyAnXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udGVudFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJsb2FkZXItY2lyY2xlXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImxvYWRlci1saW5lLW1hc2tcIiBzdHlsZT1cImFuaW1hdGlvbi1kZWxheTonICsgZGVsYXkgKyAnXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJsb2FkZXItbGluZVwiPjwvZGl2PicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2Pic7XG4gICAgICAgIH1cblxuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgREVMQVkgPSAxMjAwO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgICAgICAgcmVuZGVyVGlsZTogZnVuY3Rpb24oZWxlbSkge1xuICAgICAgICAgICAgdmFyIGRlbGF5ID0gLShNYXRoLnJhbmRvbSgpICogREVMQVkpICsgJ21zJztcbiAgICAgICAgICAgIGVsZW0uaW5uZXJIVE1MID1cbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cInZlcnRpY2FsLWNlbnRlcmVkLWJveFwiIHN0eWxlPVwiYW5pbWF0aW9uLWRlbGF5OicgKyBkZWxheSArICdcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250ZW50XCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImxvYWRlci1jaXJjbGVcIj48L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwibG9hZGVyLWxpbmUtbWFza1wiIHN0eWxlPVwiYW5pbWF0aW9uLWRlbGF5OicgKyBkZWxheSArICdcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImxvYWRlci1saW5lXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JztcbiAgICAgICAgfVxuXG4gICAgfTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBXZWJHTCA9IHJlcXVpcmUoJy4uLy4uL2NvcmUvV2ViR0wnKTtcblxuICAgIC8vIFRPRE86XG4gICAgLy8gICAgIC0gdXBkYXRlIHRvIHByZWNlcHR1YWwgY29sb3IgcmFtcHMgKGxheWVyIGlzIGN1cnJlbnRseSBicm9rZW4pXG5cbiAgICB2YXIgSGVhdG1hcCA9IFdlYkdMLmV4dGVuZCh7XG5cbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgc2hhZGVyczoge1xuICAgICAgICAgICAgICAgIHZlcnQ6ICcuLi8uLi9zaGFkZXJzL2hlYXRtYXAudmVydCcsXG4gICAgICAgICAgICAgICAgZnJhZzogJy4uLy4uL3NoYWRlcnMvaGVhdG1hcC5mcmFnJyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBiZWZvcmVEcmF3OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciByYW1wID0gdGhpcy5nZXRDb2xvclJhbXAoKTtcbiAgICAgICAgICAgIHZhciBjb2xvciA9IFswLCAwLCAwLCAwXTtcbiAgICAgICAgICAgIHRoaXMuX3NoYWRlci5zZXRVbmlmb3JtKCd1TWluJywgdGhpcy5nZXRFeHRyZW1hKCkubWluKTtcbiAgICAgICAgICAgIHRoaXMuX3NoYWRlci5zZXRVbmlmb3JtKCd1TWF4JywgdGhpcy5nZXRFeHRyZW1hKCkubWF4KTtcbiAgICAgICAgICAgIHRoaXMuX3NoYWRlci5zZXRVbmlmb3JtKCd1Q29sb3JSYW1wRnJvbScsIHJhbXAoMC4wLCBjb2xvcikpO1xuICAgICAgICAgICAgdGhpcy5fc2hhZGVyLnNldFVuaWZvcm0oJ3VDb2xvclJhbXBUbycsIHJhbXAoMS4wLCBjb2xvcikpO1xuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gSGVhdG1hcDtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBSZXF1ZXN0b3IgPSByZXF1aXJlKCcuL1JlcXVlc3RvcicpO1xuXG4gICAgZnVuY3Rpb24gTWV0YVJlcXVlc3RvcigpIHtcbiAgICAgICAgUmVxdWVzdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgTWV0YVJlcXVlc3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFJlcXVlc3Rvci5wcm90b3R5cGUpO1xuXG4gICAgTWV0YVJlcXVlc3Rvci5wcm90b3R5cGUuZ2V0SGFzaCA9IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICByZXR1cm4gcmVxLnR5cGUgKyAnLScgK1xuICAgICAgICAgICAgcmVxLmluZGV4ICsgJy0nICtcbiAgICAgICAgICAgIHJlcS5zdG9yZTtcbiAgICB9O1xuXG4gICAgTWV0YVJlcXVlc3Rvci5wcm90b3R5cGUuZ2V0VVJMID0gZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiAnbWV0YS8nICtcbiAgICAgICAgICAgIHJlcy50eXBlICsgJy8nICtcbiAgICAgICAgICAgIHJlcy5lbmRwb2ludCArICcvJyArXG4gICAgICAgICAgICByZXMuaW5kZXggKyAnLycgK1xuICAgICAgICAgICAgcmVzLnN0b3JlO1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IE1ldGFSZXF1ZXN0b3I7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgcmV0cnlJbnRlcnZhbCA9IDUwMDA7XG5cbiAgICBmdW5jdGlvbiBnZXRIb3N0KCkge1xuICAgICAgICB2YXIgbG9jID0gd2luZG93LmxvY2F0aW9uO1xuICAgICAgICB2YXIgbmV3X3VyaTtcbiAgICAgICAgaWYgKGxvYy5wcm90b2NvbCA9PT0gJ2h0dHBzOicpIHtcbiAgICAgICAgICAgIG5ld191cmkgPSAnd3NzOic7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXdfdXJpID0gJ3dzOic7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ld191cmkgKyAnLy8nICsgbG9jLmhvc3QgKyBsb2MucGF0aG5hbWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXN0YWJsaXNoQ29ubmVjdGlvbihyZXF1ZXN0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJlcXVlc3Rvci5zb2NrZXQgPSBuZXcgV2ViU29ja2V0KGdldEhvc3QoKSArIHJlcXVlc3Rvci51cmwpO1xuICAgICAgICAvLyBvbiBvcGVuXG4gICAgICAgIHJlcXVlc3Rvci5zb2NrZXQub25vcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXF1ZXN0b3IuaXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdXZWJzb2NrZXQgY29ubmVjdGlvbiBlc3RhYmxpc2hlZCcpO1xuICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gb24gbWVzc2FnZVxuICAgICAgICByZXF1ZXN0b3Iuc29ja2V0Lm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgcmVzID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcbiAgICAgICAgICAgIHZhciBoYXNoID0gcmVxdWVzdG9yLmdldEhhc2gocmVzKTtcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0gcmVxdWVzdG9yLnJlcXVlc3RzW2hhc2hdO1xuICAgICAgICAgICAgZGVsZXRlIHJlcXVlc3Rvci5yZXF1ZXN0c1toYXNoXTtcbiAgICAgICAgICAgIGlmIChyZXMuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIHJlcXVlc3QucmVzb2x2ZShyZXF1ZXN0b3IuZ2V0VVJMKHJlcyksIHJlcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcXVlc3QucmVqZWN0KHJlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vIG9uIGNsb3NlXG4gICAgICAgIHJlcXVlc3Rvci5zb2NrZXQub25jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gbG9nIGNsb3NlIG9ubHkgaWYgY29ubmVjdGlvbiB3YXMgZXZlciBvcGVuXG4gICAgICAgICAgICBpZiAocmVxdWVzdG9yLmlzT3Blbikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignV2Vic29ja2V0IGNvbm5lY3Rpb24gY2xvc2VkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0b3Iuc29ja2V0ID0gbnVsbDtcbiAgICAgICAgICAgIHJlcXVlc3Rvci5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIC8vIHJlamVjdCBhbGwgcGVuZGluZyByZXF1ZXN0c1xuICAgICAgICAgICAgT2JqZWN0LmtleXMocmVxdWVzdG9yLnJlcXVlc3RzKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgICAgIHJlcXVlc3Rvci5yZXF1ZXN0c1trZXldLnJlamVjdCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBjbGVhciByZXF1ZXN0IG1hcFxuICAgICAgICAgICAgcmVxdWVzdG9yLnJlcXVlc3RzID0ge307XG4gICAgICAgICAgICAvLyBhdHRlbXB0IHRvIHJlLWVzdGFibGlzaCBjb25uZWN0aW9uXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGVzdGFibGlzaENvbm5lY3Rpb24ocmVxdWVzdG9yLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gb25jZSBjb25uZWN0aW9uIGlzIHJlLWVzdGFibGlzaGVkLCBzZW5kIHBlbmRpbmcgcmVxdWVzdHNcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdG9yLnBlbmRpbmcuZm9yRWFjaChmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3Rvci5nZXQocmVxKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3Rvci5wZW5kaW5nID0gW107XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCByZXRyeUludGVydmFsKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBSZXF1ZXN0b3IodXJsLCBjYWxsYmFjaykge1xuICAgICAgICB0aGlzLnVybCA9IHVybDtcbiAgICAgICAgdGhpcy5yZXF1ZXN0cyA9IHt9O1xuICAgICAgICB0aGlzLnBlbmRpbmcgPSBbXTtcbiAgICAgICAgdGhpcy5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgZXN0YWJsaXNoQ29ubmVjdGlvbih0aGlzLCBjYWxsYmFjayk7XG4gICAgfVxuXG4gICAgUmVxdWVzdG9yLnByb3RvdHlwZS5nZXRIYXNoID0gZnVuY3Rpb24oIC8qcmVxKi8gKSB7XG4gICAgICAgIC8vIG92ZXJyaWRlXG4gICAgfTtcblxuICAgIFJlcXVlc3Rvci5wcm90b3R5cGUuZ2V0VVJMID0gZnVuY3Rpb24oIC8qcmVzKi8gKSB7XG4gICAgICAgIC8vIG92ZXJyaWRlXG4gICAgfTtcblxuICAgIFJlcXVlc3Rvci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIGlmICghdGhpcy5pc09wZW4pIHtcbiAgICAgICAgICAgIC8vIGlmIG5vIGNvbm5lY3Rpb24sIGFkZCByZXF1ZXN0IHRvIHBlbmRpbmcgcXVldWVcbiAgICAgICAgICAgIHRoaXMucGVuZGluZy5wdXNoKHJlcSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGhhc2ggPSB0aGlzLmdldEhhc2gocmVxKTtcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB0aGlzLnJlcXVlc3RzW2hhc2hdO1xuICAgICAgICBpZiAocmVxdWVzdCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3QucHJvbWlzZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJlcXVlc3QgPSB0aGlzLnJlcXVlc3RzW2hhc2hdID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICB0aGlzLnNvY2tldC5zZW5kKEpTT04uc3RyaW5naWZ5KHJlcSkpO1xuICAgICAgICByZXR1cm4gcmVxdWVzdC5wcm9taXNlKCk7XG4gICAgfTtcblxuICAgIFJlcXVlc3Rvci5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zb2NrZXQub25jbG9zZSA9IG51bGw7XG4gICAgICAgIHRoaXMuc29ja2V0LmNsb3NlKCk7XG4gICAgICAgIHRoaXMuc29ja2V0ID0gbnVsbDtcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBSZXF1ZXN0b3I7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgc3RyaW5naWZ5ID0gcmVxdWlyZSgnanNvbi1zdGFibGUtc3RyaW5naWZ5Jyk7XG4gICAgdmFyIFJlcXVlc3RvciA9IHJlcXVpcmUoJy4vUmVxdWVzdG9yJyk7XG5cbiAgICBmdW5jdGlvbiBwcnVuZUVtcHR5KG9iaikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gcHJ1bmUoY3VycmVudCkge1xuICAgICAgICAgICAgXy5mb3JPd24oY3VycmVudCwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICAgICAgICBpZiAoXy5pc1VuZGVmaW5lZCh2YWx1ZSkgfHwgXy5pc051bGwodmFsdWUpIHx8IF8uaXNOYU4odmFsdWUpIHx8XG4gICAgICAgICAgICAgICAgKF8uaXNTdHJpbmcodmFsdWUpICYmIF8uaXNFbXB0eSh2YWx1ZSkpIHx8XG4gICAgICAgICAgICAgICAgKF8uaXNPYmplY3QodmFsdWUpICYmIF8uaXNFbXB0eShwcnVuZSh2YWx1ZSkpKSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBjdXJyZW50W2tleV07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIGFueSBsZWZ0b3ZlciB1bmRlZmluZWQgdmFsdWVzIGZyb20gdGhlIGRlbGV0ZVxuICAgICAgICAgICAgLy8gb3BlcmF0aW9uIG9uIGFuIGFycmF5XG4gICAgICAgICAgICBpZiAoXy5pc0FycmF5KGN1cnJlbnQpKSB7XG4gICAgICAgICAgICAgICAgXy5wdWxsKGN1cnJlbnQsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudDtcbiAgICAgICAgfShfLmNsb25lRGVlcChvYmopKTsgLy8gZG8gbm90IG1vZGlmeSB0aGUgb3JpZ2luYWwgb2JqZWN0LCBjcmVhdGUgYSBjbG9uZSBpbnN0ZWFkXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gVGlsZVJlcXVlc3RvcigpIHtcbiAgICAgICAgUmVxdWVzdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgVGlsZVJlcXVlc3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFJlcXVlc3Rvci5wcm90b3R5cGUpO1xuXG4gICAgVGlsZVJlcXVlc3Rvci5wcm90b3R5cGUuZ2V0SGFzaCA9IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgY29vcmQgPSByZXEuY29vcmQ7XG4gICAgICAgIHZhciBoYXNoID0gc3RyaW5naWZ5KHBydW5lRW1wdHkocmVxLnBhcmFtcykpO1xuICAgICAgICByZXR1cm4gcmVxLnR5cGUgKyAnLScgK1xuICAgICAgICAgICAgcmVxLmluZGV4ICsgJy0nICtcbiAgICAgICAgICAgIHJlcS5zdG9yZSArICctJyArXG4gICAgICAgICAgICBjb29yZC54ICsgJy0nICtcbiAgICAgICAgICAgIGNvb3JkLnkgKyAnLScgK1xuICAgICAgICAgICAgY29vcmQueiArICctJyArXG4gICAgICAgICAgICBoYXNoO1xuICAgIH07XG5cbiAgICBUaWxlUmVxdWVzdG9yLnByb3RvdHlwZS5nZXRVUkwgPSBmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgdmFyIGNvb3JkID0gcmVzLmNvb3JkO1xuICAgICAgICByZXR1cm4gJ3RpbGUvJyArXG4gICAgICAgICAgICByZXMudHlwZSArICcvJyArXG4gICAgICAgICAgICByZXMuaW5kZXggKyAnLycgK1xuICAgICAgICAgICAgcmVzLnN0b3JlICsgJy8nICtcbiAgICAgICAgICAgIGNvb3JkLnogKyAnLycgK1xuICAgICAgICAgICAgY29vcmQueCArICcvJyArXG4gICAgICAgICAgICBjb29yZC55O1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRpbGVSZXF1ZXN0b3I7XG5cbn0oKSk7XG4iXX0=
