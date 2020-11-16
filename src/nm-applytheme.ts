import { _Sketch } from "sketch/sketch";
import { doUI } from "./command"
import nmRenamebot from "./nm-renamebot";
import { cleanID } from "./sketch-utils";

// Require all
var sketch: Sketch = require('sketch');
const pluginName = "Conversation Themer";



function getLibraryId(library: Library) {
    return library
        ? `${library.id}.${library.name}.${library.libraryType}`
        : null
}


function getCurrentlyReferencedLibraries(document: Document) {
    const librariesById = new Map()
    document.sharedLayerStyles.forEach(sharedStyle => {
        const library = sharedStyle.getLibrary();
        if (!library) return;
    
        librariesById.set(getLibraryId(library), library);
      });
    return Array.from(librariesById.values())
}


function replaceSharedStyles(
    document: Document,
    fromLibrary: Library,
    toLibrary: Library
  ) {
    const fromStyles = fromLibrary.getImportableLayerStyleReferencesForDocument(document);
    const toStyles = toLibrary.getImportableLayerStyleReferencesForDocument(document);
    const fromStylesById: Map<string, ImportableObject> = new Map
    const fromStylesByName: Map<string, ImportableObject> = new Map
    const toStylesById: Map<string, ImportableObject> = new Map
    const toStylesByName: Map<string, ImportableObject> = new Map
    const sharedStylesMap = new Map

    if(!toStyles){
      return
    }
    toStyles.forEach(libSharedStyle => {
        toStylesByName.set(libSharedStyle.name, libSharedStyle)
        toStylesById.set(libSharedStyle.id, libSharedStyle)
    });
    fromStyles.forEach(libSharedStyle => {
        fromStylesByName.set(libSharedStyle.name, libSharedStyle)
        fromStylesById.set(cleanID(libSharedStyle.id), libSharedStyle)
    });
  
    document.pages.forEach(page => {
      const nativeLayers = page.sketchObject.children();
      nativeLayers.forEach((nativelayer: object) => {
        const layer = sketch.fromNative<Layer>(nativelayer);
        //TODO: What about regular layers? Check that they are not skipped.
        if (layer.type ==  'SymbolInstance') {
          swapIt(layer, fromStylesById, toStylesByName);
        } else if (layer.type ==  'SymbolMaster') {
          const symbolMaster = layer as SymbolMaster
          symbolMaster.layers.forEach(layer => {
            if (layer.type == 'SymbolInstance'){
              swapIt(layer, fromStylesById, toStylesByName)
            }
          })
        }
      })
    })
  
    document.sharedLayerStyles.forEach(docSharedStyle => {
      const library = docSharedStyle.getLibrary();
      if (!library || getLibraryId(library) !== getLibraryId(fromLibrary)) {
        return;
      }
  
      const libSharedStyle = toStylesByName.get(docSharedStyle.name);
      if (!libSharedStyle) {
        return;
      }
  
      const importedSharedStyle = libSharedStyle.import() as unknown as SharedStyle;
      sharedStylesMap.set(docSharedStyle.id, importedSharedStyle.id);
      docSharedStyle.getAllInstancesLayers().forEach(layer => {
        //TODO: This ensures that local layers swap their styles - maybe there is some better way to do this in a way that is aligned with the overrides.
        const styledLayer: any = layer
        styledLayer.sharedStyleId = importedSharedStyle.id;
        layer.style.syncWithSharedStyle(importedSharedStyle);
        // console.log("Replaced " + layer.name + "'s style with " + importedSharedStyle.name)
      });
    });
  
    return sharedStylesMap;
}

function swapIt(layer: _Sketch.Layer, fromStylesById: Map<any, any>, toStylesByName: Map<any, any>) {
  const symbolInstance = layer as SymbolInstance;
  symbolInstance.overrides.forEach(override => {
    // if (override.value) {
      switch (override.property) {
        case "layerStyle":
          // console.log(override.isDefault)
            // if (layer.name === "conversation/1. default flow") console.log("Lookin at " + override.affectedLayer.name + ":" + (cleanValue ? cleanValue[1] : dirtyValue))
          const foundFromStyle = fromStylesById.get(cleanID(override.value as string)) as ImportableObject;
          if (foundFromStyle) {
              // if (layer.name === "conversation/1. default flow") console.log(override.affectedLayer.name + " should be swapped...")
            const foundToStyle = toStylesByName.get(foundFromStyle.name) as ImportableObject;
            if (foundToStyle) {
              const newStyle = foundToStyle.import() as Style;
                // if (layer.name === "conversation/1. default flow") console.log("...to " + foundToStyle.name)
              override.value = newStyle.id;
            }
          }
          break;
      }
    // }
  });
}

function updateSymbolsOverrides(
    _layerStylesMap: Map<any, any>
  ) {
      // console.log(layerStylesMap)
    // if (symbolInstances){
    //   symbolInstances.forEach(symbolInstance => {
    //     const overrides = overridesById?.get(symbolInstance.id);
    //     overrides?.forEach(override => {
    //       switch (override.property) {
    //         case "symbolID":
    //           //TODO: probably all these should be string, string?
    //           if (symbolsMap.has(override.value as string)) {
    //             override.value = symbolsMap.get(override.value as string) as string
    //           }
    //           break;
    
    //         case "layerStyle":
    //           if (layerStylesMap.has(override.value)) {
    //             override.value = layerStylesMap.get(override.value)
    //           }
    //           break;
    
    //         case "textStyle":
    //           if (textStylesMap.has(override.value)) {
    //             override.value = textStylesMap.get(override.value);
    //           }
    //           break;
    //       }
    //     });
    //   })
    // }
}


function replaceLibrary(document: Document, fromLibrary: Library, toLibrary: Library){
  
    const layerStylesMap = replaceSharedStyles(document, fromLibrary, toLibrary)
  
    if (layerStylesMap) {
      updateSymbolsOverrides(
        layerStylesMap
      )
    } else {
      console.log("SOMETHING HAS GONE HORRIBLY WRONG!")
    }
  
    document.sketchObject.reloadInspector()
}


export default function() {
    const document = sketch.getSelectedDocument();
    const sortFunc = (library1: Library, library2: Library) => {
      return library1.name.localeCompare(library2.name);
    }

    const fromLibraries = getCurrentlyReferencedLibraries(document).sort(
      sortFunc
    )

    if (fromLibraries.length === 0) {
      sketch.UI.alert(
        pluginName,
        "No instances of shared Symbols and Styles to replace."
      );
      return;
    }

    const toLibraries = sketch
      .getLibraries()
      .filter(library => library.valid && library.enabled)
      .sort(sortFunc)

    const { fromLibrary, toLibrary} = doUI(
      fromLibraries,
      toLibraries
    )
    
    replaceLibrary(document, fromLibrary, toLibrary);
  
    sketch.UI.message(
      `Replaced instances using “${fromLibrary.name}” with “${toLibrary.name}.”`
    )

    nmRenamebot()
}