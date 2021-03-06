Facet.Camera.ortho = function(opts)
{
    opts = _.defaults(opts || {}, {
        aspect_ratio: 1,
        left: -1,
        right: 1,
        bottom: -1,
        top: 1,
        near: -1,
        far: 1
    });

    var viewport_ratio = opts.aspect_ratio;
    var left, right, bottom, top;
    var near = opts.near;
    var far = opts.far;

    if (!_.isUndefined(opts.center) && !_.isUndefined(opts.zoom)) {
        var viewport_width = Shade.div(1, opts.zoom);
        left   = opts.center.at(0).sub(viewport_width);
        right  = opts.center.at(0).add(viewport_width);
        bottom = opts.center.at(1).sub(viewport_width);
        top    = opts.center.at(1).add(viewport_width);
    } else {
        left = opts.left;
        right = opts.right;
        bottom = opts.bottom;
        top = opts.top;
    }

    function letterbox_projection() {
        var cy = Shade.add(top, bottom).div(2);
        var half_width = Shade.sub(right, left).div(2);
        var half_height = half_width.div(viewport_ratio);
        var l = left;
        var r = right;
        var t = cy.add(half_height);
        var b = cy.sub(half_height);
        return Shade.ortho(l, r, b, t, near, far);
    }

    function pillarbox_projection() {
        var cx = Shade.add(right, left).div(2);
        var half_height = Shade.sub(top, bottom).div(2);
        var half_width = half_height.mul(viewport_ratio);
        var l = cx.sub(half_width);
        var r = cx.add(half_width);
        var t = top;
        var b = bottom;
        return Shade.ortho(l, r, b, t, near, far);
    }

    var view_ratio = Shade.sub(right, left).div(Shade.sub(top, bottom));
    
    var m = view_ratio.gt(viewport_ratio)
        .selection(letterbox_projection(),
                   pillarbox_projection());

    function result(obj) {
        return result.project(obj);
    }
    result.project = function(model_vertex) {
        return m.mul(model_vertex);
    };
    return result;
};
