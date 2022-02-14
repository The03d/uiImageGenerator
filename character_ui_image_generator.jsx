//////////////////////=======================================//////////////////////
//////////                        UI IMAGE GENERATOR                  /////////////
//////////   Converts background art into UI buttons images           /////////////
//////////   Fully dynamic UI                                         /////////////
//////////   Saves user input per PSD Generated                       /////////////
//////////                                                            /////////////
//////////////////////=======================================//////////////////////

#target photoshop
#include "utility/generic_functions.jsx"
#include "utility/photoshop_functions.jsx"
#include "utility/perforce_functions.jsx"
// #include "utility/uiFunctions.jsx"

// Whether or not to let the script announce the important steps using alerts
var suppress_alerts = true;

// Check for a perforce workspace root
var perforce_info = get_perforce_info();
if ( !perforce_info )
{
    if( !suppress_alerts ) { alert("No Perforce Info") }
} else {
    var root_folder = get_perforce_root(perforce_info);
}

// Find where the script is a located
script_folder = File($.fileName).path;

// If the script finds a workspace root, work from there.  Otherwise, try using a hard coded guess
    // to get started.
if ( root_folder )
{
    var global_params = {
        source_base_dir : root_folder + "/art/source",
        psd_folder : "/ui/ui_exporter",
        export_base_dir : root_folder + "/art/exported",
        script_dir : script_folder,
        base_name : "default"
    };
} else {
    var global_params = {
        source_base_dir : "D:/projects/project/art/source",
        psd_folder : "/ui/ui_exporter",
        export_base_dir : "D:/projects/project/art/exported",
        script_dir : script_folder,
        base_name : "default"
    };
    if( !suppress_alerts ) { alert( "Couldn't find perforce folder structure.  Using hardcoded paths.  Double check and make sure the paths exist in the UI!") }
}

var doc = app.activeDocument;

// Initialize variables for the config paths
var global_cfg_path = global_params.script_dir + "/config.txt";
var cfg_path = global_params.script_dir + "/config.txt";

// Remember the initial layer
var original_art_layer = doc.activeLayer;

var content_layer_name = "content_***UIIMAGEGENERATOR***";

var default_output_profiles = [
    // name, destination, [left, top, width, height]
    { name : { prefix : "event_",   suffix : ""        }, destination : "/textures/ui/banners",   coords : [ - 230, - 232, 430, 696], export_bool : true },
    { name : { prefix : "event_",   suffix : "_Button" }, destination : "/textures/ui/buttons",   coords : [ - 258, - 188, 517, 377], export_bool : true },
    { name : { prefix : "raids_",   suffix : "_Solo"   }, destination : "/textures/ui/buttons",   coords : [ - 192, - 192, 385, 385], export_bool : true },
    { name : { prefix : "bg_",      suffix : ""        }, destination : "/textures/ui/bg",        coords : [ - 325, - 216, 650, 650], export_bool : true },
    { name : { prefix : "pvp_",     suffix : ""        }, destination : "/textures/ui/buttons",   coords : [ - 265, - 192, 530, 385], export_bool : true }
];

// Initialize the per psd output profile
var output_profiles = default_output_profiles;

// Gathers up any folders the document that might already exist and remembers them
var output_folders = [];
var output_folders = find_existing_folders( doc, output_folders, content_layer_name );

// var instructions = "COMING SOON";

// Check if there's a POI Layer and if it has a POI
var poi_position = poi_check();

main();

// The main function makes sure everything is set up, then launches the gui
function main( )
{

    // Exit if there is no POI layer contents   
    if ( !poi_position ) { return; }

    // Exit if the art folders don't exist
    // if ( !Folder(global_params.source_base_dir).exists || !Folder(global_params.export_base_dir).exists ) 
    // {
    //     alert("The directory environment mentioned in the script params doesn't seem to be set up correctly.  The folders the script needs to save to do not exist.  Exiting...");
    //     return;
    // } else {
    //     if(!suppress_alerts) { alert("Save folders found!"); }
    // }

    // Get a name from the original art layer name.  This will be the base name for all of the exported images.
        // The user can change this in the script UI if they like.
    original_art_layer = get_art_layer( doc );
    global_params.base_name = original_art_layer.name;

    // Config level is keeping track of whether the psd has a config, or the app has a config, or none exists
        // for the purposes of generating alerts.
    var config_level = 2;
    if ( doc.name.substr( 0 , 11 ) == "UIImageGen_" )
    {
        cfg_path = doc.path + "/" + doc.name.split(".")[0] + ".txt";
    } else {
        config_level --;
    }

    var cfg_file_obj = new File( cfg_path );

    if ( cfg_file_obj.exists ) //&& output_folders.length > 0 )
    {
        cfg_obj = read_cfg_from_file( cfg_path );
        global_params.source_base_dir = cfg_obj.source_dir;
        global_params.export_base_dir = cfg_obj.export_dir;
        global_params.base_name = cfg_obj.base_name;
        output_profiles = cfg_obj.output_profiles;
    } else {
        config_level --;
    }

    switch( config_level )
    {
        case 2:
            if ( !suppress_alerts ) { alert( "Found configuration file!" ); }
            break;
        case 1:
            if ( !suppress_alerts ) { alert( "...using basic configuration..."); }
            break;
        case 0:
            if ( !suppress_alerts ) { alert( "...didn't find any configuration, using hard-coded config..." ); }
    }

    export_dialogue( global_params, output_profiles, default_output_profiles );
}

function poi_check()
{
    // Check if there's a POI Layer and if it has a POI
    try
    {
        var poi_layer = doc.layers.getByName( "POI" );
        // If there's nothing in the POI layer, tell the user how to make a POI.
        if ( poi_layer.bounds[0] && poi_layer.bounds[1] && poi_layer.bounds[2] && poi_layer.bounds[3] == 0 ) {
            alert( "The POI Layer is empty.  Please mark a position where you want the script to focus and restart the script." );
            return null;
        } else {
            var poi_position = find_position( poi_layer.bounds, "centre" );
            return poi_position;
        }
    } catch (e) {
        // If there's no POI layer, make one for the user.
        var poi_layer = doc.artLayers.add();
        poi_layer.name = "POI";
        alert( "The script needs a point of interest to place its masks.  It has just created a new layer called \"POI\".  Please place a dot where you want the masks.  Then, select the layer you want to export." );
        return null;
    }
}

//  get_art_layer() tries to figure out which layer is the art layer if a layer with a non-valid art layer name is selected when
    // the script is run.  It marches up and/or down from the currently selected layer, looking for a layer that isn't named
    // POI or fillLayer
function get_art_layer( doc ) //comment not accurate
{
    if ( doc.layers.getByName( "POI" ).exists && doc.layer.getByName( "fillLayer" ).exists && doc.layers.length == 2 )
    {
        alert( "It seems like you don't have any art in this file?  Or the art layer is named fillLayer or POI?" );
        return false;
    }

    var search_direction = "down";
    var current_layer = doc.activeLayer;
    var layer_parent = current_layer.parent;

    var current_index = index_of_name( layer_parent.layers, current_layer );

    if ( current_layer.name == ( "POI" || "fillLayer" ) )
    {
        while ( current_layer.name == ( "POI" || "fillLayer" ) )
        {
            if ( current_index == layer_parent.layers.length - 1 )
            {
                search_direction = "up";
            } else if ( current_index == 0 ) {
                search_direction = "down";
            }

            if ( search_direction == "up" )
            {
                current_index--;
            } else {
                current_index++;
            }

            current_layer = doc.layers[current_index];
        }

        alert( "The export layer was automatically selected.  If this is the wrong layer be sure to exit the script and select the right one and run it again.  Check the documentation for more info." );
    }

    doc.activeLayer = current_layer;
    return current_layer;
}

//  index_of_name() searches for the index of a layer or folder (obj) with a certain name in the layers array of its parent folder (array).
function index_of_name( array, obj, from_index )
{
    if ( from_index == null ) 
    {
        from_index = 0;
    } else if ( from_index < 0 ) 
    {
        from_index = Math.max(0, array.length + from_index); //in case the inputted index is negative;
    }
    for (var i = from_index; i < array.length; i++)
    {
        if ( array[i].name == obj.name ){ return i; }
    }
    return -1;
}

//  find_existing_folders() tries to find if there are existing output folders in the document based on the
    // name of its layers.  It runs recursively.  It requires a folder to check as well as an array to add to.
function find_existing_folders( set, folders_list, content_layer_name )
{
    var set_length = set.layers.length;
    
    for ( var i = 0; i < set_length; i++ )
    {
        var current_layer = set.layers[i];
        if ( current_layer.typename == "LayerSet" )
        {
            find_existing_folders( current_layer, folders_list, content_layer_name );
        } else if ( current_layer.typename == "ArtLayer" )
        {
            if ( current_layer.name == content_layer_name )
            {
                currentParent = current_layer.parent;
                if ( currentParent.typename == "LayerSet" )
                {
                    folders_list.push( currentParent );
                }
            }
        }
    }

    return folders_list;
}

//  remove_output_folders() clears all of the folders in the document that the script has created 
    // in the current session
function remove_output_folders( output_folders )
{
    if( output_folders.length > 0 )
    {
        for ( var i = output_folders.length - 1; i >= 0; i-- )
        {
            output_folders[i].remove();
            // app.refresh();
        }
        output_folders.length = 0;
    }

    try
    {
        doc.artLayers.getByName( "fillLayer" ).remove();
    } catch (e) { }

    return;
}

////////////////PHOTOSHOP STUFF N' JUNK////////////////
// create_output_folders() creates a folder for each output_profile and puts a copy of the the art layer in it. 
    // It calls make_selection(), make_layer_mask(), and getRelevantMask() files to populate the folders
    // with the proper overlays for every output_profile.
function create_output_folders( output_profiles, artLayer )
{
    var output_profiles_length = output_profiles.length;

    for( var i = 0; i < output_profiles_length; i++ )
    {

        var output_profile = output_profiles[i];

        var new_folder = doc.layerSets.add();
        var new_folder_name = output_profiles[i].name.prefix + global_params.base_name +  output_profiles[i].name.suffix;
            new_folder.name = new_folder_name;
            output_folders.push( new_folder );
        
        doc.activeLayer = new_folder;

        var selX = parseInt( Math.floor( eval ( poi_position[0] + output_profile.coords[0] ) ) );
        var selY = parseInt( Math.floor( eval ( poi_position[1] + output_profile.coords[1] ) ) );
        var selW = parseInt( Math.floor( output_profile.coords[2] ) );
        var selH = parseInt( Math.floor( output_profile.coords[3] ) );
        make_selection( selX, selY, selW, selH );

        make_layer_mask( 'RvlS' );
        // unlink_layer_mask(); //probably don't need?

        var content_layer = artLayer.duplicate( new_folder, ElementPlacement.PLACEATEND );
        content_layer.name = content_layer_name;
        // artLayer.visible = false;
    
        get_relevant_masks( output_profile, new_folder );
        if ( i < output_profiles_length -1 ) 
        {
            new_folder.visible = false;
        }
        // app.refresh();
    }

    doc.activeLayer = artLayer;
}

// get relevant masks scoops up external files and adds them to output_profile folders based on prefix.
    // it calls the functions create_mask_in_folder() and alignLayerToOutput()
function get_relevant_masks( output_profile, folder )
{
    if( ( output_profile.name.prefix == "event_" ) && ( output_profile.destination == "/textures/ui/banners" ) )
    {
        // mask image
        var mask = create_mask_in_folder( folder, "masks", "gradientMask", "masks/event_banner_mask.png" );
        align_layer_to_output_profile_position( mask.layer, output_profile, "leftBottom" );

        //overlay image
        var overlay = create_mask_in_folder( folder, "overlays", "UIOverlay", "overlays/event_banner_overlay.png" );
        align_layer_to_output_profile_position( overlay.layer, output_profile, "leftTop" );
        overlay.folder.visible = false;

    } else if( ( output_profile.name.prefix == "event_" ) && ( output_profile.destination == "/textures/ui/buttons" ) ) {
        //overlay image
        var overlay = create_mask_in_folder( folder, "overlays", "UIOverlay", "overlays/button_events_overlay.png" );
        align_layer_to_output_profile_position( overlay.layer, output_profile, "leftTop" );
        overlay.folder.visible = false;

    } else if( output_profile.name.prefix == "raids_" ) {
        //overlay image
        var overlay = create_mask_in_folder( folder, "overlays", "UIOverlay", "overlays/button_solo_overlay.png" );
        align_layer_to_output_profile_position( overlay.layer, output_profile, "leftBottom" );
        overlay.folder.visible = false;
    }

    // } else if( output_profile.name.prefix == "bg_" ) {
    //     //apply layer mask
    //     var mask = create_mask_in_folder( output_profile.name, "masks", "layerMask", "Events_bg_layerMask.png" );
    //     align_layer_to_output_profile_position( mask.layer, output_profile, "leftBottom" );
    //     app.activeLayer = mask.layer;
    //     select_transparency();
    //     mask.layer.remove();
    //     mask.folder.remove();
    //     app.activeLayer = doc.layerSets.getByName( output_profile.name ).layers.getByName( "content" );
    //     make_layer_mask();

    // } else if( output_profile.name.prefix == "pvp_" ) {
    //     // apply layer mask
    //     var mask = create_mask_in_folder( output_profile.name, "masks", "layerMask", "Inbox_Banner_CutUps_layerMask.png" );
    //     align_layer_to_output_profile_position( mask.layer, output_profile, "rightTop" );
    //     app.activeLayer = mask.layer;
    //     select_transparency();
    //     mask.layer.remove();
    //     mask.folder.remove();
    //     app.activeLayer = doc.layerSets.getByName( output_profile.name ).layers.getByName( "content" );
    //     make_layer_mask();
    // }
}

// copy_mask_file_obj_to_folder() picks up an external PNG and copies the contents to a specified folder in
    // the current document.  It is called by create_mask_in_folder().  It returns the layer it created.
function copy_mask_file_obj_to_folder( global_params, file_name, destination_folder )
{
    var mask_file_obj = new File( global_params.script_dir + "/" + file_name );
    var temp_doc = app.open( mask_file_obj );
    var mask_layer = temp_doc.layers[0].duplicate( destination_folder, ElementPlacement.PLACEATBEGINNING );
    temp_doc.close();

    return mask_layer;
}

// create_mask_in_folder() calls copy_mask_file_obj_to_folder() to put a mask in a folder that it creates.
    // it creates a new folder in an existing folder and and puts a new layer in it.
    // it returns an object that contains a reference to the layer and folder it created.
function create_mask_in_folder( parentFolder, folderName, newLayerName, baseImageName )
{
    var folder = parentFolder.layerSets.add();
    folder.name = folderName;

    var layer = copy_mask_file_obj_to_folder( global_params, baseImageName, folder );
    layer.name = newLayerName;

    return { layer : layer, folder : folder };
}

// output_profiles_coords_to_bounds() does the same thing as mask_coords_to_bounds but includes
    // the poi_position and adds it to the coords.  Probably redundant.
function output_profiles_coords_to_bounds( coords )
{
    var left_top_bound = [ poi_position[0] + coords[0], poi_position[1] + coords[1] ];
    var right_bottom_bound = [ left_top_bound[0] + coords[2], left_top_bound[1] + coords[3] ];

    var bounds = left_top_bound.concat( right_bottom_bound );

    return bounds;
}

// align_layer_to_output_profile_position() aligns a corner or the centres of a layer to an output_profile layer
    // returns the layer.
function align_layer_to_output_profile_position( layer, output_profile, position )
{
    var layerPostion = find_position( layer.bounds, position );
    var output_profile_position = find_position( output_profiles_coords_to_bounds( output_profile.coords ), position );
    var deltaPosition = find_delta_position( layerPostion, output_profile_position );
    layer.translate( deltaPosition[0], deltaPosition[1] );
    
    return layer;
}

function turn_off_overlays( folder )
{
    var folder_length = folder.layers.length;
    for ( var i = 0; i < folder_length; i++ )
    {
        var layer = folder.layers[i] 
        if ( layer.name == "overlays" )
        {
            layer.visible = false;
        }
    }
}

// export_folders() this exports each of the outputType layers as pngs.
    // should use the folder list and not the outputType list?
    // MOVE TO UI GENERATOR SCRIPT
function export_folders( global_params, output_profiles, export_base_dir )
{
    var output_profiles_length = output_profiles.length;
    for ( var i = 0; i < output_profiles_length; i++ )
    {
        var current_output_profile = output_profiles[i];

        if ( current_output_profile.export_bool == true )
        {
            var new_doc = doc.duplicate();
            app.activeDocument = new_doc;
            var new_doc_length = new_doc.layers.length;
            var output_name = current_output_profile.name.prefix + global_params.base_name + current_output_profile.name.suffix;
            var output_bounds = output_profiles_coords_to_bounds( current_output_profile.coords );
            var output_dir = export_base_dir + current_output_profile.destination;
            for( var j = new_doc_length - 1; j >= 0; j-- )
            {
                current_layer = new_doc.layers[j];
                if ( current_layer.name == output_name )
                {
                    current_layer.visible = true;
                    new_doc.activeLayer = current_layer;
                    turn_off_overlays(current_layer);
                    if(user_mask())disenable_mask(user_mask_enabled());
                    // app.refresh();
                } else {
                    current_layer.remove();
                }
                // app.refresh();
            }

            new_doc.flatten();
            new_doc.crop( output_bounds );
            var spot_dimensions = find_nearest_power_of_two( Math.max( new_doc.width, new_doc.height ), "up" );
            new_doc.resizeImage( spot_dimensions, spot_dimensions, 72, ResampleMethod.BICUBICSHARPER );

            make_folder( output_dir );
            save_png( output_name, output_dir, new_doc );
            app.activeDocument = doc;
            new_doc.close( SaveOptions.DONOTSAVECHANGES );
        }
    }
}

/////////////////////UI STUFF N'JUNK/////////////////////
//  export_dialogue() is the main ui panel and explicitly produces all non procedural ui elements
function export_dialogue( global_params, output_profiles, default_output_profiles )
{
    var currentMessage = message_of_the_day();
    //create a new Window.
    var w = new Window("dialog", "", undefined, {resizeable: true} );
        // w.preferredSize = [300, 130];
        w.alignChildren = "center";
        // w.alignChildren = ["fill", "fill"];
        w.text = "Let's output some UI images!";
        w.margins = 15; 

        // add the message of the day UI element.
        var messageGroup = w.add( "group" );
            messageGroup.orientation = "column";
            // messageGroup.alignment = "fill";
            messageGroup.alignChildren = "centre";

            //make the title and the contents box
            messageGroup.add( "statictext", undefined, currentMessage.message );  
            messageGroup.add( "statictext", undefined, currentMessage.author );
            
    //add a panel for the path input text boxes
    var text_panel = w.add( "panel" );
        text_panel.alignment = "fill";
        text_panel.text = "These are your global_params...";
        text_panel.layout.layout(true);

        //make a group for the source text box and its title
        var text_boxWidth = 55;
        var sourceGroup = text_panel.add( "group" );
            sourceGroup.orientation = "row";
            sourceGroup.alignment = "left";
            sourceGroup.alignChildren = "left";
            sourceGroup.add( "statictext", undefined, "Source Path: " );
            //make the title and the text box
            var source_dir_text_box = sourceGroup.add("edittext", undefined, global_params.source_base_dir);  
                source_dir_text_box.characters = text_boxWidth;

        //make a group for the export text box and its title
        var export_group = text_panel.add( "group" );
            export_group.orientation = "row";
            export_group.alignment = "left";
            export_group.alignChildren = "left";

            //make the title and the text box
            export_group.add( "statictext", undefined, "Export Path: ");  
            var export_dir_text_box = export_group.add("edittext", undefined, global_params.export_base_dir);  
                export_dir_text_box.characters = text_boxWidth;

        //make a group for the base_name text box and its title
        var base_name_group = text_panel.add( "group" );
            base_name_group.orientation = "row";
            base_name_group.alignment = "fill";
            base_name_group.alignChildren = "center";

            var base_name_sub_group = base_name_group.add( "group" )
                base_name_sub_group.orientation = "row";
                base_name_sub_group.alignment = "left";
                base_name_sub_group.alignChildren = "left";

                //make the title and the text box
                base_name_sub_group.add( "statictext", undefined, "Base Name:  ");  
                var base_name_text_box = base_name_sub_group.add("edittext", undefined, global_params.base_name );  
                    base_name_text_box.characters = 15;
                //this is the button to apply the base name to the names dialogue
                var apply_button = base_name_sub_group.add ("button", undefined, "Apply");  
                    apply_button.onClick = function()
                    {
                        update_output_profiles( output_profiles, global_params, source_dir_text_box, export_dir_text_box, base_name_text_box, parent_group );
                        refresh_parent_group_contents( output_profiles );
                        write_cfg_to_file( global_params, output_profiles, global_cfg_path );
                        w.layout.layout(true);
                    }
                var reset_button = base_name_sub_group.add ("button", undefined, "Reset");  
                    reset_button.onClick = function()
                    {
                        refresh_parent_group_contents( default_output_profiles );
                        update_output_profiles( output_profiles, global_params, source_dir_text_box, export_dir_text_box, base_name_text_box, parent_group );
                        write_cfg_to_file( global_params, output_profiles );
                        w.layout.layout(true);
                    }

            // var instructionsSubGroup = base_name_group.add( "panel" );
            //     instructionsSubGroup.orientation = "row";
            //     instructionsSubGroup.alignment = "right";
            //     instructionsSubGroup.alignChildren = "right";

                // var instructionsButton = instructionsSubGroup.add( "button", undefined, "INSTRUCTIONS" );
                //         instructionsButton.onClick = function()
                //         {
                //             alert( instructions );
                //         }


    //the buttons panel is a panel for the output_profiles interface
    var checkbox_panel = w.add ("panel");
        checkbox_panel.text = "...Let's do some exporting" 
        checkbox_panel.orientation = "column";
        checkbox_panel.alignment = "center";
        checkbox_panel.alignChildren = "left";
        checkbox_panel.margins = 20; 
        checkbox_panel.add( "statictext", undefined,  "Here are your images to export: " );
        checkbox_panel.layout.layout( true );

        // this group contains the procedural output_profiles UI.  It's purpose is to keep it separate from
        // the [ + ] button.
        var parent_group = checkbox_panel.add( "group" );
            parent_group.orientation = "column";
            parent_group.alignment = "left";
            parent_group.alignChildren = "left";

        // this function updates the parent_group by first emptying it then filling it using the latest 
        // information in output_profiles
        function refresh_parent_group_contents( output_profiles )
        {
            if ( parent_group.children.length > 0 )
            {
                var children = parent_group.children.length;
                for( var i = children -1; i >= 0; i-- )
                {
                    parent_group.remove( parent_group.children[i] );
                }
            }

            for ( var j = 0; j < output_profiles.length; j++ )
            {
                add_output_profiles_ui(  output_profiles[j], parent_group );
            }
        }

        refresh_parent_group_contents( output_profiles );

        //the buttons panel is a panel for the output_profiles interface
        var plus_minus_group = checkbox_panel.add( "group" );
            plus_minus_group.orientation = "row";
            plus_minus_group.alignment = "left";
            plus_minus_group.alignChildren = "left";

            // the button that adds another blank output_profile, and it's function
            var add_output_profile_button = plus_minus_group.add( "button", undefined, "+" );
                add_output_profile_button.onClick = function()
                {
                    update_output_profiles( output_profiles, global_params, source_dir_text_box, export_dir_text_box, base_name_text_box, parent_group );
                    var new_output_profile = { name : { prefix : "event_", suffix : "" }, destination : "/textures/ui/banners", coords : [ - 230, - 232, 430, 696], export_bool : false }
                    output_profiles.push( new_output_profile );
                    refresh_parent_group_contents( output_profiles );
                    w.layout.layout(true);
                }

            var remove_output_profile_button = plus_minus_group.add( "button", undefined, "-" );
                remove_output_profile_button.onClick = function()
                {
                    update_output_profiles( output_profiles, global_params, source_dir_text_box, export_dir_text_box, base_name_text_box, parent_group );
                    output_profiles.pop();
                    refresh_parent_group_contents( output_profiles );
                    w.layout.layout(true);
                }

    //create the Export/Cancel bar.
    var bottom_buttons_group = w.add ("group");
        bottom_buttons_group.orientation = "row";
        bottom_buttons_group.alignment = "right";
        // the generate button and its funtion
        var generateButton = bottom_buttons_group.add ("button", undefined, "Generate");
            generateButton.onClick = function()
            {
                var save_doc = save_psd( "UIImageGen_" + global_params.base_name, global_params.source_base_dir + "/" + global_params.psd_folder, doc );

                if ( doc.name != save_doc.name )
                {
                    doc = app.open( save_doc );
                    original_art_layer = doc.activeLayer;
                }
                update_output_profiles( output_profiles, global_params, source_dir_text_box, export_dir_text_box, base_name_text_box, parent_group );
                remove_output_folders( output_folders );
                make_fill_layer( doc );
                create_output_folders( output_profiles, original_art_layer );
                write_cfg_to_file( global_params, output_profiles, cfg_path );
                write_cfg_to_file( global_params, output_profiles, global_cfg_path );
                alert( "Generation Complete." );
            }
        // the export button and its function
        var  export_button = bottom_buttons_group.add ("button", undefined, "Export");  
            export_button.onClick = function()
            {
                update_output_profiles( output_profiles, global_params, source_dir_text_box, export_dir_text_box, base_name_text_box, parent_group );
                export_folders( global_params, output_profiles, global_params.export_base_dir );
                var save_doc = save_psd( "UIImageGen_" + global_params.base_name, global_params.source_base_dir + "/" + global_params.psd_folder, doc );
                write_cfg_to_file( global_params, output_profiles, cfg_path );
                write_cfg_to_file( global_params, output_profiles, global_cfg_path );
                if ( doc.name != save_doc.name )
                {
                    doc = app.open( save_doc );
                }

                alert("Export Completed Successfully!");
                w.hide();
            }
        // the clear button and its function
        var clearButton = bottom_buttons_group.add ("button", undefined, "Clear Folders");
            clearButton.onClick = function()
            {
                if ( output_folders.length == 0 )
                {
                    alert( "I didn't find any existing output folders.  If there are folders there, you're going to have to cancel the script and delete them manually." );
                }

                remove_output_folders( output_folders );
            }
        // the cancel button and its function
        var cancelButton = bottom_buttons_group.add ("button", undefined, "Exit");
            cancelButton.onClick = function() 
            { 
                w.hide();
            }

    w.onResizing = function () { this.layout.resize(); }   
    w.onShow = function () 
    { 
        w.layout.resize(); 
    }   
    w.center();
    w.show();
}

//  message_of_the_day() is responsible for choosing one of those quotes about automation
function message_of_the_day()
{
    var windowMessages = [
        { message : "\"There's a lot of automation that can happen that isn't a replacement of humans but of mind-numbing behavior.\"", author : "- Stewart Butterfield" },
        { message : "\"Automation is good, so long as you know exactly where to put the machine.\"", author : "- Eliyahu Goldratt" },
        { message : "\"Besides black art, there is only automation and mechanization.\"", author : "- Federico Garcia Lorca" },
        { message : "\"I couldn't tell you in any detail how my computer works. I use it with a layer of automation.\"", author : "- Conrad Wolfram" },
        { message : "\"The human being is a very poorly designed machine tool. The human being excels in coordination.\"", author : "- Petter F. Drucker" },
        { message : "\"Automation is cost cutting by tightening the corners and not cutting them.\"", author : "- Haresh Sippy" },
        { message : "\"If you automate a process that has errors, all you've done is automate the generation of those errors.\"", author : "- W.L.W. Borowiecki" }
    ];

    var maximum = windowMessages.length;
    var message = Math.floor( generate_random_number( 0, maximum ) );

    return windowMessages[ message ];
}

//  add_output_profiles_ui() builds a ui object hierarchy for each desired output image.  //
    // THE HIERARCHY ///////////////////////////////////////////////////////////////////////
    // contains all of the text fields and check boxes for the various building           //
    // blocks of the output image (names, dimensions, etc ).                              //
    //                                                                                    //
    // INPUTS //////////////////////////////////////////////////////////////////////////////
    // output_profile - the properties of an image to output                              //
    // parent_group - the scriptUI group each entry will be a child of.                   //
    //                                                                                    //
    ////////////////////////////////////////////////////////////////////////////////////////
    // add_output_profiles_ui() creates a UI entry for each output_profile.  The UI entry //
    // is a panel with several UI elements in a hierarchy that are the building           //
    // blocks of an output image ( names, dimensions, etc ).                              //
    // The hierarchy for each default entry is below.  It is required to access           //
    // the procedurally generated buttons as in update_output_profiles() because they     //
    // are accessed as indices in arrays of child objects.                                //
    //                                                                                    //
    ////////////////////////////////////////////////////////////////////////////////////////
    //                                    PARENT GROUP                                    //
    // +--------------------------------------------------------------------------------+ //
    // |                                PARENT SUB PANEL [i]                            | //
    // | +----------------------------------------------------------------------------+ | //
    // | |                               TOP ROW GROUP [0]                            | | //
    // | | .name_sub_group.prefix_text_box                              [0] [0]       | | //
    // | | .name_sub_group.base_name_static_text                        [0] [1]       | | //
    // | | .name_sub_group.suffix_text_box                              [0] [2]       | | //
    // | |                                                                            | | //
    // | | .destination_sub_group.destination_static_text               [1] [0]       | | //
    // | | .destination_sub_group.destination_text_box                  [1] [1]       | | //
    // | |                                                                            | | //
    // | +----------------------------------------------------------------------------+ | //
    // | +----------------------------------------------------------------------------+ | //
    // | |                              BOTTOM ROW GROUP [1]                          + | //
    // | | .coords_group.offset_group.x_offset_static               [0] [0] [0]       | | //
    // | | .coords_group.offset_group.x_offset_text_box             [0] [0] [1]       | | //
    // | | .coords_group.offset_group.y_offset_static               [0] [0] [2]       | | //
    // | | .coords_group.offset_group.y_offset_text_box             [0] [0] [3]       | | //
    // | |                                                                            | | //
    // | | .coords_group.dimensions_group.x_dimension_static        [0] [1] [0]       | | //
    // | | .coords_group.dimensions_group.x_dimension_text_box      [0] [1] [1]       | | //
    // | | .coords_group.dimensions_group.y_dimension_static        [0] [1] [2]       | | //
    // | | .coords_group.dimensions_group.y_dimension_text_box      [0] [1] [3]       | | //
    // | |                                                                            | | //
    // | | .checkbox_group.checkbox_text                            [1] [0]           | | //
    // | | .checkbox_group.current_checkbox                         [1] [1]           | | //
    // | |                                                                            + | //
    // | +----------------------------------------------------------------------------+ | //
    // +--------------------------------------------------------------------------------+ //
    ////////////////////////////////////////////////////////////////////////////////////////
function add_output_profiles_ui( output_profile, parent_group )
{
    var parent_sub_panel = parent_group.add( "panel" );
        parent_sub_panel.orientation = "column";
        parent_sub_panel.alignment = "left";
        parent_sub_panel.alignChildren = "left";

            var top_row_group = parent_sub_panel.add( "group" );
                top_row_group.orientation = "row";
                top_row_group.alignment = "left";
                top_row_group.alignChildren = "left";

                var name_sub_group = top_row_group.add( "panel" );
                    name_sub_group.text = "Name ( [prefix] + Base Name + [suffix] )";
                    name_sub_group.orientation = "row";

                    var prefix_text_box = name_sub_group.add("edittext", undefined, output_profile.name.prefix);
                        prefix_text_box.characters = 10;
                    var base_name_static_text = name_sub_group.add( "statictext", undefined,  global_params.base_name );
                    var suffix_text_box = name_sub_group.add("edittext", undefined, output_profile.name.suffix);
                        suffix_text_box.characters = 10;

                var destination_sub_group = top_row_group.add( "panel" );
                    destination_sub_group.orientation = "row";
                    destination_sub_group.alignment = "bottom";
                    destination_sub_group.alignChildren = "left";

                    var destination_static_text = destination_sub_group.add( "statictext", undefined,  "Destination: " );
                    var destination_text_box = destination_sub_group.add("edittext", undefined, output_profile.destination);
                            destination_text_box.characters = 20;
            
        var bottom_row_group = parent_sub_panel.add( "group" );
                bottom_row_group.orientation = "row";
                bottom_row_group.alignment = "left";
                bottom_row_group.alignChildren = "left";

            var coords_group = bottom_row_group.add( "panel" );
                coords_group.orientation = "row";
                coords_group.alignment = "left";
                coords_group.alignChildren = "left";

                var offset_group = coords_group.add( "group" );
                    offset_group.orientation = "row";
                    offset_group.alignment = "center";
                    offset_group.alignChildren = "right";

                    offset_group.add( "statictext", undefined,  "X Offset: " );
                    var x_offset_text_box = offset_group.add("edittext", undefined, output_profile.coords[0]);
                        x_offset_text_box.characters = 5;
                    offset_group.add( "statictext", undefined,  "Y Offset: " );
                    var y_offset_text_box = offset_group.add("edittext", undefined, output_profile.coords[1]);
                        y_offset_text_box.characters = 5;
                
                var dimensions_group = coords_group.add( "group" );
                    dimensions_group.orientation = "row";
                    dimensions_group.alignment = "center";
                    dimensions_group.alignChildren = "right";

                    dimensions_group.add( "statictext", undefined,  "Width: " );
                    var x_dimension_text_box = dimensions_group.add("edittext", undefined, output_profile.coords[2]);
                        x_dimension_text_box.characters = 5;            
                    dimensions_group.add( "statictext", undefined,  "Height: " );
                    var y_dimension_text_box = dimensions_group.add("edittext", undefined, output_profile.coords[3]);
                        y_dimension_text_box.characters = 5;

                var checkbox_group = bottom_row_group.add( "panel" );
                    checkbox_group.orientation = "row";
                    checkbox_group.alignment = "right";
                    checkbox_group.alignChildren = "left";

                        checkbox_group.add( "statictext", undefined,  "Export: " );
                        var current_checkbox = checkbox_group.add( "checkbox", undefined, "" );
                            current_checkbox.value = output_profile.export_bool;  
}

//  updateoutput_profiles() grabs the info the user has entered into the ui and stores it back in the 
    // output_profiles variable.
function update_output_profiles( output_profiles, global_params, source_dir_text_box, export_dir_text_box, base_name_text_box, parent_group )
{
    global_params.source_base_dir = source_dir_text_box.text;
    global_params.export_base_dir = export_dir_text_box.text;
    global_params.base_name = base_name_text_box.text;
    cfg_path = global_params.source_base_dir + global_params.psd_folder + "/" + "UIImageGen_" + global_params.base_name + ".txt";

    var iterations = output_profiles.length;
    for( var i = 0; i < iterations; i++ )
    {
        var new_name = { prefix : "",    base_name :  "", suffix : "" };
           
                                  // parent_group.parent_sub_panel.top_row_group.name_sub_group.prefix_text_box
             new_name.prefix =       parent_group.children[i].children[0].children[0].children[0].text;
                                  // parent_group.parent_sub_panel.top_row_group.name_sub_group.nameText
           new_name.base_name =      global_params.base_name;
                                  // parent_group.parent_sub_panel.top_row_group.name_sub_group.suffix_text_box
             new_name.suffix =       parent_group.children[i].children[0].children[0].children[2].text;

        output_profiles[i].name =        new_name;
                                  // parent_group.parent_sub_panel.top_row_group.destination_sub_group.destination_text_box
        output_profiles[i].destination = parent_group.children[i].children[0].children[1].children[1].text;
                                  // parent_group.parent_sub_panel.bottom_row_group.coords_group.dimensions_group.x_offset_text_box
        output_profiles[i].coords[0] =   parseInt( Math.floor( parent_group.children[i].children[1].children[0].children[0].children[1].text ) );
                                  // parent_group.parent_sub_panel.bottom_row_group.coords_group.dimensions_group.y_offset_text_box
        output_profiles[i].coords[1] =   parseInt( Math.floor( parent_group.children[i].children[1].children[0].children[0].children[3].text ) );
                                  // parent_group.parent_sub_panel.bottom_row_group.coords_group.offset_group.x_dimension_text_box
        output_profiles[i].coords[2] =   parseInt( Math.floor( parent_group.children[i].children[1].children[0].children[1].children[1].text ) );
                                  // parent_group.parent_sub_panel.bottom_row_group.coords_group.offset_group.y_dimension_text_box
        output_profiles[i].coords[3] =   parseInt( Math.floor( parent_group.children[i].children[1].children[0].children[1].children[3].text ) );
                                  // parent_group.parent_sub_panel.bottom_row_group.checkbox_group.current_checkbox
        output_profiles[i].export_bool = parent_group.children[i].children[1].children[1].children[1].value;
    }

    return output_profiles;
}

///////////////CONFIG FILE STUFF N'JUNK//////////////////
function read_cfg_from_file( cfg_path )
{
    var raw_text = read_file( cfg_path );
    var new_output_profiles = [];

    var text_array = raw_text.split("\n");
    for ( var i = 0; i < text_array.length; i++ )
    {
        current_line = text_array[i];
        if ( current_line.indexOf( "source_base_dir:" ) != -1 )
        {
            var source_dir = current_line.split( ": " )[1];

        } else if ( current_line.indexOf( "export_base_dir:" ) != -1 ) {
            var export_dir = current_line.split( ": " )[1];

        } else if ( current_line.indexOf( "base_name:" ) != -1 ) {
            var base_name = current_line.split( ": " )[1];

        } else if ( current_line.indexOf( "output" ) != -1 ) {
            var current_output = construct_output( current_line.split( ": " )[1] );
            new_output_profiles.push( current_output );
        }
    }

    var cfg_obj = { source_dir : source_dir, export_dir : export_dir, base_name: base_name, output_profiles : new_output_profiles };

    return cfg_obj;
}

function construct_output( output_string )
{
    output_array = output_string.split( "," );
    var new_output = {};
        new_output.name = {};
        new_output.name.prefix = output_array[0];
        new_output.name.suffix = output_array[1];
        new_output.destination = output_array[2];
        new_output.coords = [];
        new_output.coords[0] = output_array[3];
        new_output.coords[1] = output_array[4];
        new_output.coords[2] = output_array[5];
        new_output.coords[3] = output_array[6];
        new_output.export_bool = output_array[7];

    return new_output;
}

function write_cfg_to_file( global_params, output_profiles, path )
{
    var header = "//////UI Image Generator Prefs//////\n\n";
    var text = prefs_to_string( global_params, output_profiles );
    text = header + text;

    text = add_date_time( text );

    write_to_file( text, path );
}

function prefs_to_string( global_params, output_profiles )
{
    var output_profiles_length = output_profiles.length;
    // var str = "//////UI Image Generator Prefs//////\n\n";
    str = "source_base_dir: " + global_params.source_base_dir + "\n" + "export_base_dir: " + global_params.export_base_dir + "\n" + "base_name: " + global_params.base_name + "\n\n";
    for ( var i = 0; i < output_profiles_length; i++ )
    {
        var opt = output_profiles[i]
        var opt_name = opt.name.prefix + "," + opt.name.suffix;
        var opt_dest = ( opt.destination );
        var opt_coords = opt.coords[ 0 ] + "," + opt.coords[ 1 ] + "," + opt.coords[2] + "," + opt.coords[3];
        var opt_bool = opt.export_bool;
        str += "output" + (i + 1).toString() + ": " + opt_name + "," + opt_dest + "," + opt_coords + "," + opt_bool + "\n";
    }

    return str;
}

function add_date_time( text )
{
    var dated_string = text + "\n" + "Last run on: " + get_date_and_time();

    return dated_string;
}