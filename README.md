# **UI Image Generator**
This script takes a master image and cuts it up into smaller subsections based on user defined profiles.  It allows the artist to edit the subimages in any way they wish, and then export them.  The script will remember any changes made to the image export profiles per master image.  It is an extendscript designed to be used in photoshop.

## **Starting The Script**
Start the script any way you do in Photoshop.  It can be run view the `file\scripts` menu flow, by running it in Adobe Extendscript, or by creating an action to run it and using the action palette.

Because running scripts with Script UI freezes photoshop, it's necessary to close the script when changes to the Photoshop document are necessary.  The first running will typically do some validation and set up.  The second will produce the profiles GUI, and the user can generate images based on the exporter profiles.  The third would allow the user to export any or all required images with any changes included.
### **First Time Running**
When starting the script for the first time on a new image, it will attempt to locate `POI` layer.  If none is found, it will create one.  It will then ask the user to make a mark where the center of the composition of the derivative images should be and exit.
### **Second Time Running**
Once the user has established a `POI` and has run the script again, the UI will construct its GUI.

On start up, the script will attempt to locate a Perforce workspace to establish a folder relative to the export paths in its profiles.  If it cannot locate itself in a Perforce workspace, it will use a hard coded path.  The user can make changes to the root path in the script UI, and those changes will be saved in the profile associated with the master image when the export features are run.  Clicking generate will create a Photoshop group for each profile in the tool.  It will make a mask based on the exported image size.  The composition of the mask it creates is based on the position of the `POI` in the `POI` layer.  It will then scoop up any pre-specified visual aids as overlays so the user can get the correct composition with any UI elements that may exist on the final screen.

The user would then exit the script and check the composition of each layer using the profile overlays.  The user can add layers, paint overs, apply filters, or whatever is necessary.
### **Third Time Running**
The user can select which layers to export as images, review the export locations, and run the exporter.  Each selected image will be exported along with any edits to the specified export location.  Folders containing composition helping overlays will be automatically turned off.  Destination folders will automatically be created if they don't already exist, and the output images will be scaled up to the nearest SPOT dimensions.
## **The UI**
### **Global Params**
At the top od the UI there are the `global params`.  The first two paths are assumed to already exist.  The paths are to the base folder for source art and exported art, ostensibly in some kind of file versioning workspace.

Under the paths is a `base name`.  This is the base name of the textures that will be generated ie. `prefix_basename_suffix.png`.  The script takes a crack at guessing what the name should be by the name of the art layer.  Changing the base name and hitting `apply` will update the export name and the current config.  Hitting `reset` will reset the below export profiles to whatever is in the current config, so any changes in those profiles in the ui will be lost.

### **Export Profiles**
Below that is a box of export profiles.  Each profile has text boxes for a file name `prefix`, `suffix`, and export `destination`, `offsets` relative to the `POI` position, target ui element `dimensions`, and an `export` check box.  Profiles can be added and removed using the `[+]` and `[-]` buttons below.

### **Script Functions Buttons**
At the bottom there are 4 buttons to activate script functions.  The `generate` button will generate photoshop folder and masks based on the specifications of each export profile.  The `export` button will export each of the export folders once they are generated and tweaked by the artist.  `Clear folders` will delete any folders created by the script so the artist can start fresh.  And `exit` exits the script.

## **Intended Workflow**
Ideally, before the exporter is started, meaningful defaults would be established and hard coded into the script.  Information like the intended dimensions of the target UI elements in pixels, where the output textures should be stored, and the naming conventions can be edited in the script UI, but the best place to start is with well thought out defaults that make sense where possible.

The user should start with a flattened master image that they intend to use to make into sub image buttons and banners and other UI widgets.  The user would run the script so it can create a `POI` layer.  The user would then make a mark on the `POI` layer where the script should crop around, and run the script again.  The script will then create a UI based on whatever config it finds- `default config`, `last session config`, or `current PSD config`- whatever is available.  The user should then verify if the `base name` and the various `paths` are correct.  The user can make changes to the `export profiles` as desired, and hit `generate`.  The script will create a new photoshop document, save it in the `source` folder, and generate export folders based on the `export profiles` in the ui.

The user would then exit the script and make sure the composition is correct in each `export folder`.  Layers in the export folder can be added, painted on, moved, scaled, or manipulated in any way, but the folder mask and subfolders generated by the script should not be touched or renamed.

The user would then run the script again once they are happy with the final composition of each `export folder`, verify that the `export checkbox` is correct for `each profile` they want to export, and they hit the export button.  The script will produce a SPOT export texture for each profile with the checkbox active, in the folder specified in the `destination` field.  If the export process completes successfully, the script with exit itself.

The script will save the `source file` it creates and update its `profiles config` each time `generate` or `export` is clicked.