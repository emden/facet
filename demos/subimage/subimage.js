function sphere_mercator_coords(tess)
{
    var tex_coord = [];
    var elements = [];

    for (var i=0; i<=tess; ++i)
        for (var j=0; j<=tess; ++j)
            tex_coord.push(i/tess, j/tess);

    for (i=0; i<tess; ++i)
        for (var j=0; j<tess; ++j) {
            var ix = (tess + 1) * i + j;
            elements.push(ix, ix+1, ix+tess+2, ix, ix+tess+2, ix+tess+1);
        };

    return Facet.model({
        type: "triangles",
        tex_coord: [tex_coord, 2],
        elements: elements,
        vertex: function() {
            var xf = this.tex_coord.mul(2*Math.PI).add(Shade.vec(0, -Math.PI));
            var lat = xf.at(1).sinh().atan();
            var lon = xf.at(0);
            var stretch = lat.cos();
            return Shade.vec(lon.sin().mul(stretch),
                             lat.sin(),
                             lon.cos().mul(stretch), 1);
        }
    });
}

$().ready(function () {
    var canvas = document.getElementById("webgl");
    var longitude_center = -98;
    var latitude_center = 38;
    var zoom = 3;
    var prev_mouse_pos;
    var mv = Shade.parameter("mat4");
    var proj = Shade.parameter("mat4");
    var gl = Facet.init(canvas, {
        clearDepth: 1.0,
        clearColor: [0,0,0,1],
        display: function() {
            var r1 = Facet.rotation(latitude_center * (Math.PI/180), [1, 0, 0]);
            var r2 = Facet.rotation((longitude_center + 180) * (Math.PI/180), [0,-1, 0]);
            var earth_model = mat4.product(r1, r2);
            var view = Facet.translation(0.0, 0.0, -6.0);
            gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            mv.set(mat4.product(view, earth_model));
            proj.set(Facet.perspective(22.5 / zoom, 720/480, 4.0, 8.0));
            sphere_drawable.draw();
        },
        attributes: {
            alpha: true,
            depth: true
        },
        mousedown: function(event) {
            prev_mouse_pos = [event.offsetX, event.offsetY];
        },
        mousemove: function(event) {
            if ((event.which & 1) && !event.shiftKey) {
                longitude_center -= (event.offsetX - prev_mouse_pos[0]) / 
                    (3 * zoom);
                latitude_center  += (event.offsetY - prev_mouse_pos[1]) / 
                    (4 * zoom);
                latitude_center = Math.max(Math.min(80, latitude_center), -80);
            }
            if ((event.which & 1) && event.shiftKey) {
                zoom *= 1.0 + (event.offsetY - prev_mouse_pos[1]) / 240;
            }
            prev_mouse_pos = [event.offsetX, event.offsetY];
            gl.display();
        }
    });
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    var sphere = sphere_mercator_coords(20);
    var texture = Facet.texture({ width: 2048, height: 2048 });

    for (var i=0; i<8; ++i)
    for (var j=0; j<8; ++j)
        Facet.load_image_into_texture({
            texture: texture,
            src: "http://tile.openstreetmap.org/3/" + i + "/" + j + ".png",
            crossOrigin: "anonymous",
            x_offset: i * 256,
            y_offset: 2048 - (j+1) * 256,
            onload: function() { gl.display(); }
        });

    var sphere_drawable = Facet.bake(sphere, {
        position: proj.mul(mv).mul(sphere.vertex()),
        color: Shade.texture2D(texture, sphere.tex_coord)
    });
    gl.display();
});
