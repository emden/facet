Facet.render_buffer = function(opts)
{
    var ctx = Facet._globals.ctx;
    var frame_buffer = ctx.createFramebuffer();
    opts = _.defaults(opts || {}, {
        width: 512,
        height: 512,
        mag_filter: ctx.LINEAR,
        min_filter: ctx.LINEAR,
        wrap_s: ctx.CLAMP_TO_EDGE,
        wrap_t: ctx.CLAMP_TO_EDGE
    });

    // Weird:
    // http://www.khronos.org/registry/gles/specs/2.0/es_full_spec_2.0.25.pdf
    // Page 118
    // 
    // Seems unenforced in my implementations of WebGL, even though 
    // the WebGL spec defers to GLSL ES spec.
    // 
    // if (opts.width != opts.height)
    //     throw "renderbuffers must be square (blame GLSL ES!)";

    var rttTexture = Facet.texture(opts);

    frame_buffer.init = function(width, height) {
        var ctx = Facet._globals.ctx;
        this.width  = opts.width;
        this.height = opts.height;
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, this);
        var renderbuffer = ctx.createRenderbuffer();
        ctx.bindRenderbuffer(ctx.RENDERBUFFER, renderbuffer);
        ctx.renderbufferStorage(ctx.RENDERBUFFER, ctx.DEPTH_COMPONENT16, this.width, this.height);

        ctx.framebufferTexture2D(ctx.FRAMEBUFFER, ctx.COLOR_ATTACHMENT0, ctx.TEXTURE_2D, rttTexture, 0);
        ctx.framebufferRenderbuffer(ctx.FRAMEBUFFER, ctx.DEPTH_ATTACHMENT, ctx.RENDERBUFFER, renderbuffer);
        var status = ctx.checkFramebufferStatus(ctx.FRAMEBUFFER);
        try {
            switch (status) {
            case ctx.FRAMEBUFFER_COMPLETE:
                break;
            case ctx.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                throw "incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT";
            case ctx.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                throw "incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";
            case ctx.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                throw "incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS";
            case ctx.FRAMEBUFFER_UNSUPPORTED:
                throw "incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED";
            default:
                throw "incomplete framebuffer: " + status;
            }
        } finally {
            ctx.bindTexture(ctx.TEXTURE_2D, null);
            ctx.bindRenderbuffer(ctx.RENDERBUFFER, null);
            ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
        }
    };

    frame_buffer.init(opts.width, opts.height);
    frame_buffer._shade_type = 'render_buffer';
    frame_buffer.texture = rttTexture;
    frame_buffer.resize = function(width, height) {
        opts.width = width;
        opts.height = height;
        this.texture.init(opts);
        this.init(width, height);
    };
    frame_buffer.with_bound_buffer = function(what) {
        var ctx = Facet._globals.ctx;
        try {
            ctx.bindFramebuffer(ctx.FRAMEBUFFER, this);
            ctx.viewport(0, 0, this.width, this.height);
            return what();
        } finally {
            ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
        }
    };
    frame_buffer.make_screen_batch = function(with_texel_at_uv) {
        var sq = Facet.Models.square();
        return Facet.bake(sq, {
            position: sq.vertex.mul(2).sub(1),
            color: with_texel_at_uv(Shade.texture2D(this.texture, sq.tex_coord), sq.tex_coord)
        });
    };
    return frame_buffer;
};
