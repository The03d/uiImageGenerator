////////////////PHOTOSHOP STUFF N' JUNK////////////////
// make_selection() makes a rectangular selection based position and dimensions
    // x, y           position from top left corner of document
    // sw, sh         selection width and height
    // is called by create_output_folders() and make_fill_layer()
function make_selection( x,y,sw,sh)
{
                //   [left,top], [left,bottom], [right,bottom], [right,top]
    app.activeDocument.selection.select([ [x,y], [x,y+sh], [x+sw,y+sh], [x+sw,y] ]);
}

function user_mask()
{

    var ref = new ActionReference();
    ref.putProperty(charIDToTypeID('Prpr'),stringIDToTypeID("hasUserMask"));
    ref.putEnumerated( charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt") ); 
    return executeActionGet(ref).getBoolean (stringIDToTypeID("hasUserMask"));
}

function user_mask_enabled()
{

    var ref = new ActionReference();
    ref.putProperty(charIDToTypeID('Prpr'),stringIDToTypeID("userMaskEnabled"));
    ref.putEnumerated( charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt") ); 
    return executeActionGet(ref).getBoolean (stringIDToTypeID("userMaskEnabled"));
}

function disenable_mask(Bool) 
{
    var desc3 = new ActionDescriptor();
    var ref2 = new ActionReference();
    ref2.putEnumerated( charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt') );
    desc3.putReference( charIDToTypeID('null'), ref2 );
    var desc4 = new ActionDescriptor();
    desc4.putBoolean( charIDToTypeID('UsrM'), !Bool );
    desc3.putObject( charIDToTypeID('T   '), charIDToTypeID('Lyr '), desc4 );
    executeAction( charIDToTypeID('setd'), desc3, DialogModes.NO );
}

// make_layer_mask() is scriptlistener action script garbage needed to make a layer mask from a selection.
    // is called by createOutputFolders()
function make_layer_mask( maskType ) 
{
    // mask types:
    //'HdSl' hidden, requires a selection
    //'RvlS' shown (revealed), requires a selection
    //'RvlA' mask all, no selection required
    
    if( maskType == undefined) maskType = 'RvlS' ; //from selection
    //requires a selection 'RvlS'  complete mask 'RvlA' otherThanSelection 'HdSl'
        var desc140 = new ActionDescriptor();
        desc140.putClass( charIDToTypeID('Nw  '), charIDToTypeID('Chnl') );
            var ref51 = new ActionReference();
            ref51.putEnumerated( charIDToTypeID('Chnl'), charIDToTypeID('Chnl'), charIDToTypeID('Msk ') );
        desc140.putReference( charIDToTypeID('At  '), ref51 );
        desc140.putEnumerated( charIDToTypeID('Usng'), charIDToTypeID('UsrM'), charIDToTypeID(maskType) );
        executeAction( charIDToTypeID('Mk  '), desc140, DialogModes.NO );
}

// *selectTransparenty() is more action script garbage needed to select based on layer transparency.
function select_transparency()
{
    var idChnl = charIDToTypeID( "Chnl" );

    var actionSelect = new ActionReference();
    actionSelect.putProperty( idChnl, charIDToTypeID( "fsel" ) );     

    var actionTransparent = new ActionReference();    
    actionTransparent.putEnumerated( idChnl, idChnl, charIDToTypeID( "Trsp" ) );

    var actionDesc = new ActionDescriptor();
    actionDesc.putReference( charIDToTypeID( "null" ), actionSelect );
    actionDesc.putReference( charIDToTypeID( "T   " ), actionTransparent );

    executeAction( charIDToTypeID( "setd" ), actionDesc, DialogModes.NO );
}

// *unlink_layer_mask() is yet more action script garbage needed to unlink layer masks.
function unlink_layer_mask()
{
    var idsetd = charIDToTypeID( "setd" );
        var desc464 = new ActionDescriptor();
        var idnull = charIDToTypeID( "null" );
            var ref253 = new ActionReference();
            var idLyr = charIDToTypeID( "Lyr " );
            var idOrdn = charIDToTypeID( "Ordn" );
            var idTrgt = charIDToTypeID( "Trgt" );
            ref253.putEnumerated( idLyr, idOrdn, idTrgt );
        desc464.putReference( idnull, ref253 );
        var idT = charIDToTypeID( "T   " );
            var desc465 = new ActionDescriptor();
            var idUsrs = charIDToTypeID( "Usrs" );
            desc465.putBoolean( idUsrs, false );
        var idLyr = charIDToTypeID( "Lyr " );
        desc464.putObject( idT, idLyr, desc465 );
    executeAction( idsetd, desc464, DialogModes.NO );
}

// mask_coords_to_bounds() converts x, y, width, length coordinates to bound coordinates.
    // it returns the coordinates as an array of x, y coordinates of the top left and
    // bottom right corners.
function mask_coords_to_bounds( coords )
{
    var topLeft = [ coords[0], coords[1] ];
    var bottomRight = [ coords[0] + coords[2], coords[1] + coords[3] ];

    return topLeft.concat( bottomRight );
}

// find_position() finds the position of a corner or the centre of the provided bounds.
    //returns the position at the specified location.
function find_position( bounds, position )
{
    if ( position == "centre" )
    {
        var coord_x = find_average( [ bounds[0], bounds[2] ] );
        var coord_y = find_average( [ bounds[1], bounds[3] ] );
        var coords_centre_position = [ coord_x, coord_y ];

        return coords_centre_position;
    } else if ( position == "leftTop" ) {
        var coord_x = bounds[0];
        var coord_y = bounds[1];
        var coord_left_top_position = [ coord_x, coord_y ];
        
        return coord_left_top_position;
    } else if ( position == "leftBottom" ) {
        var coord_x = bounds[0];
        var coord_y = bounds[3];
        var coord_left_bottom_position = [ coord_x, coord_y ];
        
        return coord_left_bottom_position;
    } else if ( position == "rightBottom" ) {
        var coord_x = bounds[2];
        var coord_y = bounds[3];
        var coord_right_bottom_position = [ coord_x, coord_y ];
        
        return coord_right_bottom_position;
    } else if ( position == "rightTop" ) {
        var coord_x = bounds[2];
        var coord_y = bounds[1];
        var coord_right_top_position = [ coord_x, coord_y ];
        
        return coord_right_top_position;
    }
}

// find_delta_position() returns the difference in position between two points.
function find_delta_position( coord1, coord2 )
{
    var deltaX = parseFloat(coord2[0]) - parseFloat(coord1[0]);
    var deltaY = parseFloat(coord2[1]) - parseFloat(coord1[1]);

    return [ deltaX, deltaY ];
}

// *has_background_layer() determines if a document has a background layer.
function has_background_layer( doc )
{
    try{ 
        doc.backgroundLayer; 
        return true; 
    }catch(e){ 
        return false; 
    }
}

// make_fill_layer() adds a layer to the layers array of the current document and fills it with black.
function make_fill_layer( doc )
{
    // app.activeDocument = doc;
    try
    {
        var fill_layer = doc.layers.getByName( "fillLayer" );
    } catch(e) {
        var fill_layer = doc.artLayers.add();
        fill_layer.name = "fillLayer";
        doc.activeLayer = fill_layer;
        make_selection( 0, 0, doc.width, doc.height );
        var fill_colour = new SolidColor()
            fill_colour.rgb.red = 0;
            fill_colour.rgb.green = 0;
            fill_colour.rgb.blue = 0;
        doc.selection.fill( fill_colour );
        doc.selection.deselect();
        // fill_layer.isBackgroundLayer = true;
    }

    return fill_layer;
}

// save_psd() saves the current document as a psd.
function save_psd( name, dir, document )
{
    // var psdPath = dir + "/" + name + ".psd";
    var new_psd = new File( dir + "/" + name + ".psd" );

    var psd_save_options = new PhotoshopSaveOptions();
        psd_save_options.alphaChannels = true;
        psd_save_options.annotations = false;
        psd_save_options.embedColorProfile = true;
        psd_save_options.layers = true;
        psd_save_options.spotColors = false;

    document.saveAs(new_psd, psd_save_options, true, Extension.LOWERCASE );

    return new_psd;
}

function save_png( name, dir, document )
{
    var png_path = dir + "/" + name + ".png";
    var new_png = new File( png_path );
    
    var png_save_options = new PNGSaveOptions();
        png_save_options.compression = 0;
        png_save_options.interlaced = false;
    
    document.saveAs(new_png, png_save_options, true, Extension.LOWERCASE);

    return new_png
}