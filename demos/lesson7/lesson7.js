var gl;
var cube_batch, pyramid_batch;
var angle;
var texture = [];
var sampler;
var current_texture;
var cube_model;
var light_ambient = Shade.vec(0.3, 0.3, 0.3, 1.0);
var light_diffuse = Shade.color('white');
var light_position = Shade.vec(0, 0, 6);

//////////////////////////////////////////////////////////////////////////////

function create_cube_batch(opts)
{
    opts = opts || {};
    var material_color = Shade.texture2D(sampler, opts.model.tex_coord);
    var final_color;
    var model_mat = Shade.rotation(angle, Shade.vec(1, 1, 1));
    var camera = Facet.Camera.perspective({
        look_at: [Shade.vec(0, 0, 6), Shade.vec(0, 0, -1), Shade.vec(0, 1, 0)],
        field_of_view_y: 45,
        aspect_ratio: 720/480,
        near_distance: 0.1,
        far_distance: 100
    });
 
    if (opts.lighting) {
        // replicate OpenGL lighting on a shader
        // 
        // http://glprogramming.com/red/chapter05.html, section
        //  "The Mathematics of Lighting"
        //
        final_color = Shade.gl_light({
            light_position: light_position,
            material_color: material_color,
            light_ambient: light_ambient,
            light_diffuse: light_diffuse,
            per_vertex: opts.per_vertex,
            vertex: model_mat.mul(opts.model.vertex),
            normal: model_mat.mul(opts.model.normal)
        });
    } else {
        final_color = material_color;
    }

    return Facet.bake(opts.model, {
        position: camera(model_mat.mul(opts.model.vertex)),
        color: final_color
    });
}

function draw_it()
{
    cube_batch.draw();
}

$().ready(function () {
    var canvas = document.getElementById("webgl");
    gl = Facet.init(canvas, {
        clearDepth: 1.0,
        clearColor: [0,0,0,0.2],
        display: draw_it,
        attributes:
        {
            alpha: true,
            depth: true
        }
    });

    var cube_model = Facet.Models.flat_cube();

    $("#linear").click(function() { sampler.set(texture[0]); });
    $("#nearest").click(function() { sampler.set(texture[1]); });
    $("#mipmap").click(function() { sampler.set(texture[2]); });
    $("#per_vertex").click(function(obj) {
        var thisCheck = $(this);
        cube_batch = create_cube_batch({ lighting: true,
                                         model: cube_model,
                                         per_vertex: thisCheck.is(":checked") });
    });

    angle = Shade.parameter("float");

    texture[0] = Facet.texture({ 
        src: "../img/crate.jpg",
        mag_filter: gl.LINEAR,
        min_filter: gl.LINEAR
    });
    texture[1] = Facet.texture({ 
        src: "../img/crate.jpg",
        mag_filter: gl.NEAREST,
        min_filter: gl.NEAREST
    });
    texture[2] = Facet.texture({ 
        src: "../img/crate.jpg",
        mag_filter: gl.LINEAR,
        min_filter: gl.LINEAR_MIPMAP_NEAREST,
        mipmaps: true
    });
    sampler = Shade.parameter("sampler2D");
    sampler.set(texture[0]);

    cube_batch = create_cube_batch({ lighting: true,
                                     model: cube_model,
                                     per_vertex: true });

    var start = new Date().getTime();
    var f = function() {
        window.requestAnimFrame(f, canvas);
        var elapsed = new Date().getTime() - start;
        angle.set((elapsed / 20) * (Math.PI/180));
        gl.display();
    };
    f();
});
