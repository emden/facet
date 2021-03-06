// NB: Luminance float textures appear to clamp to [0,1] on Chrome 15
// on Linux...

Facet.Data.texture_table = function(table)
{
    var ctx = Facet._globals.ctx;

    var elements = [];
    for (var row_ix = 0; row_ix < table.data.length; ++row_ix) {
        var row = table.data[row_ix];
        if (!table.is_numeric_row_complete(row))
            continue;
        for (var col_ix = 0; col_ix < table.number_columns.length; ++col_ix) {
            var col_name = table.columns[table.number_columns[col_ix]];
            var val = row[col_name];
            if (typeof val !== "number")
                throw "texture_table requires numeric values";
            elements.push(val);
        }
    }

    var table_ncols = table.number_columns.length;
    // can't be table.data.length because not all rows are valid.
    var table_nrows = elements.length / table.number_columns.length;
    var texture_width = 1;

    while (4 * texture_width * texture_width < elements.length) {
        texture_width = texture_width * 2;
    }
    var texture_height = Math.ceil(elements.length / (4 * texture_width));

    // Tested on Chrome: the Float32Array constructor interprets "undefined" as 0
    // so no push to pad array is necessary; we simply set the last
    // padded value of the array to 0.
    if (elements.length < 4 * texture_height * texture_width)
        elements[4 * texture_height * texture_width - 1] = 0;

    var texture = Facet.texture({
        width: texture_width,
        height: texture_height,
        buffer: new Float32Array(elements),
        type: ctx.FLOAT,
        format: ctx.RGBA,
        min_filter: ctx.NEAREST,
        mag_filter: ctx.NEAREST
    });

    var index = Shade(function(row, col) {
        var linear_index    = row.mul(table_ncols).add(col);
        var in_texel_offset = linear_index.mod(4);
        var texel_index     = linear_index.div(4).floor();
        var x               = texel_index.mod(texture_width);
        var y               = texel_index.div(texture_width).floor();
        var result          = Shade.vec(x, y, in_texel_offset);
        return result;
    });
    var at = Shade(function(row, col) {
        // returns Shade expression with value at row, col
        var ix = index(row, col);
        var uv = ix.swizzle("xy")
            .add(Shade.vec(0.5, 0.5))
            .div(Shade.vec(texture_width, texture_height))
            ;
        return Shade.texture2D(texture, uv).at(ix.z());
    });

    return {
        n_rows: table_nrows,
        n_cols: table_ncols,
        at: at,
        index: index
    };
};
