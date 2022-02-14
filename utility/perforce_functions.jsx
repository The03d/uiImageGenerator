#target photoshop

var script_dir = "D:/Projects/Survivors/ArtResources/Photoshop/Scripts/HH_characterUIImageGenerator";

// passes arrays through, converts strings into lists of lines, and complains about other types.
function format_contents( contents )
{
    type_error = new Error( "write_file_contents accepts only strings and arrays." );
    switch( typeof(contents) ) 
    {
        case "string":
            contents = string_to_array_of_lines(contents)
            break;
        case "object":
            if (contents.constructor === Array)
            {
                break
            } else {
                throw type_error;
                return false;
            }
            break;
        default:
            throw type_error;
            return false;
    } 

    return contents;
}

// writes a list of lines into a file
function write_file_contents( file, contents )
{     
    for ( index in contents )
    {
        file.writeln( contents[index] );
    }
}

// executes bat commands in a folder in the form of a list of lines
function exec_bat_commands( commands, folder )
{
    commands = format_contents( commands );
    if ( commands )
    {
        var bat = new File( folder + "/temp_bat.bat" );
        bat.open( "w" );
        write_file_contents(bat, commands);
        bat.close();
        app.system( bat.fsName );
        bat.remove();
    }
}

// extracts the contents of a file, the deletes it
function read_and_delete_file( file )
{
    if ( file.open( "r" ) )
    {
        file_contents = file.read();
        file.close();
        file.remove();
        return file_contents;
    }
    return false;
}

// it'll run system commands in a dos window and get the results via text file
function run_system_command_with_output( command, folder )
{
    var cmd_output = "";
    var temp_file = new File( folder + "/temp.txt" );
    app.system( command + " > " + temp_file.fsName );

    cmd_output = read_and_delete_file(temp_file)
    return cmd_output;
}

// runs a perforce info command using a batch file using hax
function get_perforce_info()
{
    var results_filename = "results.txt";
    var results_filepath = script_dir + "/" + results_filename;
    var bat_commands = ["pushd %~dp0", "p4 info > " + results_filepath];
    exec_bat_commands( bat_commands, script_dir );
    var results_file = new File( results_filepath );
    var results = read_and_delete_file( results_file );

    return results;
}

function get_perforce_root( perforce_info )
{
    perforce_list = perforce_info.split("\n");
    for ( index in perforce_list )
    {
        item = perforce_list[index]
        if ( item.indexOf("Client root") !== -1 )
        {
            perforce_root = ( item.split( ":" )[1] + ":" + item.split( ":" )[2] ).replace(/ /g,"").replace(/\\/g,"/");
            return perforce_root;
        }
    }

    alert( "Perforce root could not be found" );
    return false;
}
