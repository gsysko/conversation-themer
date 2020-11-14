import { _Sketch } from "sketch/sketch";
import { doUI } from "./command"

// Require all
var sketch: Sketch = require('sketch');
const pluginName = "Conversation Themer";

function getLibraryId(library: Library) {
    return library
        ? `${library.id}.${library.name}.${library.libraryType}`
        : null
}

function getReferencedLibrariesForSymbols(document: Document, librariesById: Map<string | null, Library>) {
    document.getSymbols().forEach(symbolMaster => {
        const library = symbolMaster.getLibrary()
        if (!library) return
        librariesById.set(getLibraryId(library), library)
    })
}

function getReferencedLibrariesForSharedStyles(
    sharedStyles: SharedStyle[],
    librariesById: Map<any, any>
  ) {
    sharedStyles.forEach(sharedStyle => {
      const library = sharedStyle.getLibrary();
      if (!library) return;
  
      librariesById.set(getLibraryId(library), library);
    });
  }

function getCurrentlyReferencedLibraries(document: Document) {
    const librariesById = new Map()
    getReferencedLibrariesForSymbols(document, librariesById)
    getReferencedLibrariesForSharedStyles(
        document.sharedLayerStyles,
        librariesById
    )
    getReferencedLibrariesForSharedStyles(
        document.sharedTextStyles,
        librariesById
    )
    return Array.from(librariesById.values())
}

function replaceSymbols(document: Document, fromLibraryId: string | null, toLibrary: Library){
  const overridesById: Map<string, Override[]> = new Map
  const docSymbols = document.getSymbols()
  let allSymbolInstances: SymbolInstance[] = []
  const symbolsMap: Map<string, string> = new Map

  if (!docSymbols.length) {
    return {symbolsMap, allSymbolInstances}
  }

  const libSymbols = toLibrary.getImportableSymbolReferencesForDocument(document)
  let libSymbolsByName: Map<string, ImportableObject> = new Map
  libSymbols.forEach( libSymbol => {
    libSymbolsByName.set(libSymbol.name, libSymbol)
  })

  document.pages.forEach(page => {
    const nativeLayers = page.sketchObject.children();
    nativeLayers.forEach((nativelayer: object) => {
      const layer = sketch.fromNative<Layer>(nativelayer);
      if (layer.type ==  'SymbolInstance') {
        const symbolInstance = layer as SymbolInstance
        symbolInstance.overrides.forEach(override => {
          if (override.property === "symbolID" && override.value){
            //Here are all the symbol overrides
            // console.log(override.value)
          }
        })
      }
    })
  })

  docSymbols.forEach(docSymbolMaster => {
    const library = docSymbolMaster.getLibrary()
    if (!library || getLibraryId(library) !== fromLibraryId) {
      //TODO: here I think I need to account for overrides
      return
    }
    const libSymbol = libSymbolsByName.get(docSymbolMaster.name);
    if (!libSymbol) {
      //TODO: here I think I need to account for overrides
      return
    }

    const importedSymbolMaster = libSymbol.import() as SymbolMaster
    symbolsMap.set(docSymbolMaster.symbolId, importedSymbolMaster.symbolId);

    const symbolInstances = docSymbolMaster.getAllInstances();
    allSymbolInstances = allSymbolInstances.concat(symbolInstances);
    symbolInstances.forEach(symbolInstance => {
      overridesById.set(symbolInstance.id, symbolInstance.overrides);
      symbolInstance.symbolId = importedSymbolMaster.symbolId;
    })

    //TODO: Determine if needed
    docSymbolMaster.remove
  })

  return { symbolsMap, symbolInstances: allSymbolInstances, overridesById }
}



function replaceSharedStyles(
  document: Document,
  docSharedStyles: SharedStyle[],
  libSharedStyles: ImportableObject[] | undefined,
  fromLibraryId: string | null
) {
  const sharedStylesMap = new Map

  const libSharedStylesByName = new Map
  if(!libSharedStyles){
    return
  }
  libSharedStyles.forEach(libSharedStyle => {
    libSharedStylesByName.set(libSharedStyle.name, libSharedStyle);
  });

  document.pages.forEach(page => {
    const nativeLayers = page.sketchObject.children();
    nativeLayers.forEach((nativelayer: object) => {
      const layer = sketch.fromNative<Layer>(nativelayer);
      if (layer.type ==  'SymbolInstance') {
        const symbolInstance = layer as SymbolInstance
        symbolInstance.overrides.forEach(override => {
          if (override.value){
            switch (override.property) {
              case "layerStyle":
                //do something with layer style
                console.log(override.value)
                break;
              case "textStyle":
                //do something with text style
                break;
            }
          }
        })
      }
    })
  })

  docSharedStyles.forEach(docSharedStyle => {
    const library = docSharedStyle.getLibrary();
    if (!library || getLibraryId(library) !== fromLibraryId) {
      return;
    }

    const libSharedStyle = libSharedStylesByName.get(docSharedStyle.name);
    if (!libSharedStyle) {
      return;
    }

    const importedSharedStyle = libSharedStyle.import();
    sharedStylesMap.set(docSharedStyle.id, importedSharedStyle.id);
    docSharedStyle.getAllInstancesLayers().forEach(layer => {
      //TODO: This could probably be done in some better way
      const styledLayer: any = layer
      styledLayer.sharedStyleId = importedSharedStyle.id;
      layer.style.syncWithSharedStyle(importedSharedStyle);
    });
  });

  return sharedStylesMap;
}



function updateSymbolsOverrides(
  symbolInstances: SymbolInstance[],
  overridesById: Map<string, Override[]>,
  symbolsMap: Map<string, string>,
  layerStylesMap: Map<any, any>,
  textStylesMap: Map<any, any>
) {
  if (symbolInstances){
    symbolInstances.forEach(symbolInstance => {
      const overrides = overridesById?.get(symbolInstance.id);
      overrides?.forEach(override => {
        switch (override.property) {
          case "symbolID":
            //TODO: probably all these should be string, string?
            if (symbolsMap.has(override.value as string)) {
              override.value = symbolsMap.get(override.value as string) as string
            }
            break;
  
          case "layerStyle":
            if (layerStylesMap.has(override.value)) {
              override.value = layerStylesMap.get(override.value)
            }
            break;
  
          case "textStyle":
            if (textStylesMap.has(override.value)) {
              override.value = textStylesMap.get(override.value);
            }
            break;
        }
      });
    })
  }
};

function getImportableSharedStyles(
  importableObjectType: string,
  document: Document,
  library: Library
) {
  switch (importableObjectType) {
    case "layerStyle":
      return library.getImportableLayerStyleReferencesForDocument(document);

    case "textStyle":
      return library.getImportableTextStyleReferencesForDocument(document);
  }
};

function replaceLibrary(document: Document, fromLibraryId: string | null, toLibrary: Library){
  const { symbolsMap, symbolInstances, overridesById } = replaceSymbols(document, fromLibraryId, toLibrary) 

  const importableLayerStyles = getImportableSharedStyles(
    "layerStyle",
    document,
    toLibrary
  );
  const layerStylesMap = replaceSharedStyles(document, document.sharedLayerStyles, importableLayerStyles, fromLibraryId)

  const importableTextStyles = getImportableSharedStyles(
    "textStyle",
    document,
    toLibrary
  )
  const textStylesMap = replaceSharedStyles(
    document,
    document.sharedTextStyles,
    importableTextStyles,
    fromLibraryId
  );

  if (symbolInstances && overridesById && layerStylesMap && textStylesMap) {
    updateSymbolsOverrides(
      symbolInstances,
      overridesById,
      symbolsMap,
      layerStylesMap,
      textStylesMap
    )
  } else {
    console.log("SOMETHING HAS GONE HORRIBLY WRANG!")
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
    
    replaceLibrary(document, getLibraryId(fromLibrary), toLibrary);
  
    sketch.UI.message(
      `Replaced instances using “${fromLibrary.name}” with “${toLibrary.name}.”`
    )
}
  