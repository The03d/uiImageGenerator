// find_nearest_power_of_two() finds the nearest power of two to the input number.  User can specific if it's
    // the next highest or lowest POT.  Is called by export_folders() 
function find_nearest_power_of_two( number, direction )
{
    if ( direction == undefined ) { direction = "up" }
    if ( direction !== ( "up" || "down" ) ) { alert( "Directions are only \"up\" or \"down\".  You can leave it blank, too." ) }

    if ( direction = "up") 
    {
        if ( is_power_of_two( number ) ) { number += 1; }
    } else if ( direction == "down" ) {
        if ( number == 2 ) { return 1; }
        if ( number < 2 ) { return false; }
        if ( is_power_of_two( number ) ) { number -= 1; } 
    }
    return Math.pow( 2, Math.floor( Math.log( number ) / Math.log( 2 ) ) );
}

// generate_random_number() returns a random number between min and max, not including max.
    // is called by messageOfTheDay()
function generate_random_number(min , max) 
{
    return Math.random() * (max-min) + min;
}

// find_average() returns the average of all numbers in an array.
function find_average( array_of_numbers )
{
    var current_sum = 0;
    var array_length = array_of_numbers.length;

    for ( var i = 0; i < array_length; i++ )
    {
        current_sum = current_sum + parseFloat( array_of_numbers[i] );
    }

    return current_sum / array_length;
}

function string_to_array_of_lines( string )
{
    return string.split(/\r?\n/);
}

function get_date_and_time()
{
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date+' '+time;

    return dateTime;
}

function make_file( file_path )
{
    file_obj = new File( file_path );
    if ( !file_obj.exists )
    {
        file_obj.create();
    }
}

function make_folder( path )
{
    var folder_obj = Folder( path );

    if ( !folder_obj.exists )
    {
        folder_obj.create();
    }
}

function write_to_file( text, text_file_path )
{
    // var text_file_path = scriptDir + "/test.txt";
    var file_obj = new File( text_file_path );

    file_obj.open( "w" ); // open file with write access
    // file_obj.writeln("//////UI Image Generator Prefs//////\n");
    file_obj.write( text );
    file_obj.close();
}

function read_file( text_file_path )
{
    var file_obj = new File(text_file_path);

    file_obj.open("r"); // open file with read access
    var str = "";
    while ( !file_obj.eof ) 
    {
        // read each line of text
        str += file_obj.readln() + "\n";
    }

    file_obj.close();

    return str;
}

// is_power_of_two() checks to see if number is a power of two.  Returns true or false
    // is called by find_nearest_power_of_two()
function is_power_of_two( number )
{
    return ( Math.log( number ) / Math.log( 2 ) ) % 1 === 0;
}